import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { DataMembers } from '../../../model/models';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { AuthService } from '../../../service/auth.service'; 

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.scss'
})
export class EditUserComponent implements OnInit{
   data!: DataMembers;
   fromreister!: FormGroup;
   files: { file: File; preview: string; newName?: string }[] = [];
   selectedFile?: File;
   imagePreview: string ="";
   isLoading: boolean = false;

  constructor(
     private fb: FormBuilder,
     private router : Router,
     private route: ActivatedRoute,
     private Constants: Constants, 
     private http: HttpClient,
     private readonly imageUploadService: ImageUploadService,
     private authService: AuthService){

  //   this.fromreister = this.fb.group({
  //     Email: ['', [Validators.required, Validators.email]],
  //     UserName: ['', Validators.required],
  //     Name: ['', Validators.required],
  //     LastName: ['', Validators.required],
  //     address: ['', Validators.required],
  //     Phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
  // });
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง");
      this.router.navigate(['/login']);
      return;
    }

    this.data = user;
    this.imagePreview = user.image_profile || "";

    // สร้างฟอร์มพร้อมเติมค่า
    this.fromreister = this.fb.group({
      Email: [user.email, [Validators.required, Validators.email]],
      UserName: [user.username, Validators.required],
      Name: [user.first_name, Validators.required],
      LastName: [user.last_name, Validators.required],
      address: [user.address, Validators.required],
      Phone: [user.phone, [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });
  }
  
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  // goToLogin(): void {
  //   this.router.navigate(['/login']);
  // }

  // back(){
  //   this.router.navigate(['/profile'],{ state: { data: this.data } });
  // }
  
  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }
  
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file; // เก็บไฟล์ที่เลือก
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result; // อัปเดตรูปตัวอย่างทันที
      };
      reader.readAsDataURL(file);
    }
  }
  

  // private generateRandomFileName(originalName: string): string {
  //   const extension = originalName.split('.').pop();
  //   return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
  // }

async save() {
  if (!this.data || !this.data.user_id) {
    console.error("User ID is missing!");
    alert("ไม่พบข้อมูลผู้ใช้");
    return;
  }

  let image = this.data?.image_profile || ""; // ใช้ค่าเริ่มต้น

  // ถ้ามีไฟล์ใหม่ อัปโหลดก่อน
  if (this.selectedFile) {
    try {
      const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
      image = response.data.url; // ใช้ URL รูปใหม่
    } catch (error) {
      console.error("Upload error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      return;
    }
  }

  const url = `${this.Constants.API_ENDPOINT}/edit/${this.data.user_id}`;
  const formData = {
      email: this.fromreister.value.Email,
      username: this.fromreister.value.UserName,
      first_name: this.fromreister.value.Name,
      last_name: this.fromreister.value.LastName,
      phone: this.fromreister.value.Phone,
      image_profile: image,
      address: this.fromreister.value.address,
  };

  this.isLoading = true;

  this.http.post(url, formData).subscribe({
    next: (response) => {
      const updatedUser = { ...this.data, ...formData };  // 🔁 รวมข้อมูลเดิมกับใหม่
      this.authService.setUser(updatedUser);              // ✅ อัปเดตใน AuthService
      this.data = updatedUser;                            // ✅ อัปเดตในตัวแปร local ด้วย

      console.log("Update success:", response);
      alert("บันทึกข้อมูลเรียบร้อย!");
      this.router.navigate(['/profile'], { state: { data: updatedUser } }); // ส่งข้อมูลล่าสุดไปด้วย
    },
    error: (error) => {
      console.error("Update error:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    },
    complete: () => {
      this.isLoading = false;
    }
  });
}


    back() {
    this.router.navigate(['/profile']);
  }
  
}
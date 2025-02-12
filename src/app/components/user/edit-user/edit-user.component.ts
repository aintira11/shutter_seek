import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { DataMembers } from '../../../model/models';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ImageUploadService } from '../../../services_image/image-upload.service';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.scss'
})
export class EditUserComponent {
  data: DataMembers[]=[];
   fromreister!: FormGroup;
   files: { file: File; preview: string; newName?: string }[] = [];
   selectedFile?: File;
   imagePreview: string ="";
  constructor(private fb: FormBuilder,private router : Router, private route: ActivatedRoute,private Constants: Constants, private http: HttpClient,private readonly imageUploadService: ImageUploadService){
    this.fromreister = this.fb.group({
      Email: ['', [Validators.required, Validators.email]],
      UserName: ['', Validators.required],
      Name: ['', Validators.required],
      LastName: ['', Validators.required],
      address: ['', Validators.required],
      Phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
  });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.data =window.history.state.data;
      console.log('Response:', this.data);
        // this.printdata();
        if (this.data[0]) { // เช็กว่ามี user_id หรือไม่
          //this.getdatauser(this.data.user_id);
          console.log("datauser",this.data);
        }
      });
      this.imagePreview = this.data[0].image_profile;
  }
  // goToLogin(): void {
  //   this.router.navigate(['/login']);
  // }

  back(){
    this.router.navigate(['/profile'],{ state: { data: this.data } });
  }

  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }
  
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file; // เก็บไฟล์ที่เลือก
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string; // อัปเดตตัวแปรรูปภาพ
      };
      reader.readAsDataURL(file);
    }
  }

  private generateRandomFileName(originalName: string): string {
    const extension = originalName.split('.').pop();
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
  }
  async save() {
    if (!this.data[0].user_id) {
      console.error("User ID is missing!");
      return;
    }
  
    let image = this.data[0].image_profile; // ใช้รูปเก่าเป็นค่าเริ่มต้น
  
    // อัปโหลดเฉพาะกรณีที่มีไฟล์ใหม่ถูกเลือก
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
  
    const url = this.Constants.API_ENDPOINT + '/edit/' + this.data[0].user_id;
    const formData = {
      email: this.fromreister.value.Email,
      username: this.fromreister.value.UserName,
      first_name: this.fromreister.value.Name,
      last_name: this.fromreister.value.LastName,
      phone: this.fromreister.value.Phone,
      image_profile: image, // ใช้รูปเก่าหากไม่ได้อัปโหลดใหม่
      address: this.fromreister.value.address,
    };
  
    this.http.post(url, formData).subscribe({
      next: (response) => {
        console.log("Update success:", response);
        alert("บันทึกข้อมูลเรียบร้อย!");
        this.router.navigate(['/profile'], { state: { data: this.data } });
      },
      error: (error) => {
        console.error("Update error:", error);
        alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      }
    });
  }
  
}

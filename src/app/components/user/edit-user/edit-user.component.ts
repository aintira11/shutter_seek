import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { DataMembers } from '../../../model/models';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { AuthService } from '../../../service/auth.service'; 
import { MatSnackBar } from '@angular/material/snack-bar';

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

   showModal = false;
   formChangePassword!: FormGroup;

  hidePassword = true;
  hideConfirmPassword = true;
  hidePasswordnew = true;
   

  constructor(
     private fb: FormBuilder,
     private router : Router,
    //  private route: ActivatedRoute,
     private Constants: Constants, 
     private http: HttpClient,
     private snackBar: MatSnackBar,
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
      address: [user.address],
      Phone: [user.phone, [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });

    this.formChangePassword = this.fb.group({
    old_password: ['', [Validators.required, this.noWhitespaceValidator]],
    new_password: ['',[
    Validators.required,
    this.noWhitespaceValidator,
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  ]],
    confirm_password: ['', [Validators.required, this.noWhitespaceValidator]],
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
  let hasImageChanged = false;

  // ถ้ามีไฟล์ใหม่ อัปโหลดก่อน
  if (this.selectedFile) {
    try {
      const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
      image = response.data.url; // ใช้ URL รูปใหม่
      hasImageChanged = true;
    } catch (error) {
      console.error("Upload error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      return;
    }
  }

  const formData = {
    username: this.fromreister.value.UserName,
    first_name: this.fromreister.value.Name,
    last_name: this.fromreister.value.LastName,
    phone: this.fromreister.value.Phone,
    image_profile: image,
    address: this.fromreister.value.address,
  };

  // ตรวจสอบค่าว่างหรือ whitespace
  for (const [key, value] of Object.entries(formData)) {
    if (key !== 'address' && typeof value === 'string' && value.trim() === '') {
      this.showSnackBar(`กรุณากรอกข้อมูล ${key}`);
      return;
    }
  }

  // เช็คการเปลี่ยนแปลงข้อมูล
  const hasDataChanged = this.checkDataChanges(formData, hasImageChanged);
  
  if (!hasDataChanged) {
    this.showSnackBar('ไม่มีการเปลี่ยนแปลงข้อมูล');
    return;
  }

  const url = `${this.Constants.API_ENDPOINT}/edit/${this.data.user_id}`;
  
  this.isLoading = true;

  this.http.post(url, formData).subscribe({
    next: (response) => {
      const updatedUser = { ...this.data, ...formData };  // 🔁 รวมข้อมูลเดิมกับใหม่
      this.authService.setUser(updatedUser);              // ✅ อัปเดตใน AuthService
      this.data = updatedUser;                            // ✅ อัปเดตในตัวแปร local ด้วย
      
      // console.log("Update success:", response);
      this.showSnackBar("บันทึกข้อมูลเรียบร้อย!");
      this.router.navigate(['/profile'], { state: { data: updatedUser } }); // ส่งข้อมูลล่าสุดไปด้วย
    },
    error: (error) => {
      console.error("Update error:", error);
      this.showSnackBar("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    },
    complete: () => {
      this.isLoading = false;
    }
  });
}

// ฟังก์ชันเช็คการเปลี่ยนแปลงข้อมูล
private checkDataChanges(newData: any, hasImageChanged: boolean): boolean {
  // เช็ครูปภาพก่อน
  if (hasImageChanged) {
    return true;
  }

  // เช็คข้อมูลอื่นๆ โดยเข้าถึง property โดยตรง
  const formValues = this.fromreister.value;
  
  // เปรียบเทียบทีละฟิลด์
  if ((formValues.UserName || '').trim() !== (this.data.username || '').trim()) {
    console.log('Username changed:', {
      original: this.data.username,
      new: formValues.UserName
    });
    return true;
  }

  if ((formValues.Name || '').trim() !== (this.data.first_name || '').trim()) {
    console.log('First name changed:', {
      original: this.data.first_name,
      new: formValues.Name
    });
    return true;
  }

  if ((formValues.LastName || '').trim() !== (this.data.last_name || '').trim()) {
    console.log('Last name changed:', {
      original: this.data.last_name,
      new: formValues.LastName
    });
    return true;
  }

  if ((formValues.Phone || '').trim() !== (this.data.phone || '').trim()) {
    console.log('Phone changed:', {
      original: this.data.phone,
      new: formValues.Phone
    });
    return true;
  }

  if ((formValues.address || '').trim() !== (this.data.address || '').trim()) {
    console.log('Address changed:', {
      original: this.data.address,
      new: formValues.address
    });
    return true;
  }

  return false;
}


change_password(){
    if (this.formChangePassword.invalid) return;

  const { new_password, confirm_password } = this.formChangePassword.value;

  if (new_password !== confirm_password) {
    alert('รหัสผ่านใหม่และยืนยันไม่ตรงกัน');
    return;
  }

  // เรียก API 
    const url = `${this.Constants.API_ENDPOINT}/change_password/`+ this.data.user_id;
    const formData = {
      old_password: this.formChangePassword.value.old_password,
      new_password: this.formChangePassword.value.new_password,
  };

    this.http.post(url, formData).subscribe({
    next: (response) => {
      // const updatedUser = { ...this.data, ...formData };  // 🔁 รวมข้อมูลเดิมกับใหม่
      // this.authService.setUser(updatedUser);              // ✅ อัปเดตใน AuthService
      // this.data = updatedUser;                            // ✅ อัปเดตในตัวแปร local ด้วย

      // console.log("Update success:", response);
      alert("บันทึกข้อมูลเรียบร้อย!");
      this.showModal = false;
      this.logout();
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

 noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // ให้ required validator จัดการกรณีที่ไม่มีค่า
    }
    
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }


togglePasswordVisibility(field: string) {
    if (field === 'old_password') {
      this.hidePassword = !this.hidePassword;
    } else if (field === 'new_password') {
      this.hidePasswordnew = !this.hidePasswordnew;
    }
    else if (field === 'confirm_password') {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }

  showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']); // กลับไปหน้า login
}

    back() {
    this.router.navigate(['/profile']);
  }
  
}
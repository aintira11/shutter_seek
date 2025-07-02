import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder,Validators,FormGroup, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { ReactiveFormsModule } from '@angular/forms';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  fromreister: FormGroup;
  selectedFile?: File; // เก็บไฟล์รูปภาพที่เลือก
  files: { file: File; preview: string; newName?: string }[] = [];
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(private Constants :Constants ,private http:HttpClient ,private fromBuilder : FormBuilder ,private router : Router,private readonly imageUploadService: ImageUploadService)
  {
    this.fromreister = this.fromBuilder.group({
      Email: ['', [Validators.required, Validators.email, this.noWhitespaceValidator]],
      Password: ['', [Validators.required, this.noWhitespaceValidator]],
      confirmPassword: ['', [Validators.required, this.noWhitespaceValidator]],
      UserName: ['', [Validators.required, this.noWhitespaceValidator]],
      Name: ['', [Validators.required, this.noWhitespaceValidator]],
      LastName: ['', [Validators.required, this.noWhitespaceValidator]],
      address: ['', ],
      Phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/), this.noWhitespaceValidator]]
    });
  
    
  }

  imagePreview: string = '/assets/images/user.png';
  
   noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // ให้ required validator จัดการกรณีที่ไม่มีค่า
    }
    
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }



  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  back(){
    this.router.navigate(['']);
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

  async register() {
  this.fromreister.markAllAsTouched();

  // ตรวจสอบความถูกต้องของฟอร์ม
  if (this.fromreister.invalid) {
    const firstErrorField = Object.keys(this.fromreister.controls).find(key =>
      this.fromreister.get(key)?.invalid
    );
    if (firstErrorField) {
      const element = document.querySelector(`[formControlName="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
    }
    alert('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
    return;
  }

  // ตรวจสอบรหัสผ่าน
  if (this.fromreister.value.Password !== this.fromreister.value.confirmPassword) {
    alert('ยืนยันรหัสผ่านไม่ถูกต้อง');
    return;
  }

  // เตรียม URL สำหรับเรียก API
  const url = this.Constants.API_ENDPOINT + '/register/member';

  // ประกาศตัวแปร image นอก if/else เพื่อใช้ต่อได้
  let image: string;

  try {
    // ถ้ามีการเลือกไฟล์
    if (this.selectedFile) {
      const randomName = this.generateRandomFileName(this.selectedFile.name); // ถ้าคุณใช้ชื่อใหม่
      const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
      image = response.data.url;
    } else {
      // ถ้าไม่ได้อัปโหลด ใช้รูป default
      image = 'https://cdn-icons-png.flaticon.com/512/18469/18469518.png';
    }

    // เตรียมข้อมูลที่ส่งไป API
    const formData = {
      email: this.fromreister.value.Email,
      password: this.fromreister.value.Password,
      username: this.fromreister.value.UserName,
      first_name: this.fromreister.value.Name,
      last_name: this.fromreister.value.LastName,
      phone: this.fromreister.value.Phone,
      image_profile: image,
      address: this.fromreister.value.address,
    };

    // ส่งข้อมูลไป API
    this.http.post(url, formData).subscribe({
      next: (res) => {
        console.log('สมัครสมาชิกสำเร็จ:', res);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('เกิดข้อผิดพลาด:', err);
        if (err.status === 409) {
          alert('มีอีเมลนี้อยู่ในระบบแล้ว');
        } else {
          alert('ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง');
        }
      }
    });
  } catch (error) {
    console.error('การอัปโหลดรูปผิดพลาด:', error);
    alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
  }
  
}

togglePasswordVisibility(field: string) {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } else if (field === 'confirmPassword') {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }
}


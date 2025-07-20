import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../../config/constants';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-addmin',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './addmin.component.html',
  styleUrl: './addmin.component.scss'
})
export class AddminComponent {
  fromaddmin: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  previewImage: string | ArrayBuffer | null = null;
  selectedFile?: File;
  imagePreview: string = '/assets/images/user.png';

  constructor(
    private router: Router,
    private Constants: Constants,
    private http: HttpClient,
    private fromBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private readonly imageUploadService: ImageUploadService,
  ) {
    this.fromaddmin = this.fromBuilder.group({
      Email: ['', [Validators.required, Validators.email, this.noWhitespaceValidator]],
      Password: [
        '',
        [
          Validators.required,
          this.noWhitespaceValidator,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        ]
      ],
      confirmPassword: ['', [Validators.required, this.noWhitespaceValidator]],
      UserName: ['', [Validators.required, this.noWhitespaceValidator]],
      Name: ['', [Validators.required, this.noWhitespaceValidator]],
      LastName: ['', [Validators.required, this.noWhitespaceValidator]],
      Phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/), this.noWhitespaceValidator]]
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

  goToadmin(): void {
    this.router.navigate(['/admin']);
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

  async submitForm(form: any) {
    this.fromaddmin.markAllAsTouched();

    // ตรวจสอบความถูกต้องของฟอร์ม
    if (this.fromaddmin.invalid) {
      const firstErrorField = Object.keys(this.fromaddmin.controls).find(key =>
        this.fromaddmin.get(key)?.invalid
      );
      if (firstErrorField) {
        const element = document.querySelector(`[formControlName="${firstErrorField}"]`) as HTMLElement;
        element?.focus();
      }
      this.showSnackBar('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
      return;
    }

    // ตรวจสอบรหัสผ่าน
    if (this.fromaddmin.value.Password !== this.fromaddmin.value.confirmPassword) {
      this.showSnackBar('ยืนยันรหัสผ่านไม่ถูกต้อง');
      return;
    }

    // เตรียม URL สำหรับเรียก API
    const url = this.Constants.API_ENDPOINT + '/register';

    try {
      // ประกาศตัวแปร image
      let image: string;

      // ถ้ามีการเลือกไฟล์
      if (this.selectedFile) {
        try {
          const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
          if (response && response.data && response.data.url) {
            image = response.data.url;
          } else {
            console.warn('Upload response invalid, using default image');
            image = 'https://cdn-icons-png.flaticon.com/512/18469/18469518.png';
          }
        } catch (uploadError) {
          console.warn('Image upload failed, using default image:', uploadError);
          image = 'https://cdn-icons-png.flaticon.com/512/18469/18469518.png';
        }
      } else {
        // ถ้าไม่ได้อัปโหลด ใช้รูป default
        image = 'https://cdn-icons-png.flaticon.com/512/18469/18469518.png';
      }

      // เตรียมข้อมูลที่ส่งไป API
      const formData = {
        email: this.fromaddmin.value.Email,
        password: this.fromaddmin.value.Password,
        username: this.fromaddmin.value.UserName,
        first_name: this.fromaddmin.value.Name,
        last_name: this.fromaddmin.value.LastName,
        phone: this.fromaddmin.value.Phone,
        image_profile: image,
        type_user: "3" 
      };

      console.log('Sending data:', formData); // สำหรับ debug

      // ส่งข้อมูลไป API
      this.http.post(url, formData).subscribe({
        next: (res) => {
          console.log('สมัครสมาชิกสำเร็จ:', res);
          this.showSnackBar('เพิ่มผู้ดูแลระบบสำเร็จ');
          setTimeout(() => {
            this.router.navigate(['/admin']);
          }, 1500);
        },
        error: (err) => {
          console.error('เกิดข้อผิดพลาด:', err);
          let errorMessage = 'ไม่สามารถเพิ่มผู้ดูแลระบบได้ กรุณาลองอีกครั้ง';
          
          if (err.error && err.error.message) {
            errorMessage = err.error.message;
          } else if (err.status === 400) {
            errorMessage = 'มีอีเมลนี้อยู่ในระบบแล้ว';
          } else if (err.status === 401) {
            errorMessage = 'ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว';
          } else if (err.status === 402) {
            errorMessage = 'เบอร์โทรนี้ถูกใช้ไปแล้ว';
          }
          
          this.showSnackBar(errorMessage);
        }
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาดทั่วไป:', error);
      this.showSnackBar('เกิดข้อผิดพลาดในการประมวลผล กรุณาลองอีกครั้ง');
    }
  }

  togglePasswordVisibility(field: string) {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } else if (field === 'confirmPassword') {
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

  cancel() {
    if (confirm('คุณต้องการยกเลิกหรือไม่?')) {
      this.fromaddmin.reset();
      this.imagePreview = '/assets/images/user.png';
      this.selectedFile = undefined;
      this.router.navigate(['/admin']);
    }
  }
}
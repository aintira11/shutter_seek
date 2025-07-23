import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Constants } from '../../config/constants';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  isContactValid: boolean = false;
  forgotForm: FormGroup;
  hidePasswordnew = true;
  hideConfirmPassword = true;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    private Constants: Constants,
    private http: HttpClient,
  ) {
    // สร้างฟอร์มจาก FormBuilder
    this.forgotForm = this.formBuilder.group({
      userType: ['', [Validators.required]],
      contact: ['', [Validators.required,this.noWhitespaceValidator]],
      newPassword: ['',[
    Validators.required,
    this.noWhitespaceValidator,
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  ]],
      confirmPassword: ['', [Validators.required, this.noWhitespaceValidator]],
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

  goBack() {
    this.router.navigate(['/login']);
  }

  validateContact() {
    const value = this.forgotForm.get('contact')?.value?.trim() || '';
    const isEmail = value.includes('@');
    const isPhone = /^[0-9]{10}$/.test(value);

    this.isContactValid = isEmail || isPhone;
  }

  onSubmit() {
    try {
      this.forgotForm.markAllAsTouched();
      
      // ตรวจสอบความถูกต้องของฟอร์ม
      if (this.forgotForm.invalid) {
        const firstErrorField = Object.keys(this.forgotForm.controls).find(key =>
          this.forgotForm.get(key)?.invalid
        );
        if (firstErrorField) {
          const element = document.querySelector(`[formControlName="${firstErrorField}"]`) as HTMLElement;
          element?.focus();
        }
        this.showSnackBar('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
        return;
      }

      // ตรวจสอบความถูกต้องของ contact
      if (!this.isContactValid) {
        this.showSnackBar('กรุณากรอกอีเมลหรือเบอร์โทรให้ถูกต้อง');
        return;
      }

      const newPassword = this.forgotForm.get('newPassword')?.value;
      const confirmPassword = this.forgotForm.get('confirmPassword')?.value;

      if (newPassword !== confirmPassword) {
        this.showSnackBar('รหัสผ่านไม่ตรงกัน');
        return;
      }

      const url = this.Constants.API_ENDPOINT + '/reset_password';

      // เตรียมข้อมูลที่ส่งไป API
      const formData = {
        email_or_phone: this.forgotForm.get('contact')?.value,
        type_user: this.forgotForm.get('userType')?.value,
        new_password: newPassword
      };

      // ส่งข้อมูลไป API
      this.http.post(url, formData).subscribe({
        next: (res: any) => {
          console.log('รีเซ็ตรหัสผ่านสำเร็จ:', res);
          this.showSnackBar('รีเซ็ตรหัสผ่านเรียบร้อยแล้ว');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err) => {
          console.error('เกิดข้อผิดพลาด:', err);
          if (err.status === 404) {
            this.showSnackBar('ไม่พบผู้ใช้ที่ตรงกับข้อมูลที่ระบุ');
          } else if (err.status === 400) {
            this.showSnackBar('กรุณาระบุข้อมูลให้ครบถ้วน');
          } else if (err.status === 405) {
            this.showSnackBar('รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม');
          } else{
            this.showSnackBar('ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองอีกครั้ง');
          }
        }
      });
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      this.showSnackBar('เกิดข้อผิดพลาดในระบบ กรุณาลองอีกครั้ง');
    } 
  }

  showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  togglePasswordVisibility(field: string) {
    if (field === 'newPassword') { 
      this.hidePasswordnew = !this.hidePasswordnew;
    } else if (field === 'confirmPassword') {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }

    triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }
}
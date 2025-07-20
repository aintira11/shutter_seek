import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  formData = {
    userType: '',
    contact: '',
    newPassword: '',
    confirmPassword: ''
  };

  isContactValid: boolean = false;

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/login']);
  }

  validateContact() {
    const value = this.formData.contact.trim();
    const isEmail = value.includes('@');
    const isPhone = /^[0-9]{10}$/.test(value);

    this.isContactValid = isEmail || isPhone;
  }

  onSubmit() {
    if (!this.isContactValid) {
      alert('กรุณากรอกอีเมลที่มี "@" หรือเบอร์โทร 10 หลัก');
      return;
    }

    if (this.formData.newPassword !== this.formData.confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }

    // ส่งข้อมูลไป backend
    console.log('ข้อมูลที่กรอก:', this.formData);
    alert('รีเซตรหัสผ่านสำเร็จ');
    this.router.navigate(['/login']);
  }
}

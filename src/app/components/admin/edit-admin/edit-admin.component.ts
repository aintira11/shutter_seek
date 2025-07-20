import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-admin.component.html',
  styleUrl:  './edit-admin.component.scss'
  
})

export class EditAdminComponent {

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/admin']);
  }

  form = {
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: ''
  };

  previewImage: string | ArrayBuffer | null = null;
  selectedFile?: File;
  imagePreview: string = '/assets/images/user.png';
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

  onSubmit() {
    if (!this.form.email || !this.form.email.includes('@')) {
      alert('อีเมลไม่ถูกต้อง');
      return;
    }
  
    if (!this.form.phone || !/^[0-9]{10}$/.test(this.form.phone)) {
      alert('เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
      return;
    }
  
    if (this.form.password !== this.form.confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }
  
    console.log('Form Submitted:', this.form);
    alert('ข้อมูลถูกบันทึกเรียบร้อยแล้ว');
  }
  
  ngOnInit() {
    const existingUser = {
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      email: 'somchai@example.com',
      username: 'somchai01',
      phone: '0812345678',
      password: '',
      confirmPassword: ''
    };
  
    this.form = { ...existingUser };
  }
  

  

}

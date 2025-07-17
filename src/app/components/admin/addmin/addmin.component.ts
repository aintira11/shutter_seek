import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-addmin',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './addmin.component.html',
  styleUrl: './addmin.component.scss'
})
export class AddminComponent {
  constructor(private router : Router){}

  goToadmin(): void {
    this.router.navigate(['/admin']);
  }
  adminData = {
    name: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '', 
    phone: '' ,
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

  passwordsDontMatch: boolean = false;

  submitForm(form: any) {
    if (form.invalid) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
  
    if (this.adminData.password !== this.adminData.confirmPassword) {
      this.passwordsDontMatch = true;
      return;
    } else {
      this.passwordsDontMatch = false;
    }
  
    console.log('Admin Data:', this.adminData);
    alert('ข้อมูลถูกบันทึกเรียบร้อยแล้ว');
  }
  

  cancel() {
    if (confirm('คุณต้องการยกเลิกหรือไม่?')) {
      this.adminData = {
        name: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '', 
        phone: '' ,
      };
    }
  }
}


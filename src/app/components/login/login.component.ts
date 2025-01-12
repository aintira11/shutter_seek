import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { DataMembers } from '../../model/models';
import { Constants } from '../../config/constants';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'], // ใช้ styleUrls แก้เป็น stylesUrl
})
export class LoginComponent {
  loginForm: FormGroup;
  dataLogin: DataMembers[] = [];

  constructor(
    private constants: Constants,
    private router: Router,
    private http: HttpClient,
    private formBuilder: FormBuilder
  ) {
    // สร้างฟอร์มจาก FormBuilder
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  async login(): Promise<void> {
    const url = this.constants.API_ENDPOINT+'/login'; // URL API Login

    if (this.loginForm.invalid) {
      alert('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    try {
      // ดึงค่าจากฟอร์ม
      const formData = this.loginForm.value;

      // เรียก API และรอผลลัพธ์
      const data = await lastValueFrom(
        this.http.post<DataMembers[]>(url, formData)
      );

      this.dataLogin = data;

      // แสดงข้อมูลใน Console
      console.log('API Response:', this.dataLogin);
      
      if (this.dataLogin.length > 0) {
        console.log('Login Successful:', this.dataLogin);
        const user = this.dataLogin[0]; // สมมติว่าใช้ผู้ใช้งานคนแรก
        if (user.type_user === 3) {
          this.router.navigate(['/admin'], { state: { data: user } });
        } else if (user.type_user === 2) {
          this.router.navigate(['/shutter']);
        } else if (user.type_user === 1) {
          this.router.navigate(['/'], { state: { data: user } });
        }
      } else {
        alert('ไม่พบผู้ใช้งาน กรุณาตรวจสอบข้อมูลอีกครั้ง');
      }
    } catch (error) {
      console.error('Login Failed:', error);
      alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  }
}

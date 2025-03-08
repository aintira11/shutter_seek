import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { DataMembers } from '../../model/models';
import { Constants } from '../../config/constants';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, CommonModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss', // ใช้ styleUrls แก้เป็น stylesUrl
})
export class LoginComponent {
  loginForm: FormGroup;
  dataLogin: DataMembers[] = [];
  // สร้างตัวแปรสถานะเริ่มต้นโมเดลเป็นปิด
  isModelOpen: boolean = false;
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
    const url = this.constants.API_ENDPOINT+'/login'; 

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

      this.dataLogin = data as DataMembers[];
      
      // แสดงข้อมูลใน Console
      console.log('API Response:', this.dataLogin);
      
      if (this.dataLogin.length == 1) {
        console.log('Login Successful:', this.dataLogin);
        const user = this.dataLogin[0]; 
        const userShutter = this.dataLogin[1]; 
        if (user.type_user === 3) {
          this.router.navigate(['/admin'], { state: { data: user } });
        } else if (user.type_user === 2 ) {
          // this.router.navigate(['/mainshutter']);
          this.router.navigate(['/mainshutter'], { state: { data: user } });
        } else if (user.type_user === 1) {
          this.router.navigate(['/'], { state: { data: user} });
        }
      } else {
        this.isModelOpen = true;
      }
    } catch (error) {
      console.error('Login Failed:', error);
      alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  }
  choose(type_user : number){

    if (type_user === 2 ) {
      // this.router.navigate(['/shutter'], { state: { data: user} });
      this.router.navigate(['/mainshutter'], { state: { data: this.dataLogin[1]} });
      this.isModelOpen = false;
    } else if (type_user === 1) {
      this.router.navigate(['/'], { state: { data: this.dataLogin[0]} });
      this.isModelOpen = false;
    }
  }
    
}

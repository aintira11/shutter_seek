import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { DataMembers } from '../../model/models';
import { Constants } from '../../config/constants';
import { HttpClientModule  } from '@angular/common/http';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule
    ,CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  constructor(private Constants :Constants,private router : Router,private http:HttpClient ,private fromBuilder : FormBuilder){}
  modeluser : DataMembers[]=[];
  dataLogin:any[]=[];

  fromreister = this.fromBuilder.group({
    email:['',Validators.required],
    password :['',Validators.required]
});
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  async login(email: HTMLInputElement, password: HTMLInputElement): Promise<void> {
    //const url = `${this.Constants.API_ENDPOINT}/login`;
    const url = `http://localhost:3000/login`;
      // ดึงข้อมูลจาก Reactive Form
      const formData = {
        email: this.fromreister.value.email,
        password: this.fromreister.value.password
      };
  
      // ส่งคำขอแบบ POST พร้อม body
      const data = await lastValueFrom(
        this.http.post<DataMembers[]>(url, formData)
      );
  
      this.dataLogin = data;
  
      // แสดงข้อมูลเพื่อ Debug
      console.log('API Response:', this.dataLogin);
  
      if (this.dataLogin.length > 0) {
        console.log('Login Successful:', this.dataLogin);
        const isAdmin = this.dataLogin.some(user => user.type_user === 3);
        const isUser = this.dataLogin.some(user => user.type_user === 1);
        const isShutt = this.dataLogin.some(user => user.type_user === 2);
  
        if (isAdmin) {
          this.router.navigate(['/admin'], { state: { data: this.dataLogin[0] } });
        } else if (isUser) {
          this.router.navigate(['/shutter']);
        } else if (isShutt) {
          this.router.navigate(['/'], { state: { data: this.dataLogin[0] } });
        }
      } else {
        alert('Please check your email and password again.');
      }
    
  }
}
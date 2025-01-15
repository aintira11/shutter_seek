import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [FormsModule,
       MatFormFieldModule,
       MatInputModule,
       MatButtonModule,
       RouterModule,
       ReactiveFormsModule,
       CommonModule
      ],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss'
})
export class CreateAccountComponent implements OnInit{
    fromreister!: FormGroup;
    hidePassword = true;
    hideConfirmPassword = true;
    constructor(private fb: FormBuilder,private router : Router,private Constants :Constants ,private http:HttpClient ,)
    {
    //   this.fromreister = this.fromBuilder.group({
    //     Email: ['', [Validators.required, Validators.email]],
    //     Password: ['', Validators.required],
    //     confirmPassword: ['', Validators.required],
    //     Phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    // });
    }
    ngOnInit(): void {
      this.fromreister = this.fb.group({
        Email: ['', [Validators.required, Validators.email]],
        Phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // เบอร์โทร 10 หลัก
        //Password: ['', [Validators.required, Validators.minLength(6)]], ////ขั้นต่ำ 6 ตัว
        Password: ['', Validators.required],
        confirmPassword: ['', Validators.required],
      });
    }
    register() {
      if (this.fromreister.valid) {
        console.log('Form Data:', this.fromreister.value);
    
        if (this.fromreister.value.Password !== this.fromreister.value.confirmPassword) {
          alert('ยืนยันรหัสผ่านไม่ถูกต้อง');
          return;
        }
    
        const url = this.Constants.API_ENDPOINT + '/shutter/register/shutt';
        const formData = {
          email: this.fromreister.value.Email,
          password: this.fromreister.value.Password,
          phone: this.fromreister.value.Phone,
        };
    
        this.http.post(url, formData).subscribe({
          next: (res: any) => {
            console.log('Response from API:', res);
    
            // ส่งข้อมูลที่ได้จาก API ไปยังหน้าถัดไป
            this.router.navigate(['/creatfro'], {
              state: { data: res } // ส่งข้อมูลผ่าน state
            });
          },
          error: (err) => {
            console.error('Error:', err);
    
            if (err.status === 409) {
              alert('มีอีเมลนี้อยู่ในระบบแล้ว');
            } else {
              alert('ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง');
            }
          },
        });
      } else {
        console.error('Form is invalid');
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
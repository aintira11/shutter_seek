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
import { AuthService } from '../../service/auth.service';

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

  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private constants: Constants,
    private router: Router,
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private authService: AuthService,
  ) {
    // สร้างฟอร์มจาก FormBuilder
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  togglePasswordVisibility(field: string) {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } 
  }

async login(): Promise<void> {
  const url = this.constants.API_ENDPOINT + '/login';

  if (this.loginForm.invalid) {
    alert('กรุณากรอก username และรหัสผ่านให้ครบถ้วน');
    return;
  }

  try {
    const formData = this.loginForm.value;
    const data = await lastValueFrom(
      this.http.post<DataMembers[]>(url, formData)
    );

    this.dataLogin = data as DataMembers[];

    if (this.dataLogin.length === 1) {
      const user = this.dataLogin[0];
      const userType = Number(user.type_user);

      // ไปดึงข้อมูลผู้ใช้เต็มจาก /read/:id
      this.getFullUserData(user.user_id, userType);
    } else {
      this.isModelOpen = true;
    }

  } catch (error) {
    console.error('Login Failed:', error);
    alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
  }
}


choose(type_user: string) {
  if (type_user === '2') {
    const shutter = this.dataLogin[1];
    sessionStorage.setItem('user', JSON.stringify(shutter));
    this.router.navigate(['/mainshutter']);
    this.isModelOpen = false;
  } else if (type_user === '1') {
    const member = this.dataLogin[0];
    sessionStorage.setItem('user', JSON.stringify(member));
    this.router.navigate(['/']);
    this.isModelOpen = false;
  }
}

getFullUserData(id: number, userType: number): void {
  const url = this.constants.API_ENDPOINT + '/read/' + id;

  this.http.get<DataMembers[]>(url).subscribe({
    next: (fullUserData) => {
      if (fullUserData.length > 0) {
        const user = fullUserData[0];

        //  เก็บข้อมูลไว้ใน AuthService
        this.authService.setUser(user);

        //  (ถ้าต้องการ) เก็บไว้ใน sessionStorage ด้วย
        sessionStorage.setItem('user', JSON.stringify(user));

        //  นำทางตาม user type
        if (userType === 3) {
          this.router.navigate(['/admin']);
        } else if (userType === 2) {
          this.router.navigate(['/mainshutter']);
          //  this.isModelOpen = false;
        } else if (userType === 1) {
          this.router.navigate(['/']);
          // this.isModelOpen = false;
        }
      } else {
        alert('ไม่พบข้อมูลผู้ใช้');
      }
    },
    error: (err) => {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้:", err);
    }
  });
}

back(){
    this.router.navigate(['']);
  }

}

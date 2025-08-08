import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { DataMembers } from '../../model/models';
import { Constants } from '../../config/constants';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { user } from '@angular/fire/auth';
// --- Firebase Imports ---
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';

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
  // --- ใช้ inject function สำหรับ Firebase Auth ---
  private auth: Auth = inject(Auth);

  constructor(
    private constants: Constants,
    private router: Router,
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {
    // สร้างฟอร์มจาก FormBuilder
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    
    // *** เพิ่มส่วนนี้เพื่อบังคับให้แสดงหน้าต่างเลือกบัญชีทุกครั้ง ***
    provider.setCustomParameters({
      prompt: 'select_account' 
    });

    try {
      // 1. เปิดหน้าต่างล็อกอินของ Google ผ่าน Firebase
      const result = await signInWithPopup(this.auth, provider);
      const userEmail = result.user.email;

      if (!userEmail) {
        this.showSnackBar('ไม่สามารถดึงข้อมูลอีเมลจาก Google ได้');
        return;
      }

      // 2. ส่งอีเมลไปตรวจสอบกับ Backend 
      const url = this.constants.API_ENDPOINT + '/auth/google-check';
      const body = { email: userEmail };
      
      // ใช้ lastValueFrom เพื่อรอผลลัพธ์จาก API
      const responseData = await lastValueFrom(
        this.http.post<DataMembers[]>(url, body)
      );

      // 3. ถ้าสำเร็จ (เจอผู้ใช้) 
      this.dataLogin = responseData;
      if (this.dataLogin.length > 0) {
        const user = this.dataLogin[0];
        const userType = Number(user.type_user);

        if (userType === 4) {
          this.isModelOpen = true; // แสดง Modal ให้เลือกโหมด
        } else {
          this.getFullUserDataAsync(user.user_id, userType); 
        }
      }

    } catch (error: any) {
      // 4. จัดการข้อผิดพลาด
      if (error.status === 404) {
        // Backend แจ้งว่าไม่พบอีเมลนี้
        this.showSnackBar('ไม่พบอีเมลนี้ในระบบ กรุณาสมัครสมาชิกก่อน');
      } else if (error.code !== 'auth/popup-closed-by-user') {
        // ข้อผิดพลาดอื่นๆ (ยกเว้นกรณีผู้ใช้ปิดหน้าต่างเอง)
        console.error('Google Sign-In Failed:', error);
        this.showSnackBar('การเข้าสู่ระบบด้วย Google ล้มเหลว');
      }
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  togglePasswordVisibility(field: string) {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } 
  }

// TypeScript Component Code
async login(): Promise<void> {
  const url = this.constants.API_ENDPOINT + '/login';
  
  if (this.loginForm.invalid) {
    this.showSnackBar('กรุณากรอก username และรหัสผ่านให้ครบถ้วน');
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
      
      if (userType === 4) {
        // ผู้ใช้ที่เป็นทั้งสมาชิกทั่วไปและช่างภาพ - แสดงโมเดลให้เลือก
        this.getFullUserDataAsync(user.user_id, userType);
        this.isModelOpen = true;
      } else {
        // ผู้ใช้ธรรมดา - เข้าสู่ระบบตามประเภทที่กำหนด
        this.getFullUserDataAsync(user.user_id, userType);
      }
    } else {
      this.showSnackBar('ไม่พบข้อมูลผู้ใช้');
    }
  } catch (error: any) {
    // console.error('Login Failed:', error);
    if (error.status === 401) {
      this.showSnackBar('ชื่อผู้ใช้และรหัสผ่านไม่ตรงกัน');
    } else if (error.status === 404) {
      // console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้:", error);
      this.showSnackBar('เกิดข้อผิดพลาดในการส่งรายงาน กรุณาลองใหม่อีกครั้ง');
    }
  }
}

async choose(selectedType: string, user_id: number) {
  const user = this.dataLogin[0];
  const userType = Number(selectedType);
  
  if (selectedType === '2' || selectedType === 'Shutter') {
    // เลือกใช้งานในโหมดช่างภาพ
    await this.getFullUserDataAsync(user_id, userType, 'shutter');
  } else if (selectedType === '1' || selectedType === 'Member') {
    // เลือกใช้งานในโหมดสมาชิกทั่วไป  
    await this.getFullUserDataAsync(user_id, userType, 'member');
  }
}


closeModal(event: Event) {
  // ปิดโมเดลเฉพาะเมื่อคลิกนอกเนื้อหาโมเดล
  if (event.target === event.currentTarget) {
    this.isModelOpen = false;
  }
}

async getFullUserDataAsync(id: number, userType: number, mode?: string): Promise<void> {
  const url = this.constants.API_ENDPOINT + '/read/' + id;
  
  try {
    const fullUserData = await lastValueFrom(this.http.get<DataMembers[]>(url));
    
    if (fullUserData.length > 0) {
      const user = fullUserData[0];
      
      // สำหรับ Type 4 ให้เพิ่ม current_mode
      const finalUser = userType === 4 && mode ? { ...user, current_mode: mode } : user;

      // เก็บข้อมูลไว้ใน AuthService
      this.authService.setUser(finalUser);

      // เก็บไว้ใน sessionStorage ด้วย
      sessionStorage.setItem('user', JSON.stringify(finalUser));

      // นำทางตาม user type หรือ mode
      if (userType === 4 && mode) {
        if (mode === 'shutter') {
          this.router.navigate(['/mainshutter']);
        } else if (mode === 'member') {
          this.router.navigate(['/']);
        }
        this.isModelOpen = false;
      } else {
        if (userType === 3) {
          this.router.navigate(['/admin']);
        } else if (userType === 2) {
          this.router.navigate(['/mainshutter']);
        } else if (userType === 1) {
          this.router.navigate(['/']);
        }
      }
    } else {
      this.showSnackBar('ไม่พบข้อมูลผู้ใช้');
    }
  } catch (error: any) {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้:", error);
    if (error.status === 401) {
      this.showSnackBar('คุณได้รายงานช่างภาพนี้ไปแล้ว ไม่สามารถรายงานซ้ำได้');
    } else {
      this.showSnackBar('เกิดข้อผิดพลาดในการส่งรายงาน กรุณาลองใหม่อีกครั้ง');
    }
  }
}

// เพิ่มฟังก์ชันสำหรับสร้างตัวเลือกสำหรับผู้ใช้ที่มี userType=4
getUserOptions(): any[] {
  if (this.dataLogin.length === 1 && Number(this.dataLogin[0].type_user) === 4) {
    const user = this.dataLogin[0];
    return [
      {
        ...user,
        display_type: 'Member',
        display_name: 'สมาชิกทั่วไป',
        type_value: '1',
        icon: 'person'

      },
      {
        ...user,
        display_type: 'Shutter', 
        display_name: 'ช่างภาพ',
        type_value: '2',
        icon: 'camera'
      }
    ];
  }
  return [];
}

   showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
 
back(){
    this.router.navigate(['']);
  }




}

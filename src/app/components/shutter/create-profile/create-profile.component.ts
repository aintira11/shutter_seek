import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import jsonData from '../../../../assets/thai_provinces.json'
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../../config/constants';
import { DataMembers } from '../../../model/models';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { AuthService } from '../../../service/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-create-profile',
  standalone: true,
  imports: [MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './create-profile.component.html',
  styleUrl: './create-profile.component.scss'
})
export class CreateProfileComponent implements OnInit {
  thaijson = jsonData
  thai : any;
  imagePreview: string = 'https://cdn-icons-png.flaticon.com/512/954/954560.png'; // รูปภาพเริ่มต้น
  selectedFile?: File; // เก็บไฟล์รูปภาพที่เลือก

  data: any = {};
  // data = 9;
  datauser: DataMembers[] = [];
  fromreister!: FormGroup;
  files: { file: File; preview: string; newName?: string }[] = [];
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(private fb: FormBuilder,
    private router : Router,
    private Constants: Constants, 
    private route: ActivatedRoute, 
    private http: HttpClient,
    private readonly imageUploadService: ImageUploadService
    ,private authService: AuthService,
    private snackBar: MatSnackBar,
  ){ 
    // console.log(this.thaijson);

     this.fromreister = this.fb.group({
            email: ['', [Validators.required, Validators.email, this.noWhitespaceValidator, this.StrictEmailValidator]],
            phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // เบอร์โทร 10 หลัก
            UserName: ['', [Validators.required, this.noWhitespaceValidator]],
            Name: ['', [Validators.required, this.noWhitespaceValidator]],
            LastName: ['', [Validators.required, this.noWhitespaceValidator]],
            address: [''],
            province: ['',],
            Password: [
  '',
  [
    Validators.required,
    this.noWhitespaceValidator,
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  ]
],
            confirmPassword: ['', [Validators.required, this.noWhitespaceValidator]],
          });
  }
  
  ngOnInit(){
    // // รับข้อมูลจากหน้าที่ส่งมา
    // this.route.paramMap.subscribe(() => {
    //     // ตรวจสอบว่า state มีข้อมูลหรือไม่
    //     if (window.history.state && window.history.state.data) {
    //         this.data = window.history.state.data;

    //         console.log('Response:', this.data);

    //         // ตรวจสอบว่ามี last_idx หรือไม่ก่อนใช้งาน
    //         if (this.data.last_idx) {
    //             this.getdatauser(this.data.last_idx); // ส่ง last_idx ไปยังฟังก์ชัน
    //         } else {
    //             console.error('last_idx is missing in data:', this.data);
    //         }
    //     } else {
    //         console.error('No data found in history state');
    //     }
    // });
}

getdatauser(id: number) {
  // console.log('id', id);
  const url = this.Constants.API_ENDPOINT + '/read/' + id;
  this.http.get<DataMembers[]>(url).subscribe({
    next: (fullUserData) => {
      if (fullUserData.length > 0) {
        const user = fullUserData[0];

        //  เก็บข้อมูลไว้ใน AuthService
        this.authService.setUser(user);

        //  (ถ้าต้องการ) เก็บไว้ใน sessionStorage ด้วย
        sessionStorage.setItem('user', JSON.stringify(user));
        console.log("บันทึก sessionStorage สำเร็จ")
      } else {
        alert('ไม่พบข้อมูลผู้ใช้');
      }
    },
    error: (err) => {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้:", err);
    }
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

  StrictEmailValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  if (!email) return null;

  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email) ? null : { invalidEmailFormat: true };
}

private generateRandomFileName(originalName: string): string {
  const extension = originalName.split('.').pop();
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
}

// เพิ่มตัวแปรสำหรับติดตาม loading state
isRegistering = false;

  async base_for_shutt() {
  // เพิ่มการป้องกันการ submit ซ้ำ
  if (this.isRegistering) {
    console.log('Registration is already in progress - blocked duplicate submit');
    return; // เปลี่ยนจาก return false เป็น return
  }

  console.log('Starting registration process...');

  // Set flag ทันทีเพื่อป้องกันการ click ซ้ำ
  this.isRegistering = true;
  console.log('Set isRegistering to true immediately');

  this.fromreister.markAllAsTouched();
  
  // ตรวจสอบความถูกต้องของฟอร์ม
  if (this.fromreister.invalid) {
    this.isRegistering = false; // reset flag ถ้า validation ไม่ผ่าน
    console.log('Form invalid - reset isRegistering to false');
    
    const firstErrorField = Object.keys(this.fromreister.controls).find(key =>
      this.fromreister.get(key)?.invalid
    );
    if (firstErrorField) {
      const element = document.querySelector(`[formControlName="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
    }
    this.showSnackBar('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
    return;
  }
  // ตรวจสอบเมลล์ซ้ำ
  const checkEmailUrl = this.Constants.API_ENDPOINT + '/check-email';

  const email = this.fromreister.value.email;
  const type_user = '2'; // สมัครในบทบาท user
  const checkBody = { email, type_user };
   const checkRes: any = await this.http.post(checkEmailUrl, checkBody).toPromise();

    if (checkRes.exists && checkRes.updatePrompt) {
      const confirmed = confirm(checkRes.message || 'อีเมลนี้ถูกใช้สมัครไว้ในบทบาทอื่นแล้ว ต้องการใช้ข้อมูลนี้เพิ่มบทบาทหรือไม่?');
      if (!confirmed) {
        this.showSnackBar('ยกเลิกการสมัครสมาชิก');
        return;
      }
      // หากยืนยัน จะดำเนินการสมัครต่อ
    } else if (checkRes.exists) {
      // ถ้าเคยสมัครไว้แล้วในบทบาทนี้
      this.showSnackBar('อีเมลนี้ได้สมัครไว้แล้วกับบทบาทนี้');
      return;
    }
   
  // ตรวจสอบรหัสผ่าน
  if (this.fromreister.value.Password !== this.fromreister.value.confirmPassword) {
    this.isRegistering = false; // reset flag ถ้ารหัสผ่านไม่ตรงกัน
    console.log('Password mismatch - reset isRegistering to false');
    this.showSnackBar('ยืนยันรหัสผ่านไม่ถูกต้อง');
    return;
  }
   
  const url = this.Constants.API_ENDPOINT + '/register';
  
  // ตรวจสอบว่ามีการเลือกไฟล์หรือไม่
  if (this.selectedFile) {
    // อัปโหลดรูปภาพก่อน
    this.imageUploadService.uploadImage(this.selectedFile).subscribe({
      next: (response: any) => {
        console.log('Image upload success');
        const imageUrl = response?.data?.url || 'https://cdn-icons-png.flaticon.com/512/954/954560.png';
        this.submitRegistration(url, imageUrl);
      },
      error: (error) => {
        console.error('การอัปโหลดรูปผิดพลาด:', error);
        this.showSnackBar('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        this.isRegistering = false;
        console.log('Set isRegistering to false (image upload error)');
      }
    });
  } else {
    // ไม่มีรูปภาพ ใช้รูป default
    console.log('No image selected, using default');
    const defaultImage = 'https://cdn-icons-png.flaticon.com/512/954/954560.png';
    this.submitRegistration(url, defaultImage);
  }
}

private submitRegistration(url: string, imageUrl: string) {
  // ตรวจสอบอีกครั้งก่อน submit และเพิ่มการป้องกันเพิ่มเติม
  if (!this.isRegistering) {
    console.log('Registration process was cancelled');
    return;
  }

  console.log('Submitting registration...');
  
  const formData = {
    email: this.fromreister.value.email,
    username: this.fromreister.value.UserName,
    first_name: this.fromreister.value.Name,
    last_name: this.fromreister.value.LastName,
    phone: this.fromreister.value.phone,
    address: this.fromreister.value.address,
    province: this.fromreister.value.province,
    password: this.fromreister.value.Password,
    image_profile: imageUrl,
    type_user: "2",
    // เพิ่มข้อมูลเพื่อระบุสถานะการสมัคร
    sth_status: "1", // สถานะการสมัคร
    created_at: new Date().toISOString() // timestamp เพื่อป้องกันการสร้างซ้ำ
  };

  // เพิ่ม debounce เพื่อป้องกันการ submit ติดต่อกัน
  setTimeout(() => {
    this.http.post<any>(url, formData).subscribe({
      next: (res) => {
        // console.log('Registration success:', res);
        const user = res?.newUser || res?.user;
        if (user?.user_id) {
          this.getdatauser(user.user_id);
          this.showSnackBar('สมัครสมาชิกสำเร็จ');
          // รอสักครู่ก่อน navigate เพื่อให้ข้อมูลถูกบันทึกก่อน
          setTimeout(() => {
            this.router.navigate(['/base']);
          }, 1000);
        } else {
          console.error('ไม่พบข้อมูล user_id ใน response:', res);
          this.showSnackBar('เกิดข้อผิดพลาดในการสมัครสมาชิก');
        }
      },
      error: (err) => {
        console.error('Registration error:', err);
        if (err.status === 400) {
          this.showSnackBar('มีอีเมลนี้อยู่ในระบบแล้ว');
        } else if (err.status === 401) {
          this.showSnackBar('ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว');
        } else if (err.status === 402) {
          this.showSnackBar('เบอร์โทรนี้ถูกใช้ไปแล้ว');
        } else {
          this.showSnackBar('ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง');
        }
      },
      complete: () => {
        // สิ้นสุด loading state ไม่ว่าจะสำเร็จหรือล้มเหลว
        this.isRegistering = false;
        console.log('Set isRegistering to false (complete)');
      }
    });
  }, 100); // debounce 100ms
}

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

  togglePasswordVisibility(field: string) {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } else if (field === 'confirmPassword') {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }

     showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  back(){
    this.router.navigate(['/shutter']);
  }
}

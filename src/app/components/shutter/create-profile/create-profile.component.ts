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

@Component({
  selector: 'app-create-profile',
  standalone: true,
  imports: [MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    RouterModule,
    CommonModule,
    ReactiveFormsModule
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
    console.log(this.thaijson);

     this.fromreister = this.fb.group({
            email: ['', [Validators.required, Validators.email, this.noWhitespaceValidator]],
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
  console.log('id', id);
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

private generateRandomFileName(originalName: string): string {
  const extension = originalName.split('.').pop();
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
}

async base_for_shutt() {

  this.fromreister.markAllAsTouched();

  // ตรวจสอบความถูกต้องของฟอร์ม
  if (this.fromreister.invalid) {
    const firstErrorField = Object.keys(this.fromreister.controls).find(key =>
      this.fromreister.get(key)?.invalid
    );
    if (firstErrorField) {
      const element = document.querySelector(`[formControlName="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
    }
    alert('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
    return;
  }

    // ตรวจสอบรหัสผ่าน
  if (this.fromreister.value.Password !== this.fromreister.value.confirmPassword) {
    alert('ยืนยันรหัสผ่านไม่ถูกต้อง');
    return;
  }

    const url = this.Constants.API_ENDPOINT + '/register';
    let image: string;
  try {

     if (this.selectedFile) {
      const randomName = this.generateRandomFileName(this.selectedFile.name); // ถ้าคุณใช้ชื่อใหม่
      const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
      image = response.data.url;
    } else {
      // ถ้าไม่ได้อัปโหลด ใช้รูป default
      image = 'https://cdn-icons-png.flaticon.com/512/954/954560.png';
    }
    
    const formData = {
      email: this.fromreister.value.email,
      username: this.fromreister.value.UserName,
      first_name: this.fromreister.value.Name,
      last_name: this.fromreister.value.LastName,
      phone: this.fromreister.value.phone,
      address: this.fromreister.value.address,
      province: this.fromreister.value.province,
      password:this.fromreister.value.Password,
      image_profile: image,
      type_user:"2"
    };

    this.http.post<any>(url, formData).subscribe({
      next: (res) => {

        console.log('data:', res);
        const user = res.user;
        this.getdatauser(user.user_id);
        this.router.navigate(['/base']);
      },
      error: (err) => {
        console.error('เกิดข้อผิดพลาด:', err);
        if (err.status === 400) {
          this.showSnackBar('มีอีเมลนี้อยู่ในระบบแล้ว');
        } else if (err.status === 401) {
          this.showSnackBar('ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว');
        }else if (err.status === 402) {
          this.showSnackBar('เบอร์โทรนี้ถูกใช้ไปแล้ว');
        } else {
          this.showSnackBar('ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง');
        }
      },
    });
  } catch(error) {
    console.error('การอัปโหลดรูปผิดพลาด:', error);
    alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
  }
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

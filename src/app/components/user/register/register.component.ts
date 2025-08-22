import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder,Validators,FormGroup, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { ReactiveFormsModule } from '@angular/forms';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { AuthService } from '../../../service/auth.service';
import { DataMembers } from '../../../model/models';

export function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value || '';

  const errors: any = {};

  if (!/[0-9]/.test(value)) {
    errors.number = true; // ไม่มีตัวเลข
  }
  if (!/[A-Z]/.test(value)) {
    errors.uppercase = true; // ไม่มีตัวพิมพ์ใหญ่
  }
  if (!/[a-z]/.test(value)) {
    errors.lowercase = true; // ไม่มีตัวพิมพ์เล็ก
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    errors.special = true; // ไม่มีอักขระพิเศษ
  }
  if (value.length < 8) {
    errors.minlength = true; // สั้นเกินไป
  }

  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatProgressSpinnerModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit{
  fromreister: FormGroup;
  selectedFile?: File; // เก็บไฟล์รูปภาพที่เลือก
  files: { file: File; preview: string; newName?: string }[] = [];
  hidePassword = true;
  hideConfirmPassword = true;
  datauser: DataMembers[] = [];

  constructor(private Constants :Constants ,
    private http:HttpClient ,
    private fromBuilder : FormBuilder ,
    private router : Router,
    private readonly imageUploadService: ImageUploadService,
  private snackBar: MatSnackBar,
private authService: AuthService,)
  {
    this.fromreister = this.fromBuilder.group({
      Email: ['', [Validators.required, Validators.email, this.noWhitespaceValidator, this.StrictEmailValidator]],
      Password: [
  '',[passwordValidator],
  // [
  //   Validators.required,
  //   this.noWhitespaceValidator,
  //   Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._:;])[A-Za-z\d@$!%*?&#._:;]{8,}$/)
  // ]
],
      confirmPassword: ['', [Validators.required, this.noWhitespaceValidator]],
      UserName: ['', [Validators.required, this.noWhitespaceValidator]],
      Name: ['', [Validators.required, this.noWhitespaceValidator]],
      LastName: ['', [Validators.required, this.noWhitespaceValidator]],
      address: ['', ],
      Phone: ['', [Validators.required]]
    });
  
    
  }

    ngOnInit(){
    // ดึงข้อมูลจาก AuthService
  const user = this.authService.getUser();
     if (user) {
     this.datauser = [user];

     // เติมค่าเข้าไปในฟอร์ม
    this.fromreister.patchValue({
      Email: user.email || '',
      UserName: user.username || '',
      Name: user.first_name || '',
      LastName: user.last_name || '',
      Phone: user.phone || '',
      address: user.address || '',
      // ไม่ควร patch password / confirmPassword จาก backend มาลง
      image_profile : user.image_profile || ''

    });
    this.imagePreview = user.image_profile ;
  } else {
    console.warn(" No user found in AuthService. Redirecting to login...");
    return;
  }
}

  imagePreview: string = '/assets/images/user.png';
  
   noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // ให้ required validator จัดการกรณีที่ไม่มีค่า
    }
    
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }

onlyNumber(event: KeyboardEvent) {
  const charCode = event.which ? event.which : event.keyCode;
  // อนุญาตแค่ตัวเลข 0-9
  if (charCode < 48 || charCode > 57) {
    event.preventDefault();
  }
}


  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  back(){
    this.router.navigate(['']);
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

  private generateRandomFileName(originalName: string): string {
    const extension = originalName.split('.').pop();
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
  }

StrictEmailValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  if (!email) return null;

  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email) ? null : { invalidEmailFormat: true };
}

// เพิ่มตัวแปรสำหรับติดตาม loading state
isRegistering = false;
 async register() {
    // 1. ป้องกันการกดซ้ำซ้อน
    if (this.isRegistering) {
        return;
    }

    // 2. แสดงข้อความ error ถ้าฟอร์มไม่สมบูรณ์
    this.fromreister.markAllAsTouched();
    if (this.fromreister.invalid) {
        this.showSnackBar('กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วนและถูกต้อง');
        return;
    }
    if (this.fromreister.value.Password !== this.fromreister.value.confirmPassword) {
        this.showSnackBar('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
    }

    // 3. เริ่มการหมุน Spinner และครอบโค้ดทั้งหมดด้วย try/finally
    this.isRegistering = true;

    try {
        // 4. ตรวจสอบอีเมล (เหมือนเดิม)
        const checkEmailUrl = this.Constants.API_ENDPOINT + '/check-email';
        const checkBody = { email: this.fromreister.value.Email, type_user: '1' };
        const checkRes: any = await this.http.post(checkEmailUrl, checkBody).toPromise();

        if (checkRes.exists && checkRes.updatePrompt) {
            // หมายเหตุ: confirm() อาจไม่ทำงานในบางสภาพแวดล้อม แนะนำให้ใช้ Dialog ของ Angular Material ในอนาคต
            const confirmed = confirm(checkRes.message || 'อีเมลนี้ถูกใช้สมัครไว้ในบทบาทอื่นแล้ว ต้องการใช้ข้อมูลนี้เพิ่มบทบาทหรือไม่?');
            if (!confirmed) {
                this.showSnackBar('ยกเลิกการสมัครสมาชิก');
                // หยุดการทำงานและหยุดหมุน (ทำใน finally)
                return; 
            }
        } else if (checkRes.exists) {
            this.showSnackBar('อีเมลนี้ได้สมัครไว้แล้วกับบทบาทนี้');
            return;
        }

        // 5. อัปโหลดรูปภาพ (ถ้ามี)
        let imageUrl = this.imagePreview; // รูปเริ่มต้น
        if (this.selectedFile) {
            const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
            imageUrl = response.data.url;
        }

        // 6. เตรียมข้อมูลสำหรับส่งไปสมัคร
        const url = this.Constants.API_ENDPOINT + '/register';
        const formData = {
            email: this.fromreister.value.Email,
            password: this.fromreister.value.Password,
            username: this.fromreister.value.UserName,
            first_name: this.fromreister.value.Name,
            last_name: this.fromreister.value.LastName,
            phone: this.fromreister.value.Phone,
            image_profile: imageUrl,
            address: this.fromreister.value.address,
            type_user: "1"
        };

        // 7. ส่งข้อมูลไปสมัคร และรอจนกว่าจะสำเร็จ
        await this.http.post(url, formData).toPromise();

        // 8. เมื่อสำเร็จแล้ว
        this.showSnackBar('สมัครสมาชิกสำเร็จ!');
        this.router.navigate(['/login']);

    } catch (err: any) {
        // 9. จัดการ Error ทั้งหมดที่นี่
        console.error('เกิดข้อผิดพลาดในการสมัคร:', err);
        if (err.status === 400) {
            this.showSnackBar('อีเมลนี้ได้สมัครไว้แล้วกับบทบาทนี้');
        } else if (err.status === 401) {
            this.showSnackBar('ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว');
        } else if (err.status === 402) {
            this.showSnackBar('เบอร์โทรนี้ถูกใช้ไปแล้ว');
        } else {
            this.showSnackBar('ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง');
        }
    } finally {
        // 10. หยุดการหมุน Spinner (ส่วนนี้จะทำงานเสมอ ไม่ว่าจะสำเร็จหรือล้มเหลว)
        this.isRegistering = false;
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
}


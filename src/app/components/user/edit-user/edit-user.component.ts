import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { DataMembers } from '../../../model/models';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { AuthService } from '../../../service/auth.service'; 
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.scss'
})
export class EditUserComponent implements OnInit{
   data!: DataMembers;
   fromreister!: FormGroup;
   files: { file: File; preview: string; newName?: string }[] = [];
   selectedFile?: File;
   imagePreview: string ="";
   isLoading: boolean = false;

   showModal = false;
   formChangePassword!: FormGroup;

  hidePassword = true;
  hideConfirmPassword = true;
  hidePasswordnew = true;
   

  constructor(
     private fb: FormBuilder,
     private router : Router,
    //  private route: ActivatedRoute,
     private Constants: Constants, 
     private http: HttpClient,
     private snackBar: MatSnackBar,
     private readonly imageUploadService: ImageUploadService,
     private authService: AuthService){

  //   this.fromreister = this.fb.group({
  //     Email: ['', [Validators.required, Validators.email]],
  //     UserName: ['', Validators.required],
  //     Name: ['', Validators.required],
  //     LastName: ['', Validators.required],
  //     address: ['', Validators.required],
  //     Phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
  // });
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user) {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง");
      this.router.navigate(['/login']);
      return;
    }

    this.data = user;
    this.imagePreview = user.image_profile || "";

    // สร้างฟอร์มพร้อมเติมค่า
    this.fromreister = this.fb.group({
      Email: [user.email, [Validators.required, Validators.email]],
      UserName: [user.username, Validators.required],
      Name: [user.first_name, Validators.required],
      LastName: [user.last_name, Validators.required],
      address: [user.address],
      Phone: [user.phone, [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });

    this.formChangePassword = this.fb.group({
    old_password: ['', [Validators.required]],
    new_password: ['',[
    Validators.required,
    this.noWhitespaceValidator,
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._:;])[A-Za-z\d@$!%*?&#._:;]{8,}$/)
  ]],
    confirm_password: ['', [Validators.required, this.noWhitespaceValidator]],
  });
  }
  
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  // goToLogin(): void {
  //   this.router.navigate(['/login']);
  // }

  // back(){
  //   this.router.navigate(['/profile'],{ state: { data: this.data } });
  // }
  
  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }
  
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file; // เก็บไฟล์ที่เลือก
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result; // อัปเดตรูปตัวอย่างทันที
      };
      reader.readAsDataURL(file);
    }
  }
  

  // private generateRandomFileName(originalName: string): string {
  //   const extension = originalName.split('.').pop();
  //   return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
  // }

async save() {
  if (!this.data || !this.data.user_id) {
    this.showSnackBar("ไม่พบข้อมูลผู้ใช้");
    return;
  }

  // สร้าง formData สำหรับเช็คการเปลี่ยนแปลงของข้อมูลฟอร์ม (ไม่รวมรูป)
  const formDataForCheck = {
    username: this.fromreister.value.UserName,
    first_name: this.fromreister.value.Name,
    last_name: this.fromreister.value.LastName,
    phone: this.fromreister.value.Phone,
    address: this.fromreister.value.address,
  };

  // เช็คการเปลี่ยนแปลงของข้อมูลฟอร์มและรูปภาพแยกกัน
  const hasFormDataChanged = this.checkFormDataChanges(formDataForCheck);
  const hasImageChanged = this.selectedFile !== undefined;

  if (!hasFormDataChanged && !hasImageChanged) {
    this.showSnackBar('ไม่มีการเปลี่ยนแปลงข้อมูล');
    return;
  }

  this.isLoading = true;
  let image = this.data?.image_profile || "";

  // อัปโหลดรูปเฉพาะเมื่อมีการเลือกไฟล์ใหม่
  if (hasImageChanged && this.selectedFile) {
    try {
      const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
      image = response.data.url;
    } catch (error) {
      console.error("Upload error:", error);
      this.showSnackBar("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      this.isLoading = false;
      return;
    }
  }

  // สร้าง formData สำหรับส่ง API (รวมรูป)
  const formData = {
    ...formDataForCheck,
    image_profile: image,
  };

  const url = `${this.Constants.API_ENDPOINT}/edit/${this.data.user_id}`;

  this.http.post(url, formData).subscribe({
    next: () => {
      const updatedUser = { ...this.data, ...formData };
      this.authService.setUser(updatedUser);
      this.data = updatedUser;
      this.selectedFile = undefined; // รีเซ็ตไฟล์ที่เลือก
      this.showSnackBar("บันทึกข้อมูลเรียบร้อย!");
      this.router.navigate(['/profile'], { state: { data: updatedUser } });
    },
    error: (error) => {
      console.error("Update error:", error);
      this.showSnackBar("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    },
    complete: () => {
      this.isLoading = false;
    }
  });
}

// แยก method สำหรับเช็คข้อมูลฟอร์ม (ไม่รวมรูป)
private checkFormDataChanges(newData: any): boolean {
  // เปรียบเทียบกับข้อมูลเริ่มต้นในฟอร์ม ไม่ใช่ this.data ปัจจุบัน
  const originalFormValues = {
    username: this.data.username,
    first_name: this.data.first_name,
    last_name: this.data.last_name, 
    phone: this.data.phone,
    address: this.data.address || ''
  };

  const keys: (keyof typeof originalFormValues)[] = [
    "username",
    "first_name", 
    "last_name",
    "phone", 
    "address"
  ];

  for (const key of keys) {
    const oldVal = this.normalizeValue(originalFormValues[key]);
    const newVal = this.normalizeValue(newData[key]);

    console.log(`Checking ${key}:`, { oldVal, newVal });

    if (oldVal !== newVal) {
      console.log(`✅ ${key} changed`);
      return true;
    }
  }

  return false;
}

// เพิ่ม method helper สำหรับ normalize ค่า
private normalizeValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  return value.toString().trim();
}

onlyNumber(event: KeyboardEvent) {
  const charCode = event.which ? event.which : event.keyCode;
  // อนุญาตแค่ตัวเลข 0-9
  if (charCode < 48 || charCode > 57) {
    event.preventDefault();
  }
}


change_password(){
    if (this.formChangePassword.invalid) return;

  const { new_password, confirm_password } = this.formChangePassword.value;

  if (new_password !== confirm_password) {
    alert('รหัสผ่านใหม่และยืนยันไม่ตรงกัน');
    return;
  }

  // เรียก API 
    const url = `${this.Constants.API_ENDPOINT}/change_password/`+ this.data.user_id;
    const formData = {
      old_password: this.formChangePassword.value.old_password,
      new_password: this.formChangePassword.value.new_password,
  };

    this.http.post(url, formData).subscribe({
    next: (response) => {
      // const updatedUser = { ...this.data, ...formData };  // 🔁 รวมข้อมูลเดิมกับใหม่
      // this.authService.setUser(updatedUser);              // ✅ อัปเดตใน AuthService
      // this.data = updatedUser;                            // ✅ อัปเดตในตัวแปร local ด้วย

      // console.log("Update success:", response);
      alert("บันทึกข้อมูลเรียบร้อย!");
      this.showModal = false;
      this.logout();
    },
    error: (error) => {
      console.error("Update error:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    },
    complete: () => {
      this.isLoading = false;
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


togglePasswordVisibility(field: string) {
    if (field === 'old_password') {
      this.hidePassword = !this.hidePassword;
    } else if (field === 'new_password') {
      this.hidePasswordnew = !this.hidePasswordnew;
    }
    else if (field === 'confirm_password') {
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

  logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']); // กลับไปหน้า login
}

    back() {
    this.router.navigate(['/profile']);
  }
  
}
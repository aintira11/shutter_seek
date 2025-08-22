import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { AuthService } from '../../../service/auth.service'; 
import { Constants } from '../../../config/constants';
import { DataMembers } from '../../../model/models';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-edit-admin',
  standalone: true,
  imports: [CommonModule, FormsModule,ReactiveFormsModule],
  templateUrl: './edit-admin.component.html',
  styleUrl:  './edit-admin.component.scss'
  
})

export class EditAdminComponent {

  datauser: DataMembers[] = [];
  fromadmin!: FormGroup;
  showModal = false;
  formChangePassword!: FormGroup;

  hidePassword = true;
  hideConfirmPassword = true;
  hidePasswordnew = true;

   isLoading: boolean = false;
  

  constructor(private router: Router,
    private readonly imageUploadService: ImageUploadService,
    private authService: AuthService,
    private Constants: Constants, 
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
  ) {}

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    ngOnInit() {
    const user = this.authService.getUser();
       if (user) {
      this.datauser = [user];
    // console.log("Loaded user from AuthService:", this.datauser);
  } else {
    console.warn(" No user found in AuthService. Redirecting to login...");
    this.router.navigate(['/']);
    return;
  }

  // สร้างฟอร์มพร้อมเติมค่า
      this.fromadmin = this.fb.group({
        Email: [user.email, [Validators.required, Validators.email]],
        UserName: [user.username, Validators.required],
        Name: [user.first_name, Validators.required],
        LastName: [user.last_name, Validators.required],
        Phone: [user.phone, [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
      });
  
      this.formChangePassword = this.fb.group({
      old_password: ['', [Validators.required, this.noWhitespaceValidator]],
      new_password: ['',[
      Validators.required,
      this.noWhitespaceValidator,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._:;])[A-Za-z\d@$!%*?&#._:;]{8,}$/)
    ]],
      confirm_password: ['', [Validators.required, this.noWhitespaceValidator]],
    });
    }

  goBack() {
    this.router.navigate(['/admin']);
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
      const url = `${this.Constants.API_ENDPOINT}/change_password/`+ this.datauser[0].user_id;
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
        this.router.navigate(['/login']);
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

  previewImage: string | ArrayBuffer | null = null;
  selectedFile?: File;
  imagePreview: string = '/assets/images/user.png';
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

  async onSubmit(){
  if (!this.datauser || !this.datauser[0].user_id) {
    console.error("User ID is missing!");
    alert("ไม่พบข้อมูลผู้ใช้");
    return;
  }

  let image = this.datauser[0].image_profile || ""; // ใช้ค่าเริ่มต้น

  // ถ้ามีไฟล์ใหม่ อัปโหลดก่อน
  if (this.selectedFile) {
    try {
      const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
      image = response.data.url; // ใช้ URL รูปใหม่
    } catch (error) {
      console.error("Upload error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      return;
    }
  }

  const url = `${this.Constants.API_ENDPOINT}/edit/${this.datauser[0].user_id}`;
  const formData = {
      // email: this.fromreister.value.Email,
      username: this.fromadmin.value.UserName,
      first_name: this.fromadmin.value.Name,
      last_name: this.fromadmin.value.LastName,
      phone: this.fromadmin.value.Phone,
      image_profile: image,
  };

  for (const [key, value] of Object.entries(formData)) {
  if (typeof value === 'string' && value.trim() === '') {
    this.showSnackBar(`กรุณากรอกข้อมูล ${key}`);
    return;
  }
}

  this.isLoading = true;

  this.http.post(url, formData).subscribe({
    next: (response) => {
      const updatedUser = { ...this.datauser[0], ...formData };  // 🔁 รวมข้อมูลเดิมกับใหม่
      this.authService.setUser(updatedUser);              // ✅ อัปเดตใน AuthService
      this.datauser[0] = updatedUser;                            // ✅ อัปเดตในตัวแปร local ด้วย

      // console.log("Update success:", response);
      alert("บันทึกข้อมูลเรียบร้อย!");
      this.router.navigate(['/admin'], { state: { data: updatedUser } }); // ส่งข้อมูลล่าสุดไปด้วย
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
}
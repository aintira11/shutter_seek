import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import jsonData from '../../../../assets/thai_provinces.json'
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { DataMembers } from '../../../model/models';
import { AuthService } from '../../../service/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-shutter',
  standalone: true,
  imports: [CommonModule,
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
  ],
  templateUrl: './edit-shutter.component.html',
  styleUrl: './edit-shutter.component.scss'
})
export class EditShutterComponent{
  marginLeft: string | null = null;  // ค่าเริ่มต้นเป็น null
  thaijson = jsonData
  opened = true;
  photographerForm!: FormGroup;
  data: DataMembers[]=[];
  files: { file: File; preview: string; newName?: string }[] = [];
  selectedFile?: File;
  imagePreview: string | null = null;
  isLoading: boolean = false;

  showModal = false;
   formChangePassword!: FormGroup;

  hidePassword = true;
  hideConfirmPassword = true;
  hidePasswordnew = true;

constructor(
  private router : Router,
  private fb: FormBuilder,
  private readonly imageUploadService: ImageUploadService,
  private route: ActivatedRoute
  ,private Constants: Constants
  , private http: HttpClient,
  private cdRef: ChangeDetectorRef,
  private authService: AuthService,
  private snackBar: MatSnackBar,
  ){
 // Initialize forms
  this.initForms();
  
  }



ngOnInit(): void {
  const user = this.authService.getUser();
  if (!user) {
      console.error("ไม่พบข้อมูลผู้ใช้ใน AuthService"); 
      return;
    }
    this.data = [user];

    this.photographerForm = this.fb.group({
    first_name: [this.data[0].first_name, Validators.required,, this.noWhitespaceValidator],
    last_name: [this.data[0].last_name, Validators.required],
    username: [this.data[0].username, Validators.required],
    phone: [this.data[0].phone, Validators.required],
    email: [this.data[0].email, [Validators.required, Validators.email]],
    address: [this.data[0].address],
    province: [this.data[0].province, Validators.required],
    lineID: [this.data[0].lineID, Validators.required],
    facebook: [this.data[0].facebook, Validators.required],
    description: [this.data[0].description, Validators.required]
  });

  // setTimeout(() => {
  //   this.marginLeft = '250px';  // ตั้งค่าใหม่
  //   this.cdRef.detectChanges(); // บังคับให้ Angular อัปเดต
  // }, 0);

  this.formChangePassword = this.fb.group({
    old_password: ['', [Validators.required, this.noWhitespaceValidator]],
    new_password: ['',[
    Validators.required,
    this.noWhitespaceValidator,
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._:;])[A-Za-z\d@$!%*?&#._:;]{8,}$/)
  ]],
    confirm_password: ['', [Validators.required, this.noWhitespaceValidator]],
  });

  this.getdatauser(this.data[0].user_id);
 
}

  private initForms(): void {
    // Personal information form
    this.photographerForm = this.fb.group({
      lineID: ['', Validators.required],
      facebook: [''],
      description: ['', Validators.required]
    });
    
  }

    
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRandomFileName(originalName: string): string {
    const extension = originalName.split('.').pop();
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
  }


  @ViewChild('fileInput') fileInput!: ElementRef; // ใช้ ViewChild เพื่ออ้างถึง input file
 
  triggerFileInput() {
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.click();
    } else {
      console.error("fileInput is not initialized");
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file; // ✅ ต้องกำหนดค่าด้วย
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  onlyNumber(event: KeyboardEvent) {
  const charCode = event.which ? event.which : event.keyCode;
  // อนุญาตแค่ตัวเลข 0-9
  if (charCode < 48 || charCode > 57) {
    event.preventDefault();
  }
}
  
  async savePersonalInfo() {
  const userId = this.data[0].user_id || this.data[0]?.user_id;
  if (!userId) {
    console.error("User ID is missing!");
    alert("ไม่พบข้อมูลผู้ใช้");
    return;
  }

  let image = this.data[0]?.image_profile || this.data[0].image_profile || "";
  let hasImageChanged = false;

   // ตรวจสอบค่าว่างหรือ whitespace
  for (const [key, value] of Object.entries(this.photographerForm.value)) {
    if (key !== 'address' && typeof value === 'string' && value.trim() === '') {
      this.showSnackBar(`กรุณากรอกข้อมูล ${key}`);
      return;
    }
  }
  

  // ถ้ามีไฟล์ใหม่ อัปโหลดก่อน
  if (this.selectedFile) {
    try {
      const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
      if (response && response.data && response.data.url) {
        image = response.data.url;
        hasImageChanged = true;
      } else {
        console.error("Upload failed: No URL returned");
        alert("อัปโหลดรูปภาพไม่สำเร็จ!");
        return;
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      return;
    }
  }

  // ดึงค่า formData
  const personalData = {
    // email: this.photographerForm.value.email || "",
    username: this.photographerForm.value.username || "",
    first_name: this.photographerForm.value.first_name || "",
    last_name: this.photographerForm.value.last_name || "",
    phone: this.photographerForm.value.phone || "",
    province: this.photographerForm.value.province || "",
    image_profile: image,
    address: this.photographerForm.value.address || "",
  };

  const additionalData = {
    lineID: this.photographerForm.value.lineID,
    facebook: this.photographerForm.value.facebook,
    description: this.photographerForm.value.description,
  };

  // ตรวจสอบการเปลี่ยนแปลงข้อมูลส่วนตัว
  const hasPersonalDataChanged = this.hasDataChanged(personalData, this.data[0]) || hasImageChanged;
  
  // ตรวจสอบการเปลี่ยนแปลงข้อมูลเพิ่มเติม
  const hasAdditionalDataChanged = this.hasDataChanged(additionalData, this.data[0]);

  let updateCount = 0;
  const totalUpdates = (hasPersonalDataChanged ? 1 : 0) + (hasAdditionalDataChanged ? 1 : 0);

  if (totalUpdates === 0) {
    alert("ไม่มีการเปลี่ยนแปลงข้อมูล");
    return;
  }

  // อัปเดตข้อมูลส่วนตัวถ้ามีการเปลี่ยนแปลง
  if (hasPersonalDataChanged) {
    const url = `${this.Constants.API_ENDPOINT}/edit/${userId}`;
    this.http.post(url, personalData).subscribe({
      next: (response) => {
        // console.log("Update success (Personal Data):", response);
        updateCount++;
        this.updateAuthData(personalData);
        
        if (updateCount === totalUpdates) {
          this.onAllUpdatesComplete();
        }
      },
      error: (error) => {
        console.error("Update error (Personal Data):", error);
        alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลส่วนตัว");
      }
    });
  }

  // อัปเดตข้อมูลเพิ่มเติมถ้ามีการเปลี่ยนแปลง
  if (hasAdditionalDataChanged) {
    const urls = this.Constants.API_ENDPOINT + '/updateline/' + userId;
    this.http.post(urls, additionalData).subscribe({
      next: (response) => {
        // console.log("Update success (Additional Data):", response);
        updateCount++;
        this.updateAuthData(additionalData);
        
        if (updateCount === totalUpdates) {
          this.onAllUpdatesComplete();
        }
      },
      error: (error) => {
        console.error("Update error (Additional Data):", error);
        alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลเพิ่มเติม");
      }
    });
  }
}



// ฟังก์ชันตรวจสอบการเปลี่ยนแปลงข้อมูล
private hasDataChanged(newData: any, originalData: any): boolean {
  for (const key in newData) {
    if (newData.hasOwnProperty(key)) {
      // แปลงค่าเป็น string เพื่อเปรียบเทียบ และจัดการกรณี null/undefined
      const newValue = (newData[key] || '').toString().trim();
      const originalValue = (originalData[key] || '').toString().trim();
      
      if (newValue !== originalValue) {
        // console.log(`Data changed - ${key}: "${originalValue}" -> "${newValue}"`);
        return true;
      }
    }
  }
  return false;
}

// ฟังก์ชันที่จะเรียกเมื่ออัปเดตทั้งหมดเสร็จสิ้น
private onAllUpdatesComplete(): void {
  const userId = this.data[0].user_id;
  alert("บันทึกข้อมูลเรียบร้อย!");
  this.getdatauser(userId);
  
  // รีเซ็ตไฟล์ที่เลือก
  this.selectedFile = undefined;
  this.imagePreview = null;
  
  // รีเซ็ต file input
  if (this.fileInput && this.fileInput.nativeElement) {
    this.fileInput.nativeElement.value = '';
  }
}

// 🔁 อัปเดต AuthService และ local data หลังบันทึก
private updateAuthData(newFields: Partial<DataMembers>) {
  const updatedUser = { ...this.data[0], ...newFields };
  this.authService.setUser(updatedUser);
  this.data = [updatedUser];
}


  getdatauser(id: number) {
    // console.log('Fetching user data for ID:', id);
    const url = `${this.Constants.API_ENDPOINT}/read/${id}`;
    
    this.http.get(url).subscribe((response: any) => {
      this.data = response;  
      // console.log("Updated User Data:", this.data);
      
      // ✅ รีเซ็ตค่า form หลังจากดึงข้อมูลใหม่
      this.photographerForm.patchValue({
        first_name: this.data[0].first_name,
        last_name: this.data[0].last_name,
        username: this.data[0].username,
        phone: this.data[0].phone,
        email: this.data[0].email,
        address: this.data[0].address,
        province: this.data[0].province,
        lineID: this.data[0].lineID,
        facebook: this.data[0].facebook,
        description: this.data[0].description
      });
    });
  }



toggleSidenav() {
  this.opened = !this.opened;
}

  // ตัวแปรที่ใช้ในการควบคุมการเปิด/ปิด Sidebar
 isSidebarOpen = true;

 // ฟังก์ชันสำหรับเปิดหรือปิด Sidebar
 w3_toggle(): void {
   this.isSidebarOpen = !this.isSidebarOpen;
 }
 
 goToEditWork(){
  this.router.navigate(['/insertport'], { state: { data: this.data[0]} });
}
 goToPackagePack(): void {
   this.router.navigate(['/editpac'], { state: { data: this.data[0]} });
 }

 goToEditProfile(): void {
   this.router.navigate(['/editshutter'], { state: { data: this.data[0]} });
 }
 goToHomeShutter(){
  this.router.navigate(['/mainshutter'], { state: { data: this.data[0]} });
 }


 change_password(){
     if (this.formChangePassword.invalid) return;
 
   const { new_password, confirm_password } = this.formChangePassword.value;
 
   if (new_password !== confirm_password) {
     alert('รหัสผ่านใหม่และยืนยันไม่ตรงกัน');
     return;
   }
 
   // เรียก API 
     const url = `${this.Constants.API_ENDPOINT}/change_password/`+ this.data[0].user_id;
     const formData = {
       old_password: this.formChangePassword.value.old_password,
       new_password: this.formChangePassword.value.new_password,
   };
 
     this.http.post(url, formData).subscribe({
     next: (response) => {
       // const updatedUser = { ...this.data, ...formData };  // 🔁 รวมข้อมูลเดิมกับใหม่
       // this.authService.setUser(updatedUser);              // ✅ อัปเดตใน AuthService
       // this.data = updatedUser;                            // ✅ อัปเดตในตัวแปร local ด้วย
 
      //  console.log("Update success:", response);
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

     logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']); // กลับไปหน้า login
}

}

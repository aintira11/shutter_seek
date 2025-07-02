import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import jsonData from '../../../../assets/thai_provinces.json'
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { DataMembers } from '../../../model/models';
import { AuthService } from '../../../service/auth.service';

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

constructor(
  private router : Router,
  private fb: FormBuilder,
  private readonly imageUploadService: ImageUploadService,
  private route: ActivatedRoute
  ,private Constants: Constants
  , private http: HttpClient,
  private cdRef: ChangeDetectorRef,
  private authService: AuthService
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
    first_name: [this.data[0].first_name, Validators.required],
    last_name: [this.data[0].last_name, Validators.required],
    username: [this.data[0].username, Validators.required],
    phone: [this.data[0].phone, Validators.required],
    email: [this.data[0].email, [Validators.required, Validators.email]],
    address: [this.data[0].address],
    province: [this.data[0].province, Validators.required],
    lineID: [this.data[0].lineID],
    facebook: [this.data[0].facebook],
    description: [this.data[0].description]
  });

  // setTimeout(() => {
  //   this.marginLeft = '250px';  // ตั้งค่าใหม่
  //   this.cdRef.detectChanges(); // บังคับให้ Angular อัปเดต
  // }, 0);
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
  

  
  async savePersonalInfo() {
    // const userId = (this.data as DataMembers).user_id; // ✅ บอกให้ TypeScript รู้ว่าเป็น Object
    const userId = this.data[0].user_id || this.data[0]?.user_id;
      if (!userId) {
      console.error("User ID is missing!");
      alert("ไม่พบข้อมูลผู้ใช้");
      return;
    }
  
    let image = this.data[0]?.image_profile || this.data[0].image_profile || ""; // ใช้ค่าเริ่มต้น
  
    // ถ้ามีไฟล์ใหม่ อัปโหลดก่อน
    if (this.selectedFile) {
      try {
        const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
        if (response && response.data && response.data.url) {
          image = response.data.url; // ✅ อัปเดตรูปใหม่
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
      email: this.photographerForm.value.email || "",
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

    // this.isLoading = true;
    // // ไม่ต้องรอให้เสร็จ ทำงานอื่นไปเลย
    // new Promise(resolve => setTimeout(resolve, 3500)).then(() => {
    // this.isLoading = false;
    // });

  
    // ตรวจสอบว่ามีข้อมูลใน personalData หรือไม่ เพิ่ม เงื่อนไขเช็ค .some()
    // const isPersonalDataValid = Object.values(personalData).some(value => value && value !== "");
    // if (isPersonalDataValid) {
      const url = `${this.Constants.API_ENDPOINT}/update/${userId}`;
      this.http.post(url, personalData).subscribe({
        next: (response) => {
          console.log("Update success (Personal Data):", response);
          alert("บันทึกข้อมูลส่วนตัวเรียบร้อย!");
          this.getdatauser(userId);

        },
        error: (error) => {
          console.error("Personal Data ไม่มีการเปลี่ยนแปลง");
          console.error("Update error (Personal Data):", error);
          // alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลส่วนตัว");
        }
      });
    // } 
  
    // ตรวจสอบว่ามีข้อมูลใน additionalData หรือไม่
    // const isAdditionalDataValid = Object.values(additionalData).some(value => value && value !== "");
    // if (isAdditionalDataValid) {
      const urls = this.Constants.API_ENDPOINT + '/updateline/' + userId;
      this.http.post(urls, additionalData).subscribe({
        next: (response) => {
          console.log("Update success (Additional Data):", response);
          alert("บันทึกข้อมูลเพิ่มเติมเรียบร้อย!");
          this.getdatauser(userId);

        },
        error: (error) => {
          console.error("Additional Data ไม่มีการเปลี่ยนแปลง");
          console.error("Update error (Additional Data):", error);
          // alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลเพิ่มเติม");
        }
      });
    // }
  
    // เมื่อบันทึกเสร็จแล้ว ให้กลับไปหน้า editshutter
    // this.router.navigate(['/editshutter'], { state: { data: this.data } });
    
  }

  getdatauser(id: number) {
    console.log('Fetching user data for ID:', id);
    const url = `${this.Constants.API_ENDPOINT}/read/${id}`;
    
    this.http.get(url).subscribe((response: any) => {
      this.data = response;  
      console.log("Updated User Data:", this.data);
      
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


}

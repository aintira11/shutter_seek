import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DataMembers, DataTegs } from '../../../model/models';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-base-shutt',
  standalone: true,
  imports: [FormsModule,
       MatFormFieldModule,
       MatInputModule,
       MatButtonModule,
       RouterModule,
       ReactiveFormsModule,
       CommonModule,
      HttpClientModule  ],
  templateUrl: './base-shutt.component.html',
  styleUrl: './base-shutt.component.scss'
})
export class BaseShuttComponent {
  currentUser: DataMembers | null = null;
  photographerForm!: FormGroup;
  portfolioForm!: FormGroup;
  Tags: DataTegs[] = [];
  files: { file: File; preview: string; newName?: string }[] = [];
  
  // Loading states
  isPersonalInfoSubmitting = false;
  isPortfolioInfoSubmitting = false;
  isUploading = false;

  isLoading: boolean = false;
  uploadProgressMessage: string = 'กำลังเตรียมข้อมูล...';
  
  portfolioSaved = false;
  
  constructor(
    private fb: FormBuilder,
    private constants: Constants,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private imageUploadService: ImageUploadService,
    private authService: AuthService,
  ) {
    // Initialize forms
    this.initForms();
  }
  
  ngOnInit(): void {
    this.initializeUser();
  }

  private initializeUser(): void {
    // ถ้า AuthService มี currentUser$ Observable
    // this.authService.currentUser$.subscribe(user => {
    //   if (user) {
    //     this.currentUser = user;
    //     console.log("Loaded user from AuthService:", this.currentUser);
    //     this.prefillPersonalInfoForm();
    //     this.fetchTags();
    //   } else {
    //     console.warn("No user found in AuthService. Redirecting to login...");
    //     this.router.navigate(['/login']);
    //   }
    // });

    // หรือใช้วิธีเช็คข้อมูลแบบ retry
    this.checkUserWithRetry();
  }

  private checkUserWithRetry(maxRetries: number = 3, delay: number = 100): void {
    let retryCount = 0;
    
    const checkUser = () => {
      const user = this.authService.getUser();
      
      if (user) {
        this.currentUser = user;
        // console.log("Loaded user from AuthService:", this.currentUser);
        this.prefillPersonalInfoForm();
        this.fetchTags();
      } else if (retryCount < maxRetries) {
        retryCount++;
        // console.log(`Retry ${retryCount}/${maxRetries} - User not found, retrying...`);
        setTimeout(checkUser, delay);
      } else {
        console.warn("No user found in AuthService after retries. Redirecting to login...");
        this.router.navigate(['/login']);
      }
    };
    
    checkUser();
  }
  
  private initForms(): void {
    // Personal information form
    this.photographerForm = this.fb.group({
      lineID: ['',[Validators.required, this.noWhitespaceValidator]],
      facebook: ['',[Validators.required, this.noWhitespaceValidator]],
      description: ['' ,[Validators.required, this.noWhitespaceValidator]]
    });
    
    // Portfolio information form
    this.portfolioForm = this.fb.group({
      name_work: ['',[Validators.required, this.noWhitespaceValidator]],
      tags_id: ['', Validators.required]
    });

    // Listener เพื่อ reset portfolioSaved เมื่อมีการเปลี่ยนแปลงฟอร์ม
    this.portfolioForm.valueChanges.subscribe(() => {
      this.portfolioSaved = false;
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
  
  private prefillPersonalInfoForm(): void {
    if (this.currentUser) {
      this.photographerForm.patchValue({
        lineID: this.currentUser.lineID || '',
        facebook: this.currentUser.facebook || '',
        description: this.currentUser.description || ''
      });
    }
  }
  
  private fetchTags(): void {
    const url = this.constants.API_ENDPOINT + '/tegs';
    this.http.get<DataTegs[]>(url).subscribe({
      next: (response) => {
        this.Tags = response;
        // console.log('Tags data:', this.Tags);
      },
      error: (error) => {
        console.error('Error fetching tags:', error);
        this.showAlert('ไม่สามารถดึงข้อมูลหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง');
      }
    });
  }
  
  // File handling methods
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }

     // ป้องกันการเลือกไฟล์ขณะกำลังอัปโหลด
    if (this.isUploading) {
      this.showAlert('กำลังอัปโหลดข้อมูล กรุณารอสักครู่');
      input.value = '';
      return;
    }
    
    // Check if adding these files would exceed the limit
    const totalFiles = this.files.length + input.files.length;
    if (totalFiles > 10) {
      this.showAlert('คุณสามารถอัปโหลดได้สูงสุด 10 รูป');
      input.value = '';
      return;
    }
    
    // Process selected files
    const selectedFiles = Array.from(input.files);
    
    selectedFiles.forEach(file => {
      // Validate file type
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        this.showAlert('รองรับเฉพาะไฟล์ .jpg หรือ .png เท่านั้น');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showAlert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.files.push({ file, preview: e.target.result });
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input value
    input.value = '';
  }
  
  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

   // เพิ่มฟังก์ชันแสดงข้อความความคืบหน้า
  private updateProgressMessage(message: string): void {
    this.uploadProgressMessage = message;
    console.log(message); // สำหรับ debug
  }
  
  // Upload images
  async uploadImages(): Promise<void> {
    // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
    if (!this.currentUser || !this.currentUser.user_id) {
      this.showAlert('ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    // ตรวจสอบไฟล์
    if (this.files.length < 5) {
      this.showAlert('กรุณาเลือกรูปภาพอย่างน้อย 5 รูป');
      return;
    }

    // ตรวจสอบฟอร์มทั้งหมด
    if (this.photographerForm.invalid) {
      this.photographerForm.markAllAsTouched();
      this.showAlert('กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วน');
      return;
    }

    if (this.portfolioForm.invalid) {
      this.portfolioForm.markAllAsTouched();
      this.showAlert('กรุณากรอกข้อมูลผลงานให้ครบถ้วน');
      return;
    }
    // เริ่มต้นการอัปโหลด - แสดง loading overlay
    this.isUploading = true;
    this.updateProgressMessage('กำลังเตรียมข้อมูล...');

    try {
      // ขั้นตอนที่ 1: บันทึกข้อมูลส่วนตัว
      this.showAlert('กำลังบันทึกข้อมูลส่วนตัว...', false);
      this.updateProgressMessage('กำลังบันทึกข้อมูลส่วนตัว...');
      
      const personalInfoUrl = this.constants.API_ENDPOINT + '/updateline/' + this.currentUser.user_id;
      const personalInfoData = this.photographerForm.value;
      
      await this.http.post(personalInfoUrl, personalInfoData).toPromise();
      console.log('Personal info saved successfully');

      // ขั้นตอนที่ 2: บันทึกข้อมูลผลงาน
      this.showAlert('กำลังบันทึกข้อมูลผลงาน...', false);
      this.updateProgressMessage('กำลังบันทึกข้อมูลผลงาน...');
      
      const portfolioUrl = this.constants.API_ENDPOINT + '/add/Portfolio';
      const portfolioData = {
        user_id: this.currentUser.user_id,
        tags_id: this.portfolioForm.value.tags_id,
        name_work: this.portfolioForm.value.name_work
      };

      const portfolioResponse: any = await this.http.post(portfolioUrl, portfolioData).toPromise();
      // console.log('Portfolio info saved successfully:', portfolioResponse);

      // ตรวจสอบว่ามี portfolio_id หรือไม่
      if (!portfolioResponse || !portfolioResponse.last_idx) {
        throw new Error('ไม่ได้รับ portfolio_id จากการบันทึกข้อมูลผลงาน');
      }

      // ขั้นตอนที่ 3: อัปโหลดรูปภาพ
      let successCount = 0;
      
      for (const [index, fileObj] of this.files.entries()) {
        this.showAlert(`กำลังอัปโหลดรูปที่ ${index + 1} จาก ${this.files.length}`, false);
       
        try {
          // อัปโหลดรูป
          const response: any = await this.imageUploadService.uploadImage(fileObj.file).toPromise();
          
          if (response && response.data && response.data.url) {
            const imageUrl = response.data.url;
            
            // บันทึก URL ของรูปลงฐานข้อมูล
            const apiUrl = this.constants.API_ENDPOINT + '/update/Portfolio/image';
            const payload = {
              portfolio_id: portfolioResponse.last_idx,
              Image_url: imageUrl,
            };
            
            await this.http.post(apiUrl, payload).toPromise();
            console.log(`Image ${index + 1} uploaded successfully: ${imageUrl}`);
            successCount++;
          } else {
            throw new Error('No URL returned from the image upload API');
          }
        } catch (error) {
          console.error(`Error uploading image ${index + 1}:`, error);
          // ยังคงอัปโหลดรูปอื่นต่อไป
        }
      }

      // ตรวจสอบผลลัพธ์
      this.updateProgressMessage('กำลังสรุปผลการบันทึก...');
      
      if (successCount === this.files.length) {
         this.updateProgressMessage('บันทึกข้อมูลสำเร็จ กำลังเปลี่ยนหน้า...');
        
        // หน่วงเวลาเล็กน้อยเพื่อให้ผู้ใช้เห็นข้อความสำเร็จ
        setTimeout(() => {
          this.navigateToNextStep(portfolioResponse.last_idx);
        }, 1000);
      } else if (successCount > 0) {
        // this.showAlert(`บันทึกข้อมูลสำเร็จ อัปโหลดรูปสำเร็จ ${successCount} จาก ${this.files.length} รูป`);
        // this.navigateToNextStep(portfolioResponse.last_idx);
        this.showAlert(`บันทึกข้อมูลสำเร็จ อัปโหลดรูปสำเร็จ ${successCount} จาก ${this.files.length} รูป`);
        setTimeout(() => {
          this.navigateToNextStep(portfolioResponse.last_idx);
        }, 1000);
      } else {
        this.showAlert('บันทึกข้อมูลสำเร็จ แต่ไม่สามารถอัปโหลดรูปได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error: any) {
      console.error('Error during complete save process:', error);
      this.showAlert(error.message || 'เกิดข้อผิดพลาดระหว่างการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      // ปิด loading overlay เมื่อเกิดข้อผิดพลาด
      this.isUploading = false;
    } 
    // finally {
    //   this.isUploading = false;
    // }
  }

  // Navigation - ส่ง user_id, tags_id, portfolio_id ไปหน้าถัดไป
  navigateToNextStep(portfolioId: number): void {
    if (!this.currentUser) {
      this.showAlert('ไม่พบข้อมูลผู้ใช้งาน');
      return;
    }

    const navigationData = {
      user_id: this.currentUser.user_id,
      tags_id: this.portfolioForm.value.tags_id,
      portfolio_id: portfolioId
    };

    this.isUploading = false;
    this.router.navigate(['/base3'], { state: { data: navigationData } });
  }
  
  goBack(): void {
    window.history.back();
  }
  
  // Helper methods
  private handleApiError(error: any): void {
    if (error.status === 409) {
      this.showAlert('เกิดข้อผิดพลาด: ข้อมูลซ้ำซ้อน');
    } else {
      this.showAlert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  }
  
  private showAlert(message: string, isModal: boolean = true): void {
    if (isModal) {
      alert(message);
    } else {
      console.log(message); // For progress updates, use a toast or progress indicator in production
    }
  }

  // ตรวจสอบสถานะการบันทึกผลงาน
  isPortfolioFormValid(): boolean {
    return this.portfolioForm.valid;
  }

  // ตรวจสอบปุ่มอัปโหลดพร้อมใช้งานหรือไม่
  isUploadButtonEnabled(): boolean {
    return this.files.length > 0 && 
           this.photographerForm.valid && 
           this.portfolioForm.valid && 
           !this.isUploading;
  }
}
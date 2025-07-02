import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { finalize } from 'rxjs';
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
  userData: any;
  dataUser: DataMembers[] = [];
  photographerForm!: FormGroup;
  portfolioForm!: FormGroup;
  Tags: DataTegs[] = [];
  files: { file: File; preview: string; newName?: string }[] = [];
  
  // Loading states
  isPersonalInfoSubmitting = false;
  isPortfolioInfoSubmitting = false;
  isUploading = false;
  
   portfolioSaved = false;

  // Skip tracking
  skippedSteps = {
    personalInfo: false
  };
  
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
     // ดึงข้อมูลจาก AuthService
  const user = this.authService.getUser();
  if (user) {
    this.dataUser = [user];
    console.log("Loaded user from AuthService:", this.dataUser);
    
  } else {
    console.warn(" No user found in AuthService. Redirecting to login...");
    return;
  }
    // Get route parameters and fetch tags
    this.getUserData();
    this.fetchTags();
  }
  
  private initForms(): void {
    // Personal information form
    this.photographerForm = this.fb.group({
      lineID: [''],
      facebook: [''],
      description: ['']
    });
    
    // Portfolio information form
    this.portfolioForm = this.fb.group({
      name_work: ['', Validators.required],
      tags_id: ['', Validators.required]
    });

    //  listener เพื่อ reset portfolioSaved เมื่อมีการเปลี่ยนแปลงฟอร์ม
    this.portfolioForm.valueChanges.subscribe(() => {
      this.portfolioSaved = false;
    });
  }
  
  private getUserData(): void {
    this.route.queryParams.subscribe(() => {
      this.userData = window.history.state.data;
      console.log('User data:', this.userData);
      
      // Prefill form if data exists
      if (this.userData) {
        if (this.userData.lineID) {
          this.photographerForm.patchValue({
            lineID: this.userData.lineID,
            facebook: this.userData.facebook,
            description: this.userData.description
          });
        }
      }
    });
  }
  
  private fetchTags(): void {
    const url = this.constants.API_ENDPOINT + '/tegs';
    this.http.get<DataTegs[]>(url).subscribe({
      next: (response) => {
        this.Tags = response;
        console.log('Tags data:', this.Tags);
      },
      error: (error) => {
        console.error('Error fetching tags:', error);
        // Show user-friendly error message
        this.showAlert('ไม่สามารถดึงข้อมูลหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง');
      }
    });
  }
  
  // Save personal information
  savePersonalInfo(): void {
    if (this.photographerForm.invalid) {
      this.photographerForm.markAllAsTouched();
      return;
    }
    
    this.isPersonalInfoSubmitting = true;
    const url = this.constants.API_ENDPOINT + '/updateline/' + this.userData.user_id;
    const formData = this.photographerForm.value;
    
    this.http.post(url, formData)
      .pipe(finalize(() => this.isPersonalInfoSubmitting = false))
      .subscribe({
        next: (response) => {
          console.log('Personal info saved:', response);
          
          // Update user data with response
          this.userData = { ...this.userData, ...response };
          
          // Show success message
          this.showAlert('บันทึกข้อมูลส่วนตัวสำเร็จ');
          
          // Scroll to next section
          document.getElementById('portfolio-category')?.scrollIntoView({ behavior: 'smooth' });
        },
        error: (error) => {
          console.error('Error saving personal info:', error);
          this.handleApiError(error);
        }
      });
  }

  // Skip personal information
  skipPersonalInfo(): void {
    if (confirm('คุณต้องการข้ามขั้นตอนนี้หรือไม่? คุณสามารถกรอกข้อมูลเพิ่มเติมได้ในภายหลัง')) {
      this.skippedSteps.personalInfo = true;
      console.log('Personal info step skipped');
      
      // Show info message
      this.showAlert('ข้ามขั้นตอนข้อมูลส่วนตัวแล้ว คุณสามารถเพิ่มข้อมูลได้ภายหลัง');
      
      // Scroll to next section
      document.getElementById('portfolio-category')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  // Save portfolio information
 savePortfolioInfo(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (this.portfolioForm.invalid) {
      this.portfolioForm.markAllAsTouched();
      reject('Form invalid');
      return;
    }

    this.isPortfolioInfoSubmitting = true;

    // ใช้ user_id จาก dataUser ที่ได้จาก AuthService
    const user = this.dataUser[0];
    if (!user || !user.user_id) {
      this.isPortfolioInfoSubmitting = false;
      this.showAlert('ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
      reject('User not found');
      return;
    }

    const url = this.constants.API_ENDPOINT + '/add/Portfolio';
    const formData = {
      user_id: user.user_id,
      tags_id: this.portfolioForm.value.tags_id,
      name_work: this.portfolioForm.value.name_work
    };

    this.http.post(url, formData)
      .pipe(finalize(() => this.isPortfolioInfoSubmitting = false))
      .subscribe({
        next: (response) => {
          console.log('Portfolio info saved:', response);

          // อัปเดต userData หรือเก็บข้อมูลเพิ่มเติมตามต้องการ
          this.userData = { ...this.userData, ...response };
          this.portfolioSaved = true;

          resolve(response);
        },
        error: (error) => {
          console.log("REQ BODY:",formData);

          console.error('Error saving portfolio info:', error);
          this.handleApiError(error);
          reject(error);
        }
      });
  });
}

  
  // File handling methods
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }
    
    // Check if adding these files would exceed the limit
    const totalFiles = this.files.length + input.files.length;
    if (totalFiles > 10) {
      this.showAlert('คุณสามารถอัปโหลดได้สูงสุด 10 รูปเท่านั้น');
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

  // ตรวจสอบและบันทึกข้อมูลผลงานก่อนอัปโหลด
  private async ensurePortfolioSaved(): Promise<void> {
    // ตรวจสอบว่าฟอร์มถูกต้องหรือไม่
    if (this.portfolioForm.invalid) {
      this.portfolioForm.markAllAsTouched();
      throw new Error('กรุณากรอกข้อมูลผลงานให้ครบถ้วน');
    }

    // ตรวจสอบว่าบันทึกแล้วหรือไม่
    if (!this.portfolioSaved) {
      console.log('Portfolio not saved yet, saving now...');
      await this.savePortfolioInfo();
      console.log('Portfolio saved successfully');
    } else {
      console.log('Portfolio already saved');
    }
  }
  
  // Upload images
   async uploadImages(): Promise<void> {
    if (this.files.length === 0) {
      this.showAlert('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');
      return;
    }
    
    this.isUploading = true;
    
    try {
      // ตรวจสอบและบันทึกข้อมูลผลงานก่อน (ถ้ายังไม่ได้บันทึก)
      await this.ensurePortfolioSaved();
      
      // ตรวจสอบว่ามี portfolio_id หรือไม่
      if (!this.userData || !this.userData.last_idx) {
        throw new Error('ไม่พบข้อมูลผลงาน กรุณาลองใหม่อีกครั้ง');
      }
      
      let successCount = 0;
      
      for (const [index, fileObj] of this.files.entries()) {
        // Show progress
        this.showAlert(`กำลังอัปโหลดรูปที่ ${index + 1} จาก ${this.files.length}`, false);
       
        try {
          // Upload image
          const response: any = await this.imageUploadService.uploadImage(fileObj.file).toPromise();
          
          if (response && response.data && response.data.url) {
            const imageUrl = response.data.url;
            
            // Save image URL to database
            const apiUrl = this.constants.API_ENDPOINT + '/update/Portfolio/image';
            const payload = {
              portfolio_id: this.userData.last_idx,
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
          // Continue with other images
        }
      }
      
      if (successCount === this.files.length) {
        this.showAlert('อัปโหลดรูปทั้งหมดสำเร็จ');
        this.navigateToNextStep();
      } else if (successCount > 0) {
        this.showAlert(`อัปโหลดสำเร็จ ${successCount} จาก ${this.files.length} รูป`);
        this.navigateToNextStep();
      } else {
        this.showAlert('ไม่สามารถอัปโหลดรูปได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error: any) {
      console.error('Error during upload process:', error);
      this.showAlert(error.message || 'เกิดข้อผิดพลาดระหว่างการอัปโหลด กรุณาลองใหม่อีกครั้ง');
    } finally {
      this.isUploading = false;
    }
  }

  // Navigation - ส่ง user_id, tags_id, portfolio_id และข้อมูล skip ไปหน้าถัดไป
  navigateToNextStep(): void {
  const navigationData = {
    user_id: this.userData.user_id,
    tags_id: this.portfolioForm.value.tags_id,
    portfolio_id: this.userData.last_idx, // ใช้ค่า portfolio_id ล่าสุดที่บันทึกไป
    // skippedSteps: this.skippedSteps, // ส่งข้อมูลว่าข้ามส่วนข้อมูลส่วนตัวหรือไม่
  };

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

  // ฟังก์ชันเพิ่มเติมสำหรับการจัดการขั้นตอนที่ข้าม
  getSkippedStepsCount(): number {
    return this.skippedSteps.personalInfo ? 1 : 0;
  }

  getSkippedStepsText(): string {
    return this.skippedSteps.personalInfo ? 'ข้ามขั้นตอน: ข้อมูลส่วนตัว' : 'ดำเนินการครบทุกขั้นตอน';
  }

  // ตรวจสอบสถานะการบันทึกผลงาน
  isPortfolioFormValid(): boolean {
    return this.portfolioForm.valid;
  }

  //ด้ปุ่มอัปโหลดพร้อมใช้งานหรือไม่
  isUploadButtonEnabled(): boolean {
    return this.files.length > 0 && 
           this.portfolioForm.valid && 
           !this.isUploading && 
           !this.isPortfolioInfoSubmitting;
  }
}
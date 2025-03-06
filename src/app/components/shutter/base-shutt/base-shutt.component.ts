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
  
  constructor(
    private fb: FormBuilder,
    private constants: Constants,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private imageUploadService: ImageUploadService
  ) {
    // Initialize forms
    this.initForms();
  }
  
  ngOnInit(): void {
    // Get route parameters and fetch tags
    this.getUserData();
    this.fetchTags();
  }
  
  private initForms(): void {
    // Personal information form
    this.photographerForm = this.fb.group({
      lineID: ['', Validators.required],
      facebook: [''],
      description: ['', Validators.required]
    });
    
    // Portfolio information form
    this.portfolioForm = this.fb.group({
      name_work: ['', Validators.required],
      tags_id: ['', Validators.required]
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
  
  // Save portfolio information
  savePortfolioInfo(): void {
    if (this.portfolioForm.invalid) {
      this.portfolioForm.markAllAsTouched();
      return;
    }
    
    this.isPortfolioInfoSubmitting = true;
    const url = this.constants.API_ENDPOINT + '/add/Portfolio';
    const formData = {
      user_id: this.userData.user_id,
      tags_id: this.portfolioForm.value.tags_id,
      name_work: this.portfolioForm.value.name_work
    };
    
    this.http.post(url, formData)
      .pipe(finalize(() => this.isPortfolioInfoSubmitting = false))
      .subscribe({
        next: (response) => {
          console.log('Portfolio info saved:', response);
          
          // Update user data with response
          this.userData = { ...this.userData, ...response };
          
          // Show success message
          this.showAlert('บันทึกข้อมูลผลงานสำเร็จ');
          
          // Scroll to next section
          document.getElementById('portfolio-upload')?.scrollIntoView({ behavior: 'smooth' });
        },
        error: (error) => {
          console.error('Error saving portfolio info:', error);
          this.handleApiError(error);
        }
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
  
  // Upload images
  async uploadImages(): Promise<void> {
    if (this.files.length === 0) {
      this.showAlert('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');
      return;
    }
    
    if (!this.userData || !this.userData.last_idx) {
      this.showAlert('ข้อมูลไม่ครบถ้วน กรุณาบันทึกข้อมูลส่วนตัวและข้อมูลผลงานก่อน');
      return;
    }
    
    this.isUploading = true;
    let successCount = 0;
    
    try {
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
      
      this.isUploading = false;
      
      if (successCount === this.files.length) {
        this.showAlert('อัปโหลดรูปทั้งหมดสำเร็จ');
        this.navigateToNextStep();
      } else if (successCount > 0) {
        this.showAlert(`อัปโหลดสำเร็จ ${successCount} จาก ${this.files.length} รูป`);
        this.navigateToNextStep();
      } else {
        this.showAlert('ไม่สามารถอัปโหลดรูปได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Error during upload process:', error);
      this.isUploading = false;
      this.showAlert('เกิดข้อผิดพลาดระหว่างการอัปโหลด กรุณาลองใหม่อีกครั้ง');
    }
  }
  
  // Navigation
  navigateToNextStep(): void {
    this.router.navigate(['/base3'], { state: { data: this.userData } });
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
}
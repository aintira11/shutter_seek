import { CommonModule } from '@angular/common';
import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DataMembers, DataTegs, DataWorkforEdit } from '../../../model/models';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../service/auth.service';

// Confirm delete dialog component
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatButtonModule, CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>ยืนยันการลบ</h2>
    <div mat-dialog-content>คุณต้องการลบแพ็กเกจนี้ใช่หรือไม่?</div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>ยกเลิก</button>
      <button mat-button [mat-dialog-close]="true" color="warn">ลบ</button>
    </div>
  `
})
export class ConfirmDeleteDialogComponent {}

@Component({
  selector: 'app-insert-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './insert-portfolio.component.html',
  styleUrls: ['./insert-portfolio.component.scss'],
})
export class InsertPortfolioComponent {
  opened = true;
  data: DataMembers[]=[];
  dataWork: DataWorkforEdit[] = [];
  portfolioForm!: FormGroup;
  files: { file: File; preview: string; newName?: string }[] = [];
  selectedFile?: File;
  imagePreview: string = '';
  isUploading = false;
  selectedCategoryIndex: number | null = null;
  isAddingNewCategory = false;
  isEditCategory = false;
  Tags: DataTegs[] = [];

  selectedTagId: number = 0;
   

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private Constants: Constants,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private imageUploadService: ImageUploadService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    // this.route.paramMap.subscribe(() => {
    //   const receivedData = window.history.state.data;
    //   if (Array.isArray(receivedData) && receivedData.length > 0) {
    //     this.data = receivedData[0];
    //   } else {
    //     this.data = receivedData;
    //   }
    //   console.log('Response form:', this.data);
    // });
    const user = this.authService.getUser();
    if (!user) {
      console.error("ไม่พบข้อมูลผู้ใช้ใน AuthService");
      return;
    }
    this.data = [user];

    this.portfolioForm = this.fb.group({
      categoryName: ['',[Validators.required, this.noWhitespaceValidator]],
    });
    this.getdatauser(this.data[0].user_id);
    this.getdataWork(this.data[0].user_id);
    this.fetchTags();
  }

   noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) {
          return null; // ให้ required validator จัดการกรณีที่ไม่มีค่า
        }
        
        const isWhitespace = (control.value || '').trim().length === 0;
        const isValid = !isWhitespace;
        return isValid ? null : { 'whitespace': true };
      }
    

  getdatauser(id: number) {
    const url = `${this.Constants.API_ENDPOINT}/read/${id}`;
    this.http.get(url).subscribe((response: any) => {
      this.data = response;
      console.log('Updated User Data:', this.data);
    });
  }

  getdataWork(id: number) {
    const url = `${this.Constants.API_ENDPOINT}/get/PortfolioForEdit/${id}`;
    this.http.get(url).subscribe((response: any) => {
      this.dataWork = response;
      console.log('Data Work for Edit:', this.dataWork);
    });
  }
  // ฟังก์ชันเช็คว่า tag ที่เลือกจะถูก disabled หรือไม่
    isTagDisabled(tagId: number): boolean {
      // ตรวจสอบว่ามี tag ใดใน dataWork ที่มี tags_id ตรงกับ tagId หรือไม่
      return this.dataWork.some(work => work.tags_id === tagId);
    }

  private fetchTags(): void {
    const url = this.Constants.API_ENDPOINT + '/tegs';
    this.http.get<DataTegs[]>(url).subscribe({
      next: (response) => {
        this.Tags = response;
        console.log('Tags data:', this.Tags);
      },
      error: (error) => {
        console.error('Error fetching tags:', error);
        // Show user-friendly error message
        this.showSnackBar('ไม่สามารถดึงข้อมูลหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง');
        // this.showAlert('ไม่สามารถดึงข้อมูลหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง');
      }
    });
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  editCategory(index: number) {
    this.selectedCategoryIndex = index;
    this.isAddingNewCategory = false;
    this.isEditCategory = true;
    
    // ตั้งค่า selectedTagId เป็นหมวดหมู่เดิมของผลงานที่จะแก้ไข
    this.selectedTagId = this.dataWork[index].tags_id;
    
    console.log('Editing category:', this.dataWork[index]);
    console.log('Current tag ID:', this.selectedTagId);
  }

  cancelEdit() {
    this.selectedCategoryIndex = null;
    this.isAddingNewCategory = false;
    this.isEditCategory = false
    this.selectedTagId = 0; // รีเซ็ตค่า
  }

  uploadImage(file: File, catIndex: number) {
    this.isUploading = true;
    this.imageUploadService.uploadImage(file).subscribe({
      next: (response: any) => {
        const imageUrl = response.data.url;
        this.dataWork[catIndex].image_urls.push(imageUrl);
        this.isUploading = false;
        this.showSnackBar('อัปโหลดรูปภาพสำเร็จ');
      },
      error: (error) => {
        this.isUploading = false;
        this.showSnackBar('การอัปโหลดผิดพลาด');
        console.error('Upload error:', error);
      }
    });
  }

  updateWorkCategory(index: number, event: any): void {
    const selectedCategory = event.target.value;
    // หาค่า ID ที่ตรงกับชื่อที่เลือก
    const selectedTag = this.Tags.find(tag => tag.name_tags === selectedCategory);
    
    this.dataWork[index].name_tags = selectedCategory;
    if (selectedTag) {
      this.dataWork[index].tags_id = selectedTag.tags_id; // ต้องใช้ชื่อฟิลด์จริงของ ID ใน DataTegs
    }
  }

  savePortfolio() {
    if (this.selectedCategoryIndex === null && !this.isAddingNewCategory) {
      this.showSnackBar('ไม่พบข้อมูลที่จะบันทึก');
      return;
    }
    
    console.log('Current data:', this.data);
    const userId = Array.isArray(this.data) && this.data.length > 0 ? this.data[0].user_id : null;
    if (!userId) {
       this.showSnackBar('ไม่พบรหัสผู้ใช้');
     return;
    }
    console.log('User ID:', userId);
    
    if (this.isAddingNewCategory) {
      // Create new category
      const newCategory = this.dataWork[this.dataWork.length - 1];
      console.log('New category to add:', newCategory);
      
      if (!newCategory.name_work || newCategory.name_work.trim() === '') {
        this.showSnackBar('กรุณาระบุชื่อผลงาน');
        return;
      }
      if (!newCategory.image_urls || newCategory.image_urls.length < 5) {
        this.showSnackBar('กรุณาเลือกรูปภาพ อย่างน้อย 5 รูป');
        return;
      }
      // const Tag:number=2;
      
      const url = `${this.Constants.API_ENDPOINT}/add/portfolioForShutt`;
     // ในส่วนของการเพิ่มผลงานใหม่
      const formData = {
        user_id: userId,
        tags_id: this.selectedTagId, 
        name_work: newCategory.name_work,
        image_urls: newCategory.image_urls
      };
      
      console.log('POST URL for adding portfolio:', url);
      console.log('Form data for adding portfolio:', formData);
      
      this.http.post(url, formData).subscribe({
        next: (response) => {
          console.log('Portfolio added - API response:', response);
          this.showSnackBar('เพิ่มผลงานสำเร็จ');
          this.selectedCategoryIndex = null;
          this.isAddingNewCategory = false;
          this.selectedTagId = 0; // รีเซ็ตค่า
          this.getdataWork(userId);
        },
        error: (error) => {
          console.error('Add portfolio error - Full error object:', error);
          this.showSnackBar('เกิดข้อผิดพลาดในการเพิ่มผลงาน');
        }
      });
    } else if(this.isEditCategory){
      // Update existing category
      const categoryToUpdate = this.dataWork[this.selectedCategoryIndex!];
      console.log('Category to update:', categoryToUpdate);
      console.log('Selected category index:', this.selectedCategoryIndex);
      
      if (!categoryToUpdate.name_work || categoryToUpdate.name_work.trim() === '') {
        this.showSnackBar('กรุณาระบุชื่อผลงาน');
        return;
      }
      
      const url = `${this.Constants.API_ENDPOINT}/update/portfolio`;
      const formData = {
        portfolio_id: categoryToUpdate.portfolio_id,
        // tags_id: categoryToUpdate.tags_id, // ใช้ค่าเดิม
        tags_id: this.selectedTagId, // ใช้ค่าที่เลือกใหม่
        user_id: this.data[0].user_id,
        name_work: categoryToUpdate.name_work,
        image_urls: categoryToUpdate.image_urls
      };
      
      console.log('POST URL for updating portfolio:', url);
      console.log('Form data for updating portfolio:', formData);
      
      this.http.put(url, formData).subscribe({
        next: (response) => {
          console.log('Portfolio updated - API response:', response);
          this.showSnackBar('อัปเดตผลงานสำเร็จ');
          this.selectedCategoryIndex = null;
          this.isEditCategory = false;
          this.selectedTagId = 0; // รีเซ็ตค่า
          this.getdataWork(userId);
        },
        error: (error) => {
          console.error('Update portfolio error - Full error object:', error);
          this.showSnackBar('เกิดข้อผิดพลาดในการอัปเดตผลงาน');
        }
      });
    }
  }

  removeImage(catIndex: number, imgIndex: number) {
    this.dataWork[catIndex].image_urls.splice(imgIndex, 1);
    this.showSnackBar('ลบรูปภาพแล้ว');
  }

  updateWorkName(catIndex: number, event: any) {
    this.dataWork[catIndex].name_work = event.target.value;
  }

  onCategoryImageSelected(event: any, catIndex: number) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.uploadImage(file, catIndex);
    }
  }
    
  addCategory() {
     const user_id = Array.isArray(this.data) && this.data.length > 0 ? this.data[0].user_id : null;
     if (!user_id) {
       this.showSnackBar('ไม่พบรหัสผู้ใช้');
     return;
    }
    const newCategory: any = {
      user_id:0,
      portfolio_id: 0,
      // tags_id:this.selectedTagId,
      tags_id: 0, // เริ่มต้นด้วย 0 จะให้เลือกใหม่
      name_work: '',
      image_urls: []
    };
    
    this.dataWork.push(newCategory);
    this.selectedCategoryIndex = this.dataWork.length - 1;
    this.isAddingNewCategory = true;
    this.selectedTagId = 0; // รีเซ็ตค่าเริ่มต้น
  }

  deleteCategory(catIndex: number) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);
      dialogRef.afterClosed().subscribe(result => {
        if (result) {

    const categoryToDelete = this.dataWork[catIndex];
    if (!categoryToDelete || !categoryToDelete.portfolio_id) {
      this.showSnackBar('ไม่พบข้อมูลที่จะลบ');
      return;
    }
    
    console.log('Category to delete:', categoryToDelete);
    console.log('Portfolio ID:', categoryToDelete.portfolio_id);
    
    if (confirm('คุณต้องการลบผลงานนี้ใช่หรือไม่?')) {
      const url = `${this.Constants.API_ENDPOINT}/delete/portfolio`;
      const requestBody = { 
        portfolio_id: categoryToDelete.portfolio_id,
        user_id: this.data[0].user_id // ต้องแน่ใจว่ามีตัวแปรนี้
      };
      
      console.log('Delete request URL:', url);
      console.log('Delete request body:', requestBody);
      
      this.http.delete(url, {
        body: requestBody
      }).subscribe({
        next: (response) => {
          console.log('Portfolio deleted successfully:', response);
          this.showSnackBar('ลบผลงานสำเร็จ');
          this.dataWork.splice(catIndex, 1);
          this.selectedCategoryIndex = null;
        },
        error: (error) => {
          console.error('Delete portfolio error details:', error);
          this.showSnackBar('เกิดข้อผิดพลาดในการลบผลงาน');
        }
      });
    }
    }
   });
  }

  cancel() {
    this.router.navigate(['/profile'], { state: { data: this.data } });
  }

  showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  toggleSidenav() {
    this.opened = !this.opened;
  }

  goToEditWork() {
    this.router.navigate(['/insertport']);
    // this.router.navigate(['/insertport'], { state: { data: this.data } });
  }

  goToPackagePack(): void {
    this.router.navigate(['/editpac']);
    // this.router.navigate(['/editpac'], { state: { data: this.data } });
  }

  goToEditProfile(): void {
    this.router.navigate(['/editshutter']);
    // this.router.navigate(['/editshutter'], { state: { data: this.data } });
  }

  goToHomeShutter() {
    this.router.navigate(['/mainshutter']);
    // this.router.navigate(['/mainshutter'], { state: { data: this.data } });
  }
  
}
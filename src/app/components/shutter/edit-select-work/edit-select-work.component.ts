import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { AuthService } from '../../../service/auth.service';
import { ImageUploadService } from '../../../services_image/image-upload.service';
import { DataMembers, DataPortfolioByPID, DataTegs, DataWorkforEdit, Package } from '../../../model/models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';


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
  selector: 'app-edit-select-work',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    MatExpansionModule,
    MatDividerModule
  ],
  templateUrl: './edit-select-work.component.html',
  styleUrl: './edit-select-work.component.scss'
})
export class EditSelectWorkComponent implements OnInit {

  datauser: DataMembers[] = [];
  PortfolioID: number | null = null;
  portfolioData: DataPortfolioByPID | null = null;
  dataWork: DataWorkforEdit[] = [];
  packages: Package[] = []; // ใช้ Package interface แทน PackageData
  files: { file: File; preview: string; newName?: string }[] = [];
  selectedFile?: File;
  imagePreview: string = '';
  selectedCategoryIndex: number | null = null;
  isEditCategory = false;
  Tags: DataTegs[] = [];
  selectedTagId: number = 0;
  isUploading = false;
  isLoadingPackages = false;
  isSavingPackages = false;

  constructor(
    public router: Router,
    private Constants: Constants,
    private route: ActivatedRoute,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private imageUploadService: ImageUploadService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      setTimeout(() => {
        this.PortfolioID = window.history.state.idshutter || null;
        if (this.PortfolioID) {
          console.log('Portfolio ID:', this.PortfolioID);
        } else {
          console.error('Portfolio ID is not defined or missing');
        }

        const user = this.authService.getUser();
        if (user) {
          this.datauser = [user];
          console.log("Loaded user from AuthService:", this.datauser);
        } else {
          console.error("Error: User data not found in AuthService");
        }

        if (!this.PortfolioID) {
          console.error("Error: idshutter is undefined or missing");
        }

        this.portfolioshutter(String(this.PortfolioID));
        this.fetchTags();
        this.loadWorkData();
      }, 100);
    });
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
      }
    });
  }

  portfolioshutter(portfolio_id: string) {
    console.log('id', portfolio_id);
    const url = `${this.Constants.API_ENDPOINT}/get/portfolioByportfolio_id/` + portfolio_id;
    this.http.get<DataPortfolioByPID>(url).subscribe({
      next: (response: DataPortfolioByPID) => {
        this.portfolioData = response;
        console.log("data portfolio :", this.portfolioData);
        
        // โหลดข้อมูล packages จาก portfolio data
        this.loadPackagesFromPortfolio();
        this.loadWorkData();
      },
      error: (error) => {
        console.error('Error loading portfolio:', error);
        this.showSnackBar('ไม่สามารถดึงข้อมูลผลงานได้');
      }
    });
  }

  // ฟังก์ชันใหม่สำหรับโหลด packages จาก portfolio data
  private loadPackagesFromPortfolio(): void {
    if (this.portfolioData && this.portfolioData.packages) {
      this.packages = [...this.portfolioData.packages]; // copy array
      console.log('Packages loaded from portfolio:', this.packages);
      
      // ถ้าไม่มี packages เลย ให้สร้างแพ็กเกจเปล่าเพื่อเพิ่มใหม่
      if (this.packages.length === 0) {
        this.addNewPackage();
      }
    } else {
      this.packages = [];
      this.addNewPackage();
    }
  }

  // เพิ่มแพ็กเกจใหม่
  addNewPackage(): void {
    const newPackage: Package = {
      package_id: 0, // ใช้ 0 เป็นค่า temporary สำหรับแพ็กเกจใหม่
      name_package: '',
      detail: '',
      price: 0
    };
    this.packages.push(newPackage);
  }

  // ลบแพ็กเกจ
removePackage(index: number): void {
  const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);
  dialogRef.afterClosed().subscribe(result => {
    if (result) {

  const packageToRemove = this.packages[index];

  if (packageToRemove.package_id && packageToRemove.package_id > 0) {
    const url = `${this.Constants.API_ENDPOINT}/delete/packageShutt`;
    const body = {
      package_id: packageToRemove.package_id,
      user_id: this.datauser[0].user_id // << ตรวจสอบว่าคุณมี user_id จากผู้ใช้
    };

    this.http.delete(url, { body }).subscribe({
      next: () => {
        this.packages.splice(index, 1);
        this.showSnackBar('ลบแพ็กเกจสำเร็จ');
      },
      error: (error) => {
        console.error('Error deleting package:', error);
        this.showSnackBar('ไม่สามารถลบแพ็กเกจได้');
      }
    });
  } else {
    this.packages.splice(index, 1);
    this.showSnackBar('ลบแพ็กเกจสำเร็จ');
  }
}
   });
}


  // บันทึกแพ็กเกจทั้งหมด
  async savePackages(): Promise<void> {
    if (!this.validatePackages()) {
      return;
    }

    this.isSavingPackages = true;
    const apiUrl = `${this.Constants.API_ENDPOINT}`;
    let hasErrors = false;

    for (let packageData of this.packages) {
      // หาผลงานที่เลือกเพื่อรับ tags_id
      const portfolioId = this.PortfolioID;
      const selectedPortfolio = this.dataWork.find(
        work => work.portfolio_id === portfolioId
      );

      if (!selectedPortfolio) {
        console.error("ไม่พบผลงานที่เลือก");
        this.showSnackBar('ไม่พบข้อมูลผลงานที่เลือก โปรดเลือกผลงานอีกครั้ง');
        hasErrors = true;
        continue;
      }

      const payload = {
        package_id: packageData.package_id > 0 ? packageData.package_id : null,
        portfolio_id: portfolioId,
        tags_id: selectedPortfolio.tags_id,
        user_id: this.datauser[0].user_id,
        name_package: packageData.name_package,
        detail: packageData.detail,
        price: packageData.price,
      };

      console.log("Payload ที่กำลังจะส่งไป:", payload);

      try {
        if (packageData.package_id && packageData.package_id > 0) {
          // อัปเดตแพ็กเกจที่มีอยู่
          await this.http.put(`${apiUrl}/update/package`, payload).toPromise();
        } else {
          // สร้างแพ็กเกจใหม่
          const response: any = await this.http.post(`${apiUrl}/add/package`, payload).toPromise();
          // อัปเดต package_id จากการสร้างใหม่
          packageData.package_id = response.package_id;
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดขณะบันทึกข้อมูลแพ็กเกจ:", error);
        hasErrors = true;
      }
    }

    this.isSavingPackages = false;

    if (!hasErrors) {
      this.showSnackBar('บันทึกข้อมูลแพ็กเกจสำเร็จ');
    } else {
      this.showSnackBar('เกิดข้อผิดพลาดขณะบันทึกข้อมูล');
    }
  }

  // ตรวจสอบข้อมูลแพ็กเกจ
  private validatePackages(): boolean {
    if (!this.packages || this.packages.length === 0) {
      this.showSnackBar('กรุณาเพิ่มแพ็กเกจอย่างน้อย 1 รายการ');
      return false;
    }

    for (let i = 0; i < this.packages.length; i++) {
      const pkg = this.packages[i];
      
      if (!pkg.name_package || pkg.name_package.trim() === '') {
        this.showSnackBar(`กรุณาระบุชื่อแพ็กเกจในรายการที่ ${i + 1}`);
        return false;
      }

      if (!pkg.detail || pkg.detail.trim() === '') {
        this.showSnackBar(`กรุณาระบุรายละเอียดแพ็กเกจในรายการที่ ${i + 1}`);
        return false;
      }

      if (!pkg.price || pkg.price <= 0) {
        this.showSnackBar(`กรุณาระบุราคาแพ็กเกจในรายการที่ ${i + 1}`);
        return false;
      }
    }

    return true;
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

  updateWorkCategory(index: number, event: any): void {
    const selectedCategory = event.target.value;
    const selectedTag = this.Tags.find(tag => tag.name_tags === selectedCategory);
    
    this.dataWork[index].name_tags = selectedCategory;
    if (selectedTag) {
      this.dataWork[index].tags_id = selectedTag.tags_id;
    }
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

  editCategory(index: number) {
    this.selectedCategoryIndex = index;
    this.isEditCategory = true;
    this.selectedTagId = this.dataWork[index].tags_id;
    
    console.log('Editing category:', this.dataWork[index]);
    console.log('Current tag ID:', this.selectedTagId);
  }

  onCategoryImageSelected(event: any, catIndex: number) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.uploadImage(file, catIndex);
    }
  }

  showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  // บันทึกเฉพาะผลงาน
  async savePortfolio(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    // บันทึกข้อมูลผลงาน
    if (this.isEditCategory) {
      const categoryToUpdate = this.dataWork[this.selectedCategoryIndex!];
      
      const url = `${this.Constants.API_ENDPOINT}/update/portfolio`;
      const formData = {
        portfolio_id: categoryToUpdate.portfolio_id,
        tags_id: this.selectedTagId,
        user_id: this.datauser[0].user_id,
        name_work: categoryToUpdate.name_work,
        image_urls: categoryToUpdate.image_urls
      };
      
      console.log('Updating portfolio with data:', formData);
      
      try {
        await this.http.put(url, formData).toPromise();
        console.log('Portfolio updated successfully');
        this.showSnackBar('อัปเดตผลงานสำเร็จ');
        
        // รีเซ็ตค่าและกลับไปหน้าก่อนหน้า
        this.selectedCategoryIndex = null;
        this.isEditCategory = false;
        this.selectedTagId = 0;
        
        setTimeout(() => {
          this.router.navigate(['/mainshutter']);
        }, 1500);
        
      } catch (error) {
        console.error('Error updating portfolio:', error);
        this.showSnackBar('เกิดข้อผิดพลาดในการอัปเดตผลงาน');
      }
    }
  }

  // บันทึกทั้งผลงานและแพ็กเกจ
  async savePortfolioWithPackages(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    // บันทึกข้อมูลผลงาน
    if (this.isEditCategory) {
      const categoryToUpdate = this.dataWork[this.selectedCategoryIndex!];
      
      const url = `${this.Constants.API_ENDPOINT}/update/portfolio`;
      const formData = {
        portfolio_id: categoryToUpdate.portfolio_id,
        tags_id: this.selectedTagId,
        user_id: this.datauser[0].user_id,
        name_work: categoryToUpdate.name_work,
        image_urls: categoryToUpdate.image_urls
      };
      
      console.log('Updating portfolio with data:', formData);
      
      try {
        await this.http.put(url, formData).toPromise();
        console.log('Portfolio updated successfully');
        this.showSnackBar('อัปเดตผลงานสำเร็จ');
        
        // บันทึกแพ็กเกจ
        if (this.packages.length > 0) {
          await this.savePackages();
        }
        
        // รีเซ็ตค่าและกลับไปหน้าก่อนหน้า
        this.selectedCategoryIndex = null;
        this.isEditCategory = false;
        this.selectedTagId = 0;
        
        setTimeout(() => {
          this.router.navigate(['/mainshutter']);
        }, 1500);
        
      } catch (error) {
        console.error('Error updating portfolio:', error);
        this.showSnackBar('เกิดข้อผิดพลาดในการอัปเดตผลงาน');
      }
    }
  }

  removeImage(index: number): void {
    if (this.selectedCategoryIndex !== null && this.dataWork[this.selectedCategoryIndex]) {
      this.dataWork[this.selectedCategoryIndex].image_urls.splice(index, 1);
      this.showSnackBar('ลบรูปภาพเรียบร้อยแล้ว');
    }
  }

  cancelEdit(): void {
    this.selectedCategoryIndex = null;
    this.isEditCategory = false;
    this.selectedTagId = 0;
    this.imagePreview = '';
    this.selectedFile = undefined;
    
    this.router.navigate(['/mainshutter']);
  }

  initializeEditMode(): void {
    if (this.portfolioData && this.portfolioData.portfolio_id) {
      this.selectedCategoryIndex = 0;
      this.isEditCategory = true;
      
      if (this.dataWork.length > 0) {
        this.selectedTagId = this.dataWork[0].tags_id;
      }
    }
  }

  private loadWorkData(): void {
    if (this.portfolioData) {
      this.dataWork = [{
        portfolio_id: this.portfolioData.portfolio_id,
        name_work: this.portfolioData.name_work || '',
        tags_id: this.portfolioData.tags_id || 0,
        name_tags: this.portfolioData.name_tags || '',
        image_urls: this.portfolioData.images || [],
      }];
      
      this.initializeEditMode();
    }
  }

  // ตรวจสอบว่าแพ็กเกจมีการเปลี่ยนแปลงหรือไม่
  private hasPackageChanges(): boolean {
  if (!this.portfolioData || !this.portfolioData.packages) {
    return this.packages.length > 0;
  }

  const originalPackages = this.portfolioData.packages;
  
  // ตรวจสอบจำนวน
  if (originalPackages.length !== this.packages.length) {
    return true;
  }

  // ตรวจสอบแต่ละแพ็กเกจ
  for (let i = 0; i < this.packages.length; i++) {
    const current = this.packages[i];
    const original = originalPackages.find(p => p.package_id === current.package_id);
    
    if (!original) {
      // แพ็กเกจใหม่หรือไม่พบแพ็กเกจต้นฉบับ
      return true;
    } else {
      // ตรวจสอบการเปลี่ยนแปลง
      if (
        current.name_package !== original.name_package ||
        current.detail !== original.detail ||
        current.price !== original.price
      ) {
        return true;
      }
    }
  }

  return false;
}

  // บันทึกอัตโนมัติ - ตรวจสอบว่ามีการเปลี่ยนแปลงอะไรบ้าง
  async saveAuto(): Promise<void> {
  if (!this.validateForm()) {
    return;
  }

  // บันทึกข้อมูลผลงาน
  if (this.isEditCategory) {
    const categoryToUpdate = this.dataWork[this.selectedCategoryIndex!];
    
    const url = `${this.Constants.API_ENDPOINT}/update/portfolio`;
    const formData = {
      portfolio_id: categoryToUpdate.portfolio_id,
      tags_id: this.selectedTagId,
      user_id: this.datauser[0].user_id,
      name_work: categoryToUpdate.name_work,
      image_urls: categoryToUpdate.image_urls
    };
    
    try {
      await this.http.put(url, formData).toPromise();
      console.log('Portfolio updated successfully');
      this.showSnackBar('อัปเดตผลงานสำเร็จ');
      
      // บันทึกแพ็กเกจทุกครั้ง (ถ้ามีแพ็กเกจ)
      if (this.packages.length > 0) {
        console.log('Saving packages...');
        await this.savePackages();
      }
      
      // รีเซ็ตค่าและกลับไปหน้าก่อนหน้า
      this.selectedCategoryIndex = null;
      this.isEditCategory = false;
      this.selectedTagId = 0;
      
      setTimeout(() => {
        this.router.navigate(['/mainshutter']);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating portfolio:', error);
      this.showSnackBar('เกิดข้อผิดพลาดในการอัปเดตผลงาน');
    }
  }
}

  private validateForm(): boolean {
    if (!this.dataWork || this.dataWork.length === 0) {
      this.showSnackBar('ไม่พบข้อมูลผลงาน');
      return false;
    }
    
    const currentWork = this.dataWork[this.selectedCategoryIndex || 0];
    
    if (!currentWork.name_work || currentWork.name_work.trim() === '') {
      this.showSnackBar('กรุณาระบุชื่อผลงาน');
      return false;
    }
    
    if (!this.selectedTagId || this.selectedTagId === 0) {
      this.showSnackBar('กรุณาเลือกหมวดหมู่');
      return false;
    }
    
    return true;
  }
}
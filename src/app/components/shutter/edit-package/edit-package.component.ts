import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DataMembers, Datapackages, DataTypeforPacke } from '../../../model/models';
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
  selector: 'app-edit-package',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    RouterModule,
    MatInputModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './edit-package.component.html',
  styleUrl: './edit-package.component.scss'
})
export class EditPackageComponent {
  opened = true;
  data: DataMembers[]=[];
  fromreister!: FormGroup;
  TagsWork: DataTypeforPacke[] = [];
  
  // แก้ไขโมเดลแพ็กเกจให้มีฟิลด์ที่ถูกต้อง
  packages: Datapackages[] = [];

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private Constants: Constants,
    private http: HttpClient,
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // this.route.paramMap.subscribe(() => {
    //   const receivedData = window.history.state.data;
  
    //   // ตรวจสอบว่า receivedData เป็นอาร์เรย์ที่มีข้อมูลหรือไม่
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
    this.getdatauser(this.data[0].user_id);
    // ดึงข้อมูลผลงานก่อน จากนั้นจึงโหลดแพ็กเกจ
    this.getworkType(this.data[0].user_id);
  }

  // ดึงข้อมูลประเภทผลงานที่มี
  async getworkType(id: number) {
    try {
      const url = this.Constants.API_ENDPOINT + '/get/workType/' + id;
      const response: any = await this.http.get(url).toPromise();
      this.TagsWork = response;
      console.log("ข้อมูลผลงานสำหรับแพ็กเกจ:", this.TagsWork);
      
      // หลังจากได้ข้อมูลผลงานแล้ว จึงโหลดแพ็กเกจ
      this.loadUserPackages(id);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดผลงาน:", error);
      this.TagsWork = [];
    }
  }
  
  // โหลดแพ็กเกจที่มีอยู่
  loadUserPackages(userId: number) {
    const url = `${this.Constants.API_ENDPOINT}/get/packages/${userId}`;
    
    this.http.get(url).subscribe((response: any) => {
      if (response && Array.isArray(response)) {
        // แปลงข้อมูลจาก API เป็นรูปแบบของแพ็กเกจ
        this.packages = response;
        
      } else {
        // ถ้ายังไม่มีแพ็กเกจใดๆ ให้เริ่มด้วยแพ็กเกจว่าง
        this.packages = [];
      }
      console.log("Loaded packages:", this.packages);
    }, error => {
      console.error("Error loading packages:", error);
      // เริ่มด้วยแพ็กเกจว่างในกรณีเกิดข้อผิดพลาด
      this.packages = [];
    });
  }
  

  // เพิ่มแพ็กเกจใหม่
  addPackage() {
    this.packages.push({ 
      package_id: 0,  // หรือ null ถ้ายังไม่มีค่า
      user_id: 0,     // หรือระบุ user ที่เกี่ยวข้อง
      portfolio_id: 0, // อาจใช้ null ถ้ายังไม่เลือก
      tags_id: 0,     // หรืออาจให้เป็นค่าเริ่มต้นที่เหมาะสม
      name_tags: '', 
      name_package: '', 
      detail: '', 
      price: 0
    });
    
    this.showNotification('เพิ่มแพ็กเกจใหม่แล้ว');
  }
  
  // ลบแพ็กเกจ
  deletePackage(index: number) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);
    
    dialogRef.afterClosed().subscribe(result => {
      if (result  === true ) {
        const packageToDelete = this.packages[index];
        
        // ถ้าแพ็กเกจมี ID แสดงว่ามีอยู่ในฐานข้อมูลและต้องลบ
        if (packageToDelete.package_id) {
          const url = `${this.Constants.API_ENDPOINT}/delete/packageShutt`;

this.http.request('delete', url, { body: { package_id: packageToDelete.package_id, user_id: packageToDelete.user_id } })
  .subscribe(
    () => {
      this.packages.splice(index, 1);
      this.showNotification('ลบแพ็กเกจสำเร็จ');

      if (this.packages.length === 0) {
        this.packages.push({ 
          package_id: 0,
          user_id: 0,
          portfolio_id: 0,
          tags_id: 0,
          name_tags: '', 
          name_package: '', 
          detail: '', 
          price: 0
        });
      }
    },
    error => {
      console.error("Error deleting package:", error);
      this.showNotification('เกิดข้อผิดพลาดในการลบแพ็กเกจ', true);
    }
  );

        } else {
          // สำหรับแพ็กเกจที่ยังไม่มีในฐานข้อมูล เพียงลบออกจากอาร์เรย์
          this.packages.splice(index, 1);
          
          // ถ้าลบแพ็กเกจทั้งหมดแล้ว ให้เพิ่มแพ็กเกจว่างหนึ่งรายการ
          if (this.packages.length === 0) {
            this.packages.push({ 
              package_id: 0,  // หรือ null ถ้ายังไม่มีค่า
              user_id: 0,     // หรือระบุ user ที่เกี่ยวข้อง
              portfolio_id: 0, // อาจใช้ null ถ้ายังไม่เลือก
              tags_id: 0,     // หรืออาจให้เป็นค่าเริ่มต้นที่เหมาะสม
              name_tags: '', 
              name_package: '', 
              detail: '', 
              price: 0
            });
          }
        }
      }else{
        this.showNotification('ยกเลิกการลบแพ็กเกจ');
      }
    });
  }

  // ตรวจสอบความถูกต้องของข้อมูลแพ็กเกจ
  validatePackages(): boolean {
    const hasEmptyPackages = this.packages.some(pkg => 
      !pkg.name_package || !pkg.portfolio_id || !pkg.detail || !pkg.price
    );
    
    if (hasEmptyPackages) {
      this.showNotification('กรุณากรอกข้อมูลแพ็กเกจให้ครบทุกช่อง', true);
      return false;
    }
    return true;
  }

  // แสดงการแจ้งเตือน
  showNotification(message: string, isError: boolean = false) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      panelClass: isError ? ['error-snackbar'] : ['success-snackbar'],verticalPosition: 'top',
    });
  }

  async savePackages() {
    if (!this.validatePackages()) {
      return;
    }
    
    const apiUrl = `${this.Constants.API_ENDPOINT}`;
    let hasErrors = false;
  
        for (let packageData of this.packages) {
          // หาผลงานที่เลือกเพื่อรับ tags_id
          const portfolioId = Number(packageData.portfolio_id); // แปลงเป็นตัวเลขเพื่อป้องกัน type mismatch
          const selectedPortfolio = this.TagsWork.find(
          portfolio => portfolio.portfolio_id === portfolioId
        );

  
      if (!selectedPortfolio) {
        console.error("ไม่พบผลงานที่เลือก");
        this.showNotification('ไม่พบข้อมูลผลงานที่เลือก โปรดเลือกผลงานอีกครั้ง', true);
        hasErrors = true;
        continue;
      }
  
      const payload = {
        package_id: packageData.package_id || null, // เพิ่ม package_id เข้าไป (ถ้ามี)
        // portfolio_id: parseInt(packageData.portfolio_id),
        portfolio_id:(packageData.portfolio_id),
        tags_id: selectedPortfolio.tags_id,
        user_id: selectedPortfolio.user_id, // ดึงจาก selectedPortfolio เพื่อให้ถูกต้อง
        name_package: packageData.name_package,
        detail: packageData.detail,
        price: packageData.price,
      };
  
      console.log("Payload ที่กำลังจะส่งไป:", payload); // ตรวจสอบข้อมูลที่ส่งไป
  
      try {
        if (packageData.package_id) {
          // อัปเดตแพ็กเกจที่มีอยู่
          await this.http.put(`${apiUrl}/update/package`, payload).toPromise();
        } else {
          // สร้างแพ็กเกจใหม่
          await this.http.post(`${apiUrl}/add/package`, payload).toPromise();
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดขณะบันทึกข้อมูลแพ็กเกจ:", error);
        hasErrors = true;
      }
    }
  
    if (!hasErrors) {
      this.showNotification('บันทึกข้อมูลแพ็กเกจสำเร็จ');
      this.router.navigate(['/mainshutter'], { state: { data: this.data } });
    } else {
      this.showNotification('เกิดข้อผิดพลาดขณะบันทึกข้อมูล', true);
    }
  }
  
  
  

  getdatauser(id: number) {
    console.log('Fetching user data for ID:', id);
    const url = `${this.Constants.API_ENDPOINT}/read/${id}`;
    
    this.http.get(url).subscribe((response: any) => {
      this.data = response;  
      console.log("Updated User Data:", this.data);
    });
  }

  toggleSidenav() {
    this.opened = !this.opened;
  }
  
  goToEditWork(){
    this.router.navigate(['/insertport'], { state: { data: this.data} });
  }
 
  goToPackagePack(): void {
    this.router.navigate(['/editpac'], { state: { data: this.data } });
  }
 
  goToEditProfile(): void {
    this.router.navigate(['/editshutter'], { state: { data: this.data } });
  }
  
  goToHomeShutter() {
    this.router.navigate(['/mainshutter'], { state: { data: this.data } });
  }
}
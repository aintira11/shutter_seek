import { Component } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule,Router, ActivatedRoute } from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { DataTegs } from '../../../model/models';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-b-shutter3',
  standalone: true,
  imports: [FormsModule
    ,MatButtonModule
    ,MatFormFieldModule
    ,MatInputModule
    ,RouterModule
    ,MatCardModule
    ,CommonModule 
    ,MatSnackBarModule
  ],
  templateUrl: './b-shutter3.component.html',
  styleUrl: './b-shutter3.component.scss'
})
export class BShutter3Component {
  Tags:DataTegs[]=[];
  fromreister!: FormGroup;
  data: any;

  //รับจากหน้าที่แล้ว
  user_id:number=0;
  tags_id:number=0;
  portfolio_id:number=0;

  // เพิ่มตัวแปรสำหรับเก็บข้อมูลภาพ
  portfolioImages: string[] = [];
  portfolioData: any = null;
  isLoadingImages: boolean = false;

  // ประกาศตัวแปรสำหรับเก็บสถานะของ checkbox แต่ละตัว
  checkboxesStatus = [false]; // ตัวอย่าง: false หมายถึงไม่ได้ติ๊ก

  constructor(private router: Router,
        private Constants: Constants, 
        private route: ActivatedRoute, 
        private http: HttpClient, private snackBar: MatSnackBar,
  ) {}

  async ngOnInit(): Promise<void> {
    const stateData = history.state.data;
    if (stateData) {
      console.log("Data received:", stateData);
      this.user_id = stateData.user_id;
      this.tags_id = stateData.tags_id;
      this.portfolio_id = stateData.portfolio_id;
      
      // ดึงข้อมูลภาพหลังจากได้ portfolio_id
      await this.getPortfolioImages();
    } else {
      console.warn("No data received");
    }
  }

  // ฟังก์ชันดึงข้อมูลภาพของ portfolio
  async getPortfolioImages() {
    if (!this.portfolio_id) {
      console.error('ไม่พบ portfolio_id');
      return;
    }

    this.isLoadingImages = true;
    
    try {
      const apiUrl = `${this.Constants.API_ENDPOINT}/get/portfolio_images/${this.portfolio_id}`;
      console.log('กำลังดึงภาพจาก API:', apiUrl);
      
      const response: any = await this.http.get(apiUrl).toPromise();
      
      // ตรวจสอบโครงสร้างข้อมูลที่ได้รับ
      let item = null;
if (Array.isArray(response) && response.length > 0) {
  item = response[0];
} else if (response && response.image_urls) {
  item = response;
}

if (item && item.image_urls && Array.isArray(item.image_urls)) {
  this.portfolioImages = item.image_urls;
  this.portfolioData = item;
} else {
  console.error('ข้อมูลไม่ตรงโครงสร้างที่คาดหวัง:', response);
  this.portfolioImages = [];
}
      
      console.log('ข้อมูลภาพที่ได้รับ:', this.portfolioImages);
      console.log('ข้อมูลทั้งหมด:', this.portfolioData);
      
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงภาพ:', error);
      this.portfolioImages = [];
    } finally {
      this.isLoadingImages = false;
    }
  }

  //----------------------------------------------------------------------------------------------
  packages: { name: string; description: string; price: string }[] = [
    { name: '', description: '', price: '' },
  ];
  
  // ฟังก์ชันเพิ่มแพ็กเกจ
  addPackage() {
    this.packages.push({ name: '', description: '', price: '' });
  }
  
  // ฟังก์ชันตรวจสอบว่า checkbox ทั้งหมดถูกติ๊กหรือไม่
  checkAllChecked() {
    return this.checkboxesStatus.every(status => status);
  }
  
  async savePackages() {
    if (!this.checkAllChecked()) {
      this.showSnackBar('กรุณาติ๊กทุกช่องก่อนกดยืนยัน');
      // alert("กรุณาติ๊กทุกช่องก่อนกดยืนยัน");
      return;
    }
  
    // ตรวจสอบว่าข้อมูลแพ็กเกจครบถ้วน
  const hasEmptyPackages = this.packages.some(pkg =>
    !pkg.name || !pkg.description || !pkg.price || isNaN(Number(pkg.price))
  );

  if (hasEmptyPackages) {
    this.showSnackBar('กรุณากรอกข้อมูลแพ็กเกจให้ครบ และราคาต้องเป็นตัวเลข');
    // alert("กรุณากรอกข้อมูลแพ็กเกจให้ครบ และราคาต้องเป็นตัวเลข");
    return;
  }
  
    const apiUrl = `${this.Constants.API_ENDPOINT}/add/package`;
    let hasErrors = false;
  
    for (let packageData of this.packages) {
      const payload = {
        user_id: this.user_id,
        tags_id: this.tags_id,
        portfolio_id: this.portfolio_id,
        name_package: packageData.name,
        detail: packageData.description,
        price: packageData.price,
      };
  
      console.log("กำลังส่งข้อมูล:", payload);
  
      try {
        const response = await this.http.post(apiUrl, payload).toPromise();
        console.log("การตอบสนองจาก API:", response);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดขณะส่งข้อมูลแพ็กเกจ:", error);
        hasErrors = true;
      }
    }
  
    if (!hasErrors) {
      this.isModelOpen = false;
      this.router.navigate(['/login'], { state: { data: this.data } });
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    }
  }
  
  // สร้างตัวแปรสถานะเริ่มต้นโมเดลเป็นปิด
  isModelOpen: boolean = false;

  // ฟังก์ชันเมื่อกดปุ่มไปหน้าถัดไป
  openModel() {
    this.isModelOpen = true;
  }
  
  async closeModel() {
    this.isModelOpen = false;
  }

  // ฟังก์ชันเมื่อกดปุ่มย้อนกลับ
  back() {
    this.router.navigate(['/base2_3']);
  }

   showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
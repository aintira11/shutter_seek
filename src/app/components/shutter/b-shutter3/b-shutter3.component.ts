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

  ],
  templateUrl: './b-shutter3.component.html',
  styleUrl: './b-shutter3.component.scss'
})
export class BShutter3Component {
  Tags:DataTegs[]=[];
  fromreister!: FormGroup;
  data: any;
  // ประกาศตัวแปรสำหรับเก็บสถานะของ checkbox แต่ละตัว
checkboxesStatus = [false]; // ตัวอย่าง: false หมายถึงไม่ได้ติ๊ก

  
  constructor(private router: Router,
        private Constants: Constants, 
        private route: ActivatedRoute, 
        private http: HttpClient,
        
  ) {}
  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      this.data = window.history.state.data;
      console.log('ข้อมูลที่ได้รับ:', this.data);
      
      if (!this.data || !this.data.user_id) {
        console.error('ไม่พบ user_id ในข้อมูล:', this.data);
        // อาจแสดงแจ้งเตือนหรือเปลี่ยนเส้นทาง
      }
    });
  
    await this.gettegs();
  }
  async gettegs() {
    try {
      const url = this.Constants.API_ENDPOINT + '/tegs';
      const response: any = await this.http.get(url).toPromise();
      this.Tags = response;
      console.log("ข้อมูลแท็ก:", this.Tags);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดแท็ก:", error);
      this.Tags = [];
    }
  }
  //----------------------------------------------------------------------------------------------
  packages: { name: string; category: string; description: string; price: string }[] = [
    { name: '', category: '', description: '', price: '' },
  ];
 // ฟังก์ชันเพิ่มแพ็กเกจ
  addPackage() {
    this.packages.push({ name: '', category: '', description: '', price: '' });
  }

  // ฟังก์ชันตรวจสอบว่า checkbox ทั้งหมดถูกติ๊กหรือไม่
checkAllChecked() {
  return this.checkboxesStatus.every(status => status); // ตรวจสอบว่าทุก status เป็น true หรือไม่
}
async savePackages() {
  if (!this.checkAllChecked()) {
    alert("กรุณาติ๊กทุกช่องก่อนกดยืนยัน"); 
    return;
  }
  
  // ตรวจสอบว่าแพ็กเกจมีข้อมูลที่จำเป็นหรือไม่
  const hasEmptyPackages = this.packages.some(pkg => 
    !pkg.name || !pkg.category || !pkg.description || !pkg.price
  );
  
  if (hasEmptyPackages) {
    alert("กรุณากรอกข้อมูลแพ็กเกจให้ครบทุกช่อง");
    return;
  }

  const apiUrl = `${this.Constants.API_ENDPOINT}/add/package`;
  let hasErrors = false;

  for (let packageData of this.packages) {
    // ดึงข้อมูลแท็กที่เลือก
    const selectedTag = this.Tags.find(tag => tag.tags_id === parseInt(packageData.category));
    
    if (!selectedTag) {
      console.error("ไม่พบหมวดหมู่ที่เลือกในแท็ก");
      hasErrors = true;
      continue;
    }
    
    const payload = {
      tags_id: selectedTag.tags_id,
      user_id: this.data?.user_id,  // เพิ่มการตรวจสอบ null
      name_package: packageData.name,
      detail: packageData.description,
      price: packageData.price,
    };
    // ภายในเมธอด savePackages ก่อนการโพสต์ HTTP:
      console.log("กำลังส่งข้อมูล:", {
        apiUrl,
        payload,
        allTags: this.Tags,
        selectedTagId: packageData.category,
        dataType: typeof packageData.category
      });
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
    this.router.navigate(['']);
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
}

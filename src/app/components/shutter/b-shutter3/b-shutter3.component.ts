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
checkboxesStatus = [false, false, false]; // ตัวอย่าง: false หมายถึงไม่ได้ติ๊ก

  
  constructor(private router: Router,
        private Constants: Constants, 
        private route: ActivatedRoute, 
        private http: HttpClient,
        
  ) {}
  async ngOnInit(): Promise<void> {
    //รับข้อมูล จากหน้าที่ส่งมา 
     this.route.queryParams.subscribe(params => {
      // this.route.queryParams.subscribe(params => {
      this.data =window.history.state.data;
      // this.data = params['id'];
      console.log('Response:', this.data);
      //this.next(this.data.user_id);      
      });

      this.gettegs();
  }
  gettegs() {
    const url = this.Constants.API_ENDPOINT + '/admin/tegs' ;
    this.http.get(url).subscribe((response: any) => {
      this.Tags = response;
      console.log("data Tegs :", this.Tags);
    });
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
    if (this.checkAllChecked()) {
    const apiUrl = `${this.Constants.API_ENDPOINT}/shutter/add/package`;
  
    // ส่งข้อมูลทีละแพ็กเกจ
    for (let packageData of this.packages) {
      // หาค่า tags_id ที่ตรงกับ category ที่ผู้ใช้เลือก
      const selectedTag = this.Tags.find(tag => tag.tags_id === Number(packageData.category)); // แปลง package.category เป็น number
  
      // ตรวจสอบว่าพบ tags_id หรือไม่
      if (selectedTag) {
        const payload = {
          tags_id: selectedTag.tags_id,  // ส่ง tags_id จาก this.Tags
          user_id: this.data.user_id,  // ดึง user_id จากข้อมูลที่ส่งมาจากหน้าก่อนหน้า
          name_package: packageData.name,
          detail: packageData.description,
          price: packageData.price,
        };
  
        try {
          const response = await this.http.post(apiUrl, payload).toPromise();
          console.log("Response from API:", response);
        } catch (error) {
          console.error("Error while sending package data:", error);
        }
      } else {
        console.error("Selected category not found in tags.");
      }
    }

    this.isModelOpen = false;
    this.router.navigate(['']); // ตัวอย่าง: เปลี่ยนเส้นทางไปยังหน้าสำเร็จ
  } else {
    alert("กรุณาติ๊กทุกช่องก่อนกดยืนยัน"); // แจ้งเตือนหากยังติ๊กไม่ครบ
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

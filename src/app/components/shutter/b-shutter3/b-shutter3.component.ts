import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule,Router } from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import { CommonModule } from '@angular/common';


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
  
  constructor(private router: Router) {}
  packages: { name: string; category: string; description: string; price: string }[] = [
    { name: '', category: '', description: '', price: '' },
  ];
 // ฟังก์ชันเพิ่มแพ็กเกจ
  addPackage() {
    this.packages.push({ name: '', category: '', description: '', price: '' });
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

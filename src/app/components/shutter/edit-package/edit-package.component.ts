import { Component } from '@angular/core';

@Component({
  selector: 'app-edit-package',
  standalone: true,
  imports: [],
  templateUrl: './edit-package.component.html',
  styleUrl: './edit-package.component.scss'
})
export class EditPackageComponent {
     // Array สำหรับเก็บข้อมูลแพ็กเกจ
     packages = [
      { category: 'สินค้า', price: '5,999', details: '' }
    ];
  
    // ฟังก์ชันสำหรับเพิ่มแพ็กเกจใหม่
    addPackage() {
      this.packages.push({ category: 'สินค้า', price: '', details: '' });
    }
  
    // ฟังก์ชันสำหรับลบแพ็กเกจ
    deletePackage(index: number) {
      this.packages.splice(index, 1);
    }
}

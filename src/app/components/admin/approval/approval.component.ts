import { Component , inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Database, ref, set, get, onValue, update, DataSnapshot, push } from '@angular/fire/database';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

// กำหนดโครงสร้างข้อมูลสำหรับเกณฑ์ย่อย (Sub-Criterion)
interface SubCriterion {
  id: string;
  text: string;
  isEnabled: boolean; // สถานะเปิด/ปิดการใช้งานของเกณฑ์ย่อยนี้
  isEditing?: boolean; // สถานะว่ากำลังแก้ไขข้อความของเกณฑ์ย่อยนี้อยู่หรือไม่
  originalText?: string; // เก็บข้อความเดิมไว้เผื่อกดยกเลิกการแก้ไข
}

// กำหนดโครงสร้างข้อมูลสำหรับหมวดหมู่หลัก (Main Category)
interface ApprovalCategory {
  id: string;
  title: string;
  subCriteria: SubCriterion[];
  isEditing?: boolean; // สถานะว่ากำลังแก้ไขชื่อหมวดหมู่นี้อยู่หรือไม่
  originalTitle?: string; // เก็บชื่อเดิมไว้เผื่อกดยกเลิกการแก้ไข
}

@Component({
  selector: 'app-approval',
  standalone: true,
  imports: [FormsModule, CommonModule,MatButtonModule],
  templateUrl: './approval.component.html',
  styleUrl: './approval.component.scss'
})
export class ApprovalComponent implements OnInit{

  private db: Database = inject(Database);
  private criteriaPath = 'approvalCriteria'; // Path ใน Firebase Realtime Database

  approvalCategories: ApprovalCategory[] = [];
  isLoading = true;
  hasError = false;

  newCategoryTitle: string = '';
  newSubCriterionText: { [categoryId: string]: string } = {};

  constructor(private router: Router,) { }

  ngOnInit(): void {
    this.loadCriteria();
  }

  /**
   * โหลดข้อมูลเกณฑ์อนุมัติจาก Firebase Realtime Database
   * หากไม่มีข้อมูลใน DB จะแสดงเป็นหน้าว่างเปล่า
   */
  async loadCriteria(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;

    try {
      const criteriaRef = ref(this.db, this.criteriaPath);
      const snapshot: DataSnapshot = await get(criteriaRef); 
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        // ตรวจสอบว่าข้อมูลที่ได้เป็น Array หรือไม่ ถ้าไม่ให้แปลง
        if (Array.isArray(data)) {
          this.approvalCategories = data; 
        } else if (typeof data === 'object' && data !== null) {
          // ถ้า Firebase เก็บเป็น Object ที่มี key เป็น ID เช่น { "cat1": { ... }, "cat2": { ... } }
          // คุณอาจจะต้องแปลงเป็น Array ของ Object ที่มี ID อยู่ข้างใน
          this.approvalCategories = Object.keys(data).map(key => ({
            id: key,
            title: data[key].title,
            subCriteria: data[key].subCriteria ? Object.keys(data[key].subCriteria).map((subKey: string) => ({
              id: subKey,
              text: data[key].subCriteria[subKey].text,
              isEnabled: data[key].subCriteria[subKey].isEnabled
            })) : []
          }));
        } else {
          // กรณีที่ข้อมูลมีอยู่แต่รูปแบบไม่ตรงกับที่คาดหวัง
          console.warn('รูปแบบข้อมูลเกณฑ์จาก Firebase ไม่ตรงกับที่คาดไว้ จะแสดงเป็นหน้าว่าง.');
          this.approvalCategories = []; // ตั้งค่าเป็น Array ว่าง
        }
        // console.log('ข้อมูลเกณฑ์ที่ดึงมา:', this.approvalCategories);
      } else {
        // *** แก้ไข: ถ้าไม่มีข้อมูลใน Firebase ก็แค่ตั้งค่าเป็น Array ว่าง ***
        console.warn('ไม่พบข้อมูลเกณฑ์ใน Firebase จะแสดงเป็นหน้าว่างเปล่าเพื่อให้เพิ่มข้อมูลใหม่.');
        this.approvalCategories = []; 
      }
    } catch (error) {
      // *** แก้ไข: ถ้าเกิดข้อผิดพลาดในการดึงข้อมูล ก็แค่ตั้งค่าเป็น Array ว่าง ***
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลเกณฑ์จาก Firebase:', error);
      this.hasError = true; // ยังคงแสดงข้อผิดพลาดให้ผู้ใช้เห็น
      this.approvalCategories = []; // ตั้งค่าเป็น Array ว่าง
    } finally {
      this.isLoading = false; 
    }
  }

  // *** ลบเมธอด loadMockCriteria() ออกไปทั้งหมด ***
  // เนื่องจากเราไม่ต้องการใช้ข้อมูลจำลองแล้ว

  toggleSubCriterion(categoryId: string, subCriterionId: string): void {
    const category = this.approvalCategories.find(cat => cat.id === categoryId);
    if (category) {
      const sub = category.subCriteria.find(s => s.id === subCriterionId);
      if (sub) {
        sub.isEnabled = !sub.isEnabled;
        console.log(`สถานะของ '${sub.text}' ถูกเปลี่ยนเป็น: ${sub.isEnabled}`);
      }
    }
  }

  addCategory(): void {
    if (this.newCategoryTitle.trim()) {
      const newId = Date.now().toString(); 
      this.approvalCategories.push({
        id: newId,
        title: this.newCategoryTitle.trim(),
        subCriteria: [],
        isEditing: false
      });
      this.newCategoryTitle = ''; 
      this.saveCriteria(); 
    } else {
      alert('กรุณากรอกชื่อหมวดหมู่');
    }
  }

  startEditCategory(category: ApprovalCategory): void {
    category.isEditing = true;
    category.originalTitle = category.title;
  }

  finishEditCategory(category: ApprovalCategory): void {
    if (category.title.trim()) {
      category.isEditing = false;
      this.saveCriteria();
    } else {
      alert('ชื่อหมวดหมู่ต้องไม่ว่างเปล่า');
      category.title = category.originalTitle || '';
      category.isEditing = false;
    }
  }

  cancelEditCategory(category: ApprovalCategory): void {
    category.title = category.originalTitle || '';
    category.isEditing = false;
  }

  deleteCategory(categoryId: string): void {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้และเกณฑ์ย่อยทั้งหมด?')) {
      this.approvalCategories = this.approvalCategories.filter(cat => cat.id !== categoryId);
      this.saveCriteria();
    }
  }

  addSubCriterion(categoryId: string): void {
    const category = this.approvalCategories.find(cat => cat.id === categoryId);
    if (category && this.newSubCriterionText[categoryId]?.trim()) {
      const newId = Date.now().toString(); 
      category.subCriteria.push({
        id: newId,
        text: this.newSubCriterionText[categoryId].trim(),
        isEnabled: true,
        isEditing: false
      });
      this.newSubCriterionText[categoryId] = ''; 
      this.saveCriteria(); 
    } else {
      alert('กรุณากรอกข้อความเกณฑ์ย่อย');
    }
  }

  startEditSubCriterion(sub: SubCriterion): void {
    sub.isEditing = true;
    sub.originalText = sub.text;
  }

  finishEditSubCriterion(sub: SubCriterion): void {
    if (sub.text.trim()) {
      sub.isEditing = false;
      this.saveCriteria();
    } else {
      alert('ข้อความเกณฑ์ย่อยต้องไม่ว่างเปล่า');
      sub.text = sub.originalText || '';
      sub.isEditing = false;
    }
  }

  cancelEditSubCriterion(sub: SubCriterion): void {
    sub.text = sub.originalText || '';
    sub.isEditing = false;
  }

  deleteSubCriterion(categoryId: string, subCriterionId: string): void {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบเกณฑ์ย่อยนี้?')) {
      const category = this.approvalCategories.find(cat => cat.id === categoryId);
      if (category) {
        category.subCriteria = category.subCriteria.filter(sub => sub.id !== subCriterionId);
        this.saveCriteria();
      }
    }
  }

  async saveCriteria(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;

    try {
      const criteriaRef = ref(this.db, this.criteriaPath);
      const dataToSave = JSON.parse(JSON.stringify(this.approvalCategories)); 
      dataToSave.forEach((cat: ApprovalCategory) => {
        delete cat.isEditing;
        delete cat.originalTitle;
        cat.subCriteria.forEach((sub: SubCriterion) => {
          delete sub.isEditing;
          delete sub.originalText;
        });
      });

      await set(criteriaRef, dataToSave); 
      console.log('บันทึกเกณฑ์สำเร็จ!');
      alert('บันทึกเกณฑ์การอนุมัติเรียบร้อยแล้ว!');
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลเกณฑ์ไป Firebase:', error);
      this.hasError = true;
      alert('เกิดข้อผิดพลาดในการบันทึกเกณฑ์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      this.isLoading = false; 
    }
  }

    back(): void {
    this.router.navigate(['/comfirm']);
  }

}
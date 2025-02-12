import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';



interface User {
  id: number;
  name: string;
  avatar: string;
  role: 'ผู้ดูแลระบบ' | 'สมาชิก' | 'ช่างภาพ';
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.scss'],
})
export class AdminHomeComponent implements OnInit {
  constructor(private router : Router){}

  public users: User[] = [
    { id: 1, name: 'namijung', avatar: 'assets/user1.jpg', role: 'สมาชิก' },
    { id: 2, name: 'ช่างภาพ A', avatar: 'assets/user2.jpg', role: 'ช่างภาพ' },
    { id: 3, name: 'สมาชิก B', avatar: 'assets/user3.jpg', role: 'สมาชิก' },
    { id: 4, name: 'ช่างภาพ C', avatar: 'assets/user4.jpg', role: 'ช่างภาพ' },
    { id: 5, name: 'Admin 1', avatar: 'assets/admin.jpg', role: 'ผู้ดูแลระบบ' }, 
  ];

  filteredUsers: User[] = [];
  selectedTab: 'all' | 'ผู้ดูแลระบบ' | 'สมาชิก' | 'ช่างภาพ' = 'all';
  searchQuery: string = '';


  get adminCount() {
    return this.users.filter(user => user.role === 'ผู้ดูแลระบบ').length;
  }

  get memberCount() {
    return this.users.filter(user => user.role === 'สมาชิก').length;
  }

  get photographerCount() {
    return this.users.filter(user => user.role === 'ช่างภาพ').length;
  }

  ngOnInit() {
    this.filterUsers('all');
    console.log(this.filteredUsers);
  }

  filterUsers(role: 'all' | 'ผู้ดูแลระบบ' | 'สมาชิก' | 'ช่างภาพ') {
    this.selectedTab = role;
    this.filteredUsers = this.users.filter(user => role === 'all' || user.role === role);
    console.log(this.filteredUsers);
  }

  searchUsers() {
    this.filteredUsers = this.users.filter(user => 
      (this.selectedTab === 'all' || user.role === this.selectedTab) &&
      user.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  deleteUser(userId: number) {
    this.users = this.users.filter(user => user.id !== userId);
    this.filterUsers(this.selectedTab);
  }

  goToadd(): void {
    this.router.navigate(['/addmin']);
  }
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  //รายงาน
  isModal: boolean = false;
  selectedUserForReport: User | null = null;
  reportText: string = '';
  reports: any[] = [];

  // เปิด modal เมื่อกดปุ่ม "รายงาน"
  openReportDialog(user: User): void {
    this.selectedUserForReport = user;

    this.reports = [
      { username: "lalanan29", detail: "เบี้ยวบัตรลูกค้า แย่มาก จ่ายบัตรไปแล้วด้วย" },
      { username: "abcdoa", detail: "ตัวปลอมค่ะไม่ตรงปก" },
      { username: "moji_72", detail: "หยาบคายกับลูกค้าหมาก" }
  ];
    this.isModal = true;
  }

  // ปิด modal
  closeModal(): void {
    this.isModal = false;
    this.reportText = '';
    this.selectedUserForReport = null;
    this.reports = [];
  }
  // ส่งรายงาน (ตัวอย่าง: แสดง log แล้วปิด modal)
  submitReport(): void {
    console.log('Report submitted for', this.selectedUserForReport?.name, 'with message:', this.reportText);
    this.closeModal();
  }

  //ประเภทที่เลือก
  isCategoryModal: boolean = false;
  jobCategories: string[] = ['รับปริญญา', 'อีเว้นต์', 'พรีเวดดิ้ง'];
  isEditing: boolean[] = []; // เช็คสถานะแก้ไข
  newCategory: string = '';

  openCategoryModal() {
      this.isCategoryModal = true;
      this.isEditing = new Array(this.jobCategories.length).fill(false);
  }
 
  closeCategoryModal() {
      this.isCategoryModal = false;
  }

  // เปิดโหมดแก้ไข
  enableEditing(index: number) {
      this.isEditing[index] = true;
  }

  // บันทึกการแก้ไข
  saveEdit(index: number) {
      this.isEditing[index] = false;
  }

  // เพิ่มประเภทงานใหม่
  addCategory() {
      if (this.newCategory.trim()) {
          this.jobCategories.push(this.newCategory.trim());
          this.isEditing.push(false); // เพิ่มค่าใหม่ให้กับ isEditing
          this.newCategory = ''; // ล้างช่องป้อนข้อมูล
      }
  }


}

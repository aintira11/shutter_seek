import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgZone } from '@angular/core';
import { Router } from '@angular/router';


interface Criteria {
  copyright1: boolean;
  copyright2: boolean;
  fake1: boolean;
  fake2: boolean;
  fake3: boolean;
  fake4: boolean;
  policy1: boolean;
  policy2: boolean;
  purpose1: boolean;
  purpose2: boolean;
}


interface User {
  id: number;
  name: string;
  avatar: string;
  role: 'รอ' | 'อนุมัติ' | 'ปฏิเสธ';
  // date?: string;
  // time?: string;
  rejectedAt?: Date;
  countdownText?: string;
  criteria?: Criteria;
}


@Component({
  selector: 'app-comfirm-shutter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comfirm-shutter.component.html',
  styleUrl: './comfirm-shutter.component.scss'
})
export class ComfirmShutterComponent {
  

  public users: User[] = [
    { id: 1, name: 'ช่างภาพ A', avatar: 'assets/user1.jpg', role: 'รอ', criteria: this.createDefaultCriteria() },
    { id: 2, name: 'ช่างภาพ B', avatar: 'assets/user2.jpg', role: 'รอ', criteria: this.createDefaultCriteria() },
    { id: 3, name: 'ช่างภาพ C', avatar: 'assets/user3.jpg', role: 'รอ', criteria: this.createDefaultCriteria() },
    { id: 4, name: 'ช่างภาพ D', avatar: 'assets/user4.jpg', role: 'รอ', criteria: this.createDefaultCriteria() },
    { id: 5, name: 'ช่างภาพ E', avatar: 'assets/user5.jpg', role: 'รอ', criteria: this.createDefaultCriteria() },
    { id: 6, name: 'ช่างภาพ F', avatar: 'assets/user6.jpg', role: 'รอ', criteria: this.createDefaultCriteria() },
  ];

  createDefaultCriteria(): Criteria {
    return {
      copyright1: false,
      copyright2: false,
      fake1: false,
      fake2: false,
      fake3: false,
      fake4: false,
      policy1: false,
      policy2: false,
      purpose1: false,
      purpose2: false
    };
  }
  
  public filteredUsers: User[] = []; 
  public selectedTab: 'รอ' | 'อนุมัติ' | 'ปฏิเสธ' = 'รอ';
  public isModal: boolean = false;
  public selectedUserForEdit: User | null = null;



  public get comfirmCount(): number {
    return this.users.filter(user => user.role === 'อนุมัติ').length;
  }

  public get refuseCount(): number {
    return this.users.filter(user => user.role === 'ปฏิเสธ').length;
  }

  public get pendingCount(): number {
    return this.users.filter(user => user.role === 'รอ').length;
  }

  constructor(private ngZone: NgZone, private router: Router) {
    this.filterUsers(this.selectedTab);

    this.users.forEach(user => {
      if (user.role === 'ปฏิเสธ' && user.rejectedAt) {
        this.startCountdown(user);
      }
    });
  }

  public filterUsers(status: 'รอ' | 'อนุมัติ' | 'ปฏิเสธ'): void {
    this.selectedTab = status;
    this.filteredUsers = this.users.filter(user => user.role === status);
    console.log('filteredUsers:', this.filteredUsers);
  }  

  public changeUserStatus(userId: number, newRole: 'อนุมัติ' | 'ปฏิเสธ'): void {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.role = newRole;

      if (newRole === 'ปฏิเสธ') {
        const now = new Date();
        // user.date = now.getDate().toString().padStart(2, '0');
        // user.time = now.toTimeString().split(' ')[0];
        user.rejectedAt = now;
        this.startCountdown(user); 
      }

      this.filterUsers(this.selectedTab);
    }
  }

  //นับถอยหลัง
  public startCountdown(user: User): void {
    const interval = setInterval(() => {
      if (!user.rejectedAt) return;

      const now = new Date();
      const target = new Date(user.rejectedAt.getTime());
      target.setDate(target.getDate() + 7);

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        this.ngZone.run(() => {
          user.countdownText = 'หมดเวลา';
        });
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      this.ngZone.run(() => {
        user.countdownText = `[ ${days} ] [${hours} : ${minutes} : ${seconds}]`;
      });
    }, 1000);
  }  

  goToadd(): void {
    this.router.navigate(['/addmin']);
  }
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
  
  public reason = {
    copyright1: false,
    copyright2: false,
    fake1: false,
    fake2: false,
    fake3: false,
    fake4: false,
    policy1: false,
    policy2: false,
    purpose1: false,
    purpose2: false
  };
  
// ตัวแปรสถานะ Modal รายละเอียด
public isDetailModal: boolean = false;
public isEditModal: boolean = false;
public isEditMode: boolean = false;
public selectedUserForDetail: User | null = null;
public tempCriteria: Criteria = this.createDefaultCriteria();

// ฟังก์ชันเปิด modal รายละเอียด (กดปุ่ม "รายละเอียด")
openDetailDialog(user: User): void {
  this.selectedUserForDetail = user;
  this.tempCriteria = { ...(user.criteria || this.createDefaultCriteria()) };
  this.isDetailModal = true;
  this.isEditMode = false;

}
// ฟังก์ชันปิด modal รายละเอียด
closeDetailModal(): void {
  if (this.selectedUserForDetail) {
    this.selectedUserForDetail.criteria = { ...this.tempCriteria };
  }
  this.isDetailModal = false;
  this.isEditMode = false;
  this.selectedUserForDetail = null;
}

// ตอนกดปฏิเสธ (แท็บ รอ) ให้เปิด modal แก้ไข พร้อมข้อมูล criteria จาก tempCriteria
openRejectDialog(user: User): void {
  this.selectedUserForEdit = user;

  if (!user.criteria) {
    user.criteria = this.createDefaultCriteria();
  }

  user.criteria = { ...this.tempCriteria };

  this.rejectToRejectedTab();
  this.filterUsers('ปฏิเสธ');
}

rejectToRejectedTab(): void {
  if (this.selectedUserForEdit) {
    this.selectedUserForEdit.criteria = { ...this.tempCriteria };
    const now = new Date();
    this.selectedUserForEdit.role = 'ปฏิเสธ';
    this.selectedUserForEdit.rejectedAt = now;
    this.startCountdown(this.selectedUserForEdit);
  }

  this.closeModal();

  if (this.selectedTab !== 'ปฏิเสธ') {
    this.selectedTab = 'ปฏิเสธ';
  }

  this.filterUsers(this.selectedTab);
}


//การแก้ไข
openEditDialog(user: User): void {
  this.selectedUserForDetail = user;
  this.tempCriteria = { ...(user.criteria || this.createDefaultCriteria()) };
  this.isDetailModal = true;  // ใช้ modal เดิม
  this.isEditMode = true;

  
}

approve(): void {
  if (this.selectedUserForDetail) {
    this.selectedUserForDetail.criteria = { ...this.tempCriteria };

    const criteria = this.selectedUserForDetail.criteria;
    const allFalse = Object.values(criteria).every(v => v === false);

    if (allFalse || !allFalse) {
      this.selectedUserForDetail.role = 'อนุมัติ';
    }
  }

  this.closeDetailModal();
  this.filterUsers(this.selectedTab);
}

reject(): void {
  if (this.selectedUserForDetail) {
    const id = this.selectedUserForDetail.id;
    this.users = this.users.filter(u => u.id !== id); // ✅ ลบผู้ใช้ออกถาวร
  }

  this.closeDetailModal(); // ✅ ปิด popup
  this.filterUsers(this.selectedTab); // รีเฟรชหน้าปัจจุบัน
}

closeModal(): void {
  this.isModal = false;
  this.selectedUserForEdit = null;
}


  currentUser = {
    name: 'Admin 1',
    avatar: ''
  };

  back(): void {
    this.router.navigate(['/admin']);
  }
  
}
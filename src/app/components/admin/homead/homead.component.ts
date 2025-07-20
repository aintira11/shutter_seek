import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../../config/constants';
import { DatafilterUsers, DataMembers, DataReport, DataTegs } from '../../../model/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Confirm delete dialog component
// @Component({
//   selector: 'app-confirm-delete-dialog',
//   standalone: true,
//   imports: [MatButtonModule, CommonModule, MatDialogModule],
//   template: `
//     <h2 mat-dialog-title>ยืนยันการลบ</h2>
//     <div mat-dialog-content>คุณต้องการลบแพ็กเกจนี้ใช่หรือไม่?</div>
//     <div mat-dialog-actions>
//       <button mat-button mat-dialog-close>ยกเลิก</button>
//       <button mat-button [mat-dialog-close]="true" color="warn">ลบ</button>
//     </div>
//   `
// })

@Component({
  selector: 'app-homead',
  standalone: true,
  imports: [FormsModule,CommonModule,
    ],
  templateUrl: './homead.component.html',
  styleUrl: './homead.component.scss'
})
export class HomeadComponent implements OnInit {

    datauser: DataMembers[] = [];
    datafilterUsers:DatafilterUsers[]=[];  
    dataReport:DataReport[]=[]

    adminCount = 0;
    memberCount = 0;
    photographerCount = 0;
    MandP = 0;

    selectedTab: string = 'all'; 

    searchKeyword: string = '';
    allUsersData: DatafilterUsers[] = []; // เก็บข้อมูลผู้ใช้ทั้งหมดไว้สำหรับค้นหา
    isSearching: boolean = false; // สถานะการค้นหา

    sht_username:string=''
  
  constructor(private router : Router,
     private authService: AuthService,
     private http: HttpClient,
     private Constants: Constants, 
     private snackBar: MatSnackBar,
     private dialog: MatDialog,
    ){}


  ngOnInit() {
      const user = this.authService.getUser();
       if (user) {
    this.datauser = [user];
    console.log("Loaded user from AuthService:", this.datauser);
  } else {
    console.warn(" No user found in AuthService. Redirecting to login...");
    this.router.navigate(['/']);
    return;
  }

    this.filterUsers(0);
    
  }

  
countUsersByType() {
  this.adminCount = this.datafilterUsers.filter(user => user.type_user === '3').length;
  this.memberCount = this.datafilterUsers.filter(user => user.type_user === '1').length;
  this.photographerCount = this.datafilterUsers.filter(user => user.type_user === '2').length;
   this.MandP = this.datafilterUsers.filter(user => user.type_user === '4').length;
}

filterUsers(type: number) {
  // อัพเดตสถานะ tab ที่เลือก
  switch(type) {
    case 0:
      this.selectedTab = 'all';
      break;
    case 1:
      this.selectedTab = 'สมาชิก';
      break;
    case 2:
      this.selectedTab = 'ช่างภาพ';
      break;
    case 3:
      this.selectedTab = 'ผู้ดูแลระบบ';
      break;
    case 4:
      this.selectedTab = 'บัญชีคู่';
      break;
  }

  // ถ้ากำลังค้นหาอยู่ ให้ยกเลิกการค้นหา
  if (this.isSearching) {
    this.clearSearch();
  }

  const url = this.Constants.API_ENDPOINT + '/getmemberbytype/' + type;
  this.http.get(url).subscribe((response: any) => {
    this.datafilterUsers = response;
    this.countUsersByType();
    // เก็บข้อมูลทั้งหมดไว้สำหรับใช้ในการค้นหา (เฉพาะแท็บ "ทั้งหมด")
    if (type === 0) {
      this.allUsersData = [...response];
    }
    
    console.log("data datafilterUsers :", this.datafilterUsers);
  });
}

  // Implementation ของ searchUsers
searchUsers() {
  const keyword = this.searchKeyword.trim().toLowerCase();
  
  // ถ้าไม่มีคำค้นหา ให้แสดงข้อมูลทั้งหมด
  if (!keyword) {
    this.clearSearch();
    return;
  }

  // ถ้ายังไม่ได้โหลดข้อมูลทั้งหมด ให้โหลดก่อน
  if (this.allUsersData.length === 0) {
    const url = this.Constants.API_ENDPOINT + '/getmemberbytype/0';
    this.http.get(url).subscribe((response: any) => {
      this.allUsersData = response;
      this.performSearch(keyword);
    });
  } else {
    this.performSearch(keyword);
  }
}

// ฟังก์ชันสำหรับทำการค้นหา
private performSearch(keyword: string) {
  this.isSearching = true;
  this.selectedTab = 'all'; // เปลี่ยนไปแท็บทั้งหมด
  
  // ค้นหาจาก username, email, หรือเบอร์โทร
  this.datafilterUsers = this.allUsersData.filter(user => 
    user.username.toLowerCase().includes(keyword) ||
    (user.email && user.email.toLowerCase().includes(keyword)) ||
    (user.phone && user.phone.includes(keyword))
  );

  // อัพเดต count
  this.countUsersByType();
  
  // แสดงผลลัพธ์การค้นหา
  if (this.datafilterUsers.length === 0) {
    this.showSnackBar('ไม่พบข้อมูลที่ค้นหา');
  } else {
    this.showSnackBar(`พบข้อมูล ${this.datafilterUsers.length} รายการ`);
  }
}

// ฟังก์ชันล้างการค้นหา
clearSearch() {
  this.searchKeyword = '';
  this.isSearching = false;
  
  // ถ้าอยู่ในแท็บ "ทั้งหมด" ให้แสดงข้อมูลทั้งหมด
  if (this.selectedTab === 'all') {
    this.datafilterUsers = [...this.allUsersData];
    this.countUsersByType();
  }
}

// เพิ่มฟังก์ชันสำหรับ Enter key
onSearchKeyPress(event: any) {
  if (event.key === 'Enter') {
    this.searchUsers();
  }
}

  deleteUser(userId: number) {
  //  const dialogRef = this.dialog.open(HomeadComponent);
  //  dialogRef.afterClosed().subscribe(result=>{
  //      if(userId){
  //           const url = `${this.Constants.API_ENDPOINT}/deleteUser/`+userId;
  //           this.http.delete(url, {}).subscribe({
  //       next: (response) => {
  //         console.log(' deleted successfully:', response);
  //         this.showSnackBar('ลบผู้ใช้สำเร็จ');
  //       },
  //       error: (error) => {
  //         console.error('Delete portfolio error details:', error);
  //         this.showSnackBar('เกิดข้อผิดพลาดในการลบผู้ใช้');
  //       }
  //     });
  //      }
  //  });
  }

  goToadd(): void {
    this.router.navigate(['/addmin']);
  }
  logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']); // กลับไปหน้า login
}

  goToConfirmShutter(): void {
    this.router.navigate(['/comfirm']);
  }
  profile(){
   this.router.navigate(['/editadmin']);
}
gotohome(){
  this.router.navigate(['/']);
}
  
  //รายงาน
  isModal: boolean = false;
  selectedUserForReport: null = null;
  reportText: string = '';
  reports: any[] = [];

  // เปิด modal เมื่อกดปุ่ม "รายงาน"
 openReportDialog(user: number, username: string): void {
  this.sht_username = username;
  const url = this.Constants.API_ENDPOINT + '/getreport/' + user;
  this.http.get(url).subscribe((response: any) => {
    this.dataReport = response;
    console.log("data dataReport:", this.dataReport);
    this.countUsersByType();
  });

  this.isModal = true;
}


  // ปิด modal
  closeModal(): void {
    this.isModal = false;
    this.reportText = '';
    this.selectedUserForReport = null;
    this.reports = [];
    this.sht_username='';
  }

  //ประเภทที่เลือก
  isCategoryModal: boolean = false;
  jobCategories:DataTegs [] = [];
  isEditing: boolean[] = []; // เช็คสถานะแก้ไข
  newCategory: string = '';


  openCategoryModal() {
    
      this.isCategoryModal = true;
      this.isEditing = new Array(this.jobCategories.length).fill(false);
      //  ดึงข้อมูลประเภทผลงาน
       const url = this.Constants.API_ENDPOINT + '/tegs' ;
        this.http.get(url).subscribe((response: any) => {
      this.jobCategories = response;
      console.log("data Tegs :", this.jobCategories);
    });

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
    const categoryId = this.jobCategories[index].tags_id;
    const updatedName = this.jobCategories[index].name_tags;
    
    const url = this.Constants.API_ENDPOINT + '/edit/Category/' + categoryId;
    const updateData = { name_tags: updatedName };
    
    this.http.put(url, updateData).subscribe({
      next: (response: any) => {
        console.log("Category updated successfully:", response);
        this.isEditing[index] = false;
        // แสดงข้อความสำเร็จ (optional)
        this.showSnackBar('อัพเดตประเภทงานสำเร็จ');
      },
      error: (error) => {
        console.error("Error updating category:", error);
        this.showSnackBar('เกิดข้อผิดพลาดในการอัพเดต');
      }
    });
  }

  currentUser = {
    name: 'ผู้ดูแลระบบ1',
    avatar: 'assets/admin-avatar.png'
  };

    showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
  

  // เพิ่มประเภทงานใหม่
addCategory() {
  // ตรวจสอบว่ามีการกรอกข้อมูลหรือไม่
  if (!this.newCategory || this.newCategory.trim() === '') {
    this.showSnackBar('กรุณากรอกชื่อประเภทงาน');
    return;
  }

  // ตรวจสอบว่าประเภทงานซ้ำหรือไม่
  const isDuplicate = this.jobCategories.some(category => 
    category.name_tags.toLowerCase() === this.newCategory.toLowerCase()
  );

  if (isDuplicate) {
    this.showSnackBar('ประเภทงานนี้มีอยู่แล้ว');
    return;
  }

  const url = this.Constants.API_ENDPOINT + '/add/Category';
  const newCategoryData = { 
    name_tags: this.newCategory.trim() 
  };

  this.http.post(url, newCategoryData).subscribe({
    next: (response: any) => {
      console.log("Category added successfully:", response);
      
      // เพิ่มประเภทงานใหม่เข้าไปใน array
      this.jobCategories.push({
        tags_id: response.tags_id || this.jobCategories.length + 1, // ใช้ ID ที่ได้จาก response หรือ generate ใหม่
        name_tags: this.newCategory.trim()
      });

      // เพิ่มสถานะ editing สำหรับรายการใหม่
      this.isEditing.push(false);

      // ล้างค่าในช่องกรอก
      this.newCategory = '';
      
      // แสดงข้อความสำเร็จ
      this.showSnackBar('เพิ่มประเภทงานสำเร็จ');
    },
    error: (error) => {
      console.error("Error adding category:", error);
      this.showSnackBar('เกิดข้อผิดพลาดในการเพิ่มประเภทงาน');
    }
  });
}




}


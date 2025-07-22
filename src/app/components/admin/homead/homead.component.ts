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
import { HttpClientModule } from '@angular/common/http';
import { Database, ref, onValue } from '@angular/fire/database';


// Confirm delete dialog component
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatButtonModule, CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>ยืนยันการลบ</h2>
    <div mat-dialog-content>คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?</div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>ยกเลิก</button>
      <button mat-button [mat-dialog-close]="true" color="warn">ลบ</button>
    </div>
  `
})
export class ConfirmDeleteDialogComponent {}

@Component({
  selector: 'app-homead',
  standalone: true,
  imports: [FormsModule,CommonModule,MatButtonModule,HttpClientModule
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

      // for chat notification ---
  hasUnreadMessages = false;
  private chatRoomListenerUnsubscribe?: () => void;
  private messageListenersUnsubscribe: (() => void)[] = [];

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
     private db: Database
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
    this.countUsersByType(); 

    this.listenForUnreadMessages(user.user_id);
  }

  // --- NEW: Clean up listeners when component is destroyed to prevent memory leaks ---
    ngOnDestroy(): void {
      if (this.chatRoomListenerUnsubscribe) {
        this.chatRoomListenerUnsubscribe();
      }
      this.messageListenersUnsubscribe.forEach(unsub => unsub());
    }
  
    // --- NEW: Method to listen for unread messages in real-time ---
    listenForUnreadMessages(userId: number): void {
      const chatRoomsRef = ref(this.db, 'chatRooms');
  
      // Listen for changes in the list of chat rooms
      this.chatRoomListenerUnsubscribe = onValue(chatRoomsRef, (snapshot) => {
        // Clear old message listeners before creating new ones
        this.messageListenersUnsubscribe.forEach(unsub => unsub());
        this.messageListenersUnsubscribe = [];
        this.hasUnreadMessages = false;
  
        const allRooms = snapshot.val() || {};
        const unreadStatusByRoom: { [roomId: string]: boolean } = {};
  
        const updateGlobalUnreadStatus = () => {
          this.hasUnreadMessages = Object.values(unreadStatusByRoom).some(status => status);
        };
  
        const userRooms = Object.entries(allRooms).filter(([, roomData]: [string, any]) => roomData.user1 === userId || roomData.user2 === userId);
  
        if (userRooms.length === 0) {
          this.hasUnreadMessages = false;
          return;
        }
  
        // For each room the user is in, listen to its messages
        userRooms.forEach(([roomId]) => {
          const messagesRef = ref(this.db, `messages/${roomId}`);
          const messageListener = onValue(messagesRef, (msgSnapshot) => {
            const messages = msgSnapshot.val() || {};
            let roomHasUnread = false;
            for (const msgId in messages) {
              const message = messages[msgId];
              // Check if there's a message from another user that is not read
              if (message.senderId !== userId && !message.isRead) {
                roomHasUnread = true;
                break;
              }
            }
            unreadStatusByRoom[roomId] = roomHasUnread;
            updateGlobalUnreadStatus();
          });
          this.messageListenersUnsubscribe.push(messageListener);
        });
      });
    }

  
countUsersByType() {
  if (this.isSearching) {
    // เมื่อกำลังค้นหา ให้นับจากผลลัพธ์การค้นหา
    this.adminCount = this.datafilterUsers.filter(user => user.type_user === '3').length;
    this.memberCount = this.datafilterUsers.filter(user => user.type_user === '1').length;
    this.photographerCount = this.datafilterUsers.filter(user => user.type_user === '2').length;
    this.MandP = this.datafilterUsers.filter(user => user.type_user === '4').length;
  } else {
    // เมื่อไม่ได้ค้นหา ให้นับจากข้อมูลทั้งหมด
    if (this.allUsersData.length > 0) {
      this.adminCount = this.allUsersData.filter(user => user.type_user === '3').length;
      this.memberCount = this.allUsersData.filter(user => user.type_user === '1').length;
      this.photographerCount = this.allUsersData.filter(user => user.type_user === '2').length;
      this.MandP = this.allUsersData.filter(user => user.type_user === '4').length;
    } else {
      // ถ้ายังไม่มีข้อมูลทั้งหมด ให้นับจากข้อมูลปัจจุบัน
      this.adminCount = this.datafilterUsers.filter(user => user.type_user === '3').length;
      this.memberCount = this.datafilterUsers.filter(user => user.type_user === '1').length;
      this.photographerCount = this.datafilterUsers.filter(user => user.type_user === '2').length;
      this.MandP = this.datafilterUsers.filter(user => user.type_user === '4').length;
    }
  }
}

filterUsers(type: number) {
  // ถ้ากำลังค้นหาอยู่และไม่ใช่แท็บ "ทั้งหมด" ให้ return เลย
  if (this.isSearching && type !== 0) {
    return;
  }

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

  // ถ้ากำลังค้นหาอยู่และเป็นแท็บ "ทั้งหมด" ให้ล้างการค้นหา
  if (this.isSearching && type === 0) {
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

  // อัพเดต count สำหรับผลลัพธ์การค้นหา
  this.countUsersByType();
  
  // แสดงผลลัพธ์การค้นหา
  if (this.datafilterUsers.length === 0) {
    this.showSnackBar('ไม่พบข้อมูลที่ค้นหา');
  } else {
    this.showSnackBar(`พบข้อมูล ${this.datafilterUsers.length} รายการ`);
  }
}

onTabClick(type: number) {
  if (this.isSearching && type !== 0) {
    // ถ้ากำลังค้นหาและไม่ใช่แท็บทั้งหมด ให้แสดงข้อความแจ้งเตือน
    this.showSnackBar('กรุณาล้างการค้นหาก่อนเปลี่ยนแท็บ');
    return;
  }
  this.filterUsers(type);
}


// ฟังก์ชันล้างการค้นหา
clearSearch() {
  this.searchKeyword = '';
  this.isSearching = false;
  
  // กลับไปแสดงข้อมูลทั้งหมด
  this.selectedTab = 'all';
  this.datafilterUsers = [...this.allUsersData];
  this.countUsersByType();
}
// เพิ่มฟังก์ชันสำหรับ Enter key
onSearchKeyPress(event: any) {
  if (event.key === 'Enter') {
    this.searchUsers();
  }
}

  deleteUser(userId: number) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);

  dialogRef.afterClosed().subscribe(result => {
    if (result === true) {  // ✅ ตรวจสอบว่า user กดยืนยันลบ
      const url = `${this.Constants.API_ENDPOINT}/deleteUser/` + userId;
      this.http.delete(url).subscribe({
        next: (response) => {
          console.log('Deleted successfully:', response);
          this.showSnackBar('ลบผู้ใช้สำเร็จ');
          this.filterUsers(0); // โหลดข้อมูลใหม่
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.showSnackBar('เกิดข้อผิดพลาดในการลบผู้ใช้');
        }
      });
    } else {
      this.showSnackBar('ยกเลิกการลบผู้ใช้');
    }
  });
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

  isModalprofile:boolean = false;

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

    this.getprofile=[];
    this.isModalprofile = false;
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

     toShutter(id_shutter?: number , type?:string) {
      console.log("Sending id_shutter:", id_shutter);
      // console.log(" Sending datauser:", this.datauser[0]);
    
      if (!id_shutter) {
        console.error(" Error: id_shutter is undefined or invalid");
        return;
      }
      if (!this.datauser ) {
        console.error(" Error: this.datauser is empty or undefined");
        this.showSnackBar('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        return;
      }
     if(type == '2' || type == '4'){
          this.router.navigate(['/homeshutter'], { 
        state: { 
          // datauser: this.datauser[0], 
          idshutter: id_shutter 
        } 
      });
     }else{
      //  this.router.navigate(['/profileuser'], { 
      //   state: { 
      //     // datauser: this.datauser[0], 
      //     iduser: id_shutter 
      //   } 
      // });
      this.getuser(id_shutter);
      this.isModalprofile = true;

     }
    
    }

    getprofile: DataMembers[] = [];

    getuser(id: number){
      const url = this.Constants.API_ENDPOINT + '/read/' + id;
      this.http.get(url).subscribe((response: any) => {
      this.getprofile = response;
      console.log("data Tegs :", this.getprofile);
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


  chat(id_shutter: number){
      // console.log("📤 Sending datauser:", this.data);
    
      // if (!this.data ) {
      //   console.error("Error: this.datauser is empty or undefined");
      //   return;
      // }
    
      this.router.navigate(['/roomchat'], { 
        // state: { 
        //   datauser: this.data, 
        // } 
      });
     }



}


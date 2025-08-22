import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core'; // เพิ่ม OnDestroy
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
// เพิ่ม Firebase imports ที่จำเป็นสำหรับการลบข้อมูล
import { Database, ref, onValue, remove, get, query, orderByChild, equalTo } from '@angular/fire/database';


// Confirm delete dialog component
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatButtonModule, CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>ยืนยันการลบ</h2>
    <div mat-dialog-content>คุณต้องการลบผู้ใช้นี้ใช่หรือไม่? **การลบผู้ใช้จะลบข้อมูลทั้งหมดที่เกี่ยวข้องทั้งหมดด้วย**</div>
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
  imports: [FormsModule,CommonModule,MatButtonModule,HttpClientModule, MatDialogModule // เพิ่ม MatDialogModule
    ],
  templateUrl: './homead.component.html',
  styleUrl: './homead.component.scss'
})
export class HomeadComponent implements OnInit, OnDestroy { // เพิ่ม OnDestroy

    datauser: DataMembers[] = [];
    datafilterUsers:DatafilterUsers[]=[];
    dataReport:DataReport[]=[]

    adminCount = 0;
    memberCount = 0;
    photographerCount = 0;
    MandP = 0;

    selectedTab: string = 'all';
    showButton = false; 
    isLoading: boolean = false;

    hasUnreadMessages = false;
    private chatRoomListenerUnsubscribe?: () => void;
    private messageListenersUnsubscribe: (() => void)[] = [];

    searchKeyword: string = '';
    allUsersData: DatafilterUsers[] = [];
    isSearching: boolean = false;

    sht_username:string=''

  constructor(private router : Router,
      private authService: AuthService,
      private http: HttpClient,
      private Constants: Constants,
      private snackBar: MatSnackBar,
      private dialog: MatDialog,
      private db: Database // Inject Firebase Database
    ){}


  ngOnInit() {
      const user = this.authService.getUser();
        if (user) {
    this.datauser = [user];
    // console.log("Loaded user from AuthService:", this.datauser);
  } else {
    console.warn(" No user found in AuthService. Redirecting to login...");
    this.router.navigate(['/']);
    return;
  }

    this.filterUsers(0); // โหลดข้อมูลเริ่มต้นสำหรับแท็บ "ทั้งหมด"

    this.listenForUnreadMessages(user.user_id);
  
  }
   @HostListener('window:scroll', [])
          onScroll() {
            this.showButton = window.scrollY > 300; // แสดงปุ่มเมื่อเลื่อนลงมาเกิน 300px
          }
        
          scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนไปบนสุดแบบ Smooth
          }

  // ล้าง Listener เมื่อ Component ถูกทำลาย เพื่อป้องกัน Memory Leak
    ngOnDestroy(): void {
      if (this.chatRoomListenerUnsubscribe) {
        this.chatRoomListenerUnsubscribe();
      }
      this.messageListenersUnsubscribe.forEach(unsub => unsub());
    }

    // ฟังก์ชันสำหรับฟังข้อความที่ยังไม่ได้อ่านแบบ Real-time
   listenForUnreadMessages(userId: number): void {
  const chatRoomsRef = ref(this.db, 'chatRooms');

  // *** แก้ไขสำหรับ Admin: ใช้ userId = 1 ในการฟังข้อความ ***
  const chatUserId = this.datauser[0].type_user === '3' ? 1 : userId;
  
  // console.log(`[Admin Unread] Original userId: ${userId}, Chat userId: ${chatUserId}, User type: ${this.datauser[0].type_user}`);

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
      // console.log(`[Admin Unread] Global unread status updated: ${this.hasUnreadMessages}`);
    };

    // *** ใช้ chatUserId แทน userId ในการกรองห้องแชท ***
    const userRooms = Object.entries(allRooms).filter(([, roomData]: [string, any]) => 
      roomData.user1 === chatUserId || roomData.user2 === chatUserId
    );

    // console.log(`[Admin Unread] Found ${userRooms.length} rooms for user ${chatUserId}`);

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
        let unreadCount = 0;
        
        for (const msgId in messages) {
          const message = messages[msgId];
          // *** ใช้ chatUserId ในการตรวจสอบข้อความที่ยังไม่ได้อ่าน ***
          if (message.senderId !== chatUserId && !message.isRead) {
            roomHasUnread = true;
            unreadCount++;
          }
        }
        
        unreadStatusByRoom[roomId] = roomHasUnread;
        // console.log(`[Admin Unread] Room ${roomId} has ${unreadCount} unread messages, roomHasUnread: ${roomHasUnread}`);
        updateGlobalUnreadStatus();
      });
      this.messageListenersUnsubscribe.push(messageListener);
    });
  });
}

// debugUnreadMessages(): void {
//   console.log('=== DEBUG UNREAD MESSAGES ===');
//   console.log('User data:', this.datauser[0]);
//   console.log('User type:', this.datauser[0]?.type_user);
//   console.log('User ID:', this.datauser[0]?.user_id);
//   console.log('Has unread messages:', this.hasUnreadMessages);
//   console.log('Chat user ID (for listening):', this.datauser[0]?.type_user === '3' ? 1 : this.datauser[0]?.user_id);
// }

// นับจำนวนผู้ใช้ตามประเภท
countUsersByType() {
  if (this.isSearching) {
    // เมื่อกำลังค้นหา ให้นับจากผลลัพธ์การค้นหา
    this.adminCount = this.datafilterUsers.filter(user => user.type_user === '3').length;
    this.memberCount = this.datafilterUsers.filter(user => user.type_user === '1').length;
    this.photographerCount = this.datafilterUsers.filter(user => user.type_user === '2').length;
    this.MandP = this.datafilterUsers.filter(user => user.type_user === '4').length;
  } else {
    // เมื่อไม่ได้ค้นหา ให้นับจากข้อมูลทั้งหมด (ที่เก็บไว้ใน allUsersData)
    // หาก allUsersData ยังว่าง (เช่น โหลดครั้งแรกและยังไม่ได้โหลด type 0)
    // ให้ใช้ datafilterUsers ชั่วคราว (ซึ่งควรเป็นข้อมูลทั้งหมด ณ จุดนั้น)
    const sourceData = this.allUsersData.length > 0 ? this.allUsersData : this.datafilterUsers;

    this.adminCount = sourceData.filter(user => user.type_user === '3').length;
    this.memberCount = sourceData.filter(user => user.type_user === '1').length;
    this.photographerCount = sourceData.filter(user => user.type_user === '2').length;
    this.MandP = sourceData.filter(user => user.type_user === '4').length;
  }
}

// ฟังก์ชันสำหรับกรองผู้ใช้ตามประเภท
filterUsers(type: number) {
  // หากกำลังค้นหาอยู่และไม่ใช่แท็บ "ทั้งหมด" (type 0) ให้ละเว้นการเปลี่ยนแท็บ
  if (this.isSearching && type !== 0) {
    return;
  }

  // อัปเดตสถานะแท็บที่เลือก
  switch(type) {
    case 0: this.selectedTab = 'all'; break;
    case 1: this.selectedTab = 'สมาชิก'; break;
    case 2: this.selectedTab = 'ช่างภาพ'; break;
    case 3: this.selectedTab = 'ผู้ดูแลระบบ'; break;
    case 4: this.selectedTab = 'บัญชีคู่'; break;
  }

  // หากกำลังค้นหาอยู่และเลือกแท็บ "ทั้งหมด" ให้ล้างการค้นหาเพื่อกลับสู่สถานะปกติ
  if (this.isSearching && type === 0) {
    this.clearSearch();
  }

  const url = this.Constants.API_ENDPOINT + '/getmemberbytype/' + type;
  this.http.get(url).subscribe((response: any) => {
    this.datafilterUsers = response; // datafilterUsers จะมีข้อมูลเฉพาะประเภทที่เลือก

    // เก็บข้อมูลทั้งหมดไว้ใน allUsersData เฉพาะเมื่อโหลดแท็บ "ทั้งหมด" (type 0)
    // ซึ่ง allUsersData นี้จะใช้สำหรับการนับจำนวนบนแท็บและฟังก์ชันค้นหา
    if (type === 0) {
      this.allUsersData = [...response];
    }

    this.countUsersByType(); // เรียกเพื่ออัปเดตจำนวนบนแท็บ (จะใช้ allUsersData ถ้าไม่ได้อยู่ในโหมดค้นหา)

    // console.log("data datafilterUsers :", this.datafilterUsers);
  });

}

// ฟังก์ชันค้นหาผู้ใช้
searchUsers() {
  const keyword = this.searchKeyword.trim().toLowerCase();

  // ถ้าไม่มีคำค้นหา ให้ล้างการค้นหาและแสดงข้อมูลทั้งหมด
  if (!keyword) {
    this.clearSearch();
    return;
  }

  // ถ้ายังไม่ได้โหลดข้อมูลทั้งหมด (allUsersData) ให้โหลดก่อนแล้วค่อยค้นหา
  if (this.allUsersData.length === 0) {
    const url = this.Constants.API_ENDPOINT + '/getmemberbytype/0'; // ดึงผู้ใช้ทั้งหมด
    this.http.get(url).subscribe((response: any) => {
      this.allUsersData = response;
      this.performSearch(keyword);
    });
  } else {
    this.performSearch(keyword);
  }
}

// ฟังก์ชันที่ทำการค้นหาจริง
private performSearch(keyword: string) {
  this.isSearching = true;
  this.selectedTab = 'all'; // เมื่อค้นหาจะเปลี่ยนไปแสดงผลในแท็บ "ทั้งหมด"

  // ค้นหาจาก username, email, หรือเบอร์โทรศัพท์จากข้อมูลทั้งหมด (allUsersData)
  this.datafilterUsers = this.allUsersData.filter(user =>
    user.username.toLowerCase().includes(keyword) ||
    (user.email && user.email.toLowerCase().includes(keyword)) ||
    (user.phone && user.phone.includes(keyword))
  );

  // อัปเดตจำนวนบนแท็บตามผลลัพธ์การค้นหา
  this.countUsersByType();

  // แสดงข้อความแจ้งเตือน
  if (this.datafilterUsers.length === 0) {
    this.showSnackBar('ไม่พบข้อมูลที่ค้นหา');
  } else {
    this.showSnackBar(`พบข้อมูล ${this.datafilterUsers.length} รายการ`);
  }
}

// เมื่อคลิกที่แท็บ
onTabClick(type: number) {
  if (this.isSearching && type !== 0) {
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
  this.datafilterUsers = [...this.allUsersData]; // แสดงข้อมูลทั้งหมดในตาราง
  this.countUsersByType(); // อัปเดตจำนวนบนแท็บให้เป็นข้อมูลทั้งหมด
}
// เพิ่มฟังก์ชันสำหรับ Enter key
onSearchKeyPress(event: any) {
  if (event.key === 'Enter') {
    this.searchUsers();
  }
}

// --- ฟังก์ชัน deleteUser ---
deleteUser(userId: number) {
  // เปิดกล่องโต้ตอบยืนยันการลบ
  const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);

  dialogRef.afterClosed().subscribe(async result => { // ใช้ async ตรงนี้
    if (result === true) { // หากผู้ใช้กดยืนยันการลบ
      // 1. ลบผู้ใช้จาก Backend API ของคุณ
      const deleteApiUrl = `${this.Constants.API_ENDPOINT}/deleteUser/${userId}`;
      this.http.delete(deleteApiUrl).subscribe({
        next: async (response) => { // ใช้ async สำหรับการดำเนินการ Firebase
          // console.log('User deleted successfully from API:', response);
          this.showSnackBar('ลบผู้ใช้สำเร็จ');

          // 2. เริ่มต้นลบข้อมูลแชทที่เกี่ยวข้องจาก Firebase Realtime Database
          try {
            const chatRoomsRef = ref(this.db, 'chatRooms');

            // ค้นหาห้องแชทที่ user1 ตรงกับ userId
            const queryUser1 = query(chatRoomsRef, orderByChild('user1'), equalTo(userId));
            const snapshotUser1 = await get(queryUser1); // ใช้ await เพื่อรอผลลัพธ์

            // ค้นหาห้องแชทที่ user2 ตรงกับ userId
            const queryUser2 = query(chatRoomsRef, orderByChild('user2'), equalTo(userId));
            const snapshotUser2 = await get(queryUser2); // ใช้ await เพื่อรอผลลัพธ์

            const roomIdsToDelete: Set<string> = new Set(); // ใช้ Set เพื่อเก็บ roomId ที่ไม่ซ้ำกัน

            // เพิ่ม roomId จากผลลัพธ์ user1
            snapshotUser1.forEach(childSnapshot => {
              roomIdsToDelete.add(childSnapshot.key as string);
            });

            // เพิ่ม roomId จากผลลัพธ์ user2
            snapshotUser2.forEach(childSnapshot => {
              roomIdsToDelete.add(childSnapshot.key as string);
            });

            if (roomIdsToDelete.size > 0) {
              // console.log(`Found ${roomIdsToDelete.size} chat rooms to delete for user ${userId}.`);
              for (const roomId of roomIdsToDelete) {
                // ลบข้อความทั้งหมดที่อยู่ในห้องแชทนั้นๆ
                const messagesPath = `messages/${roomId}`;
                await remove(ref(this.db, messagesPath)); // ใช้ await
                // console.log(`Deleted messages for room: ${roomId}`);

                // ลบห้องแชทออกจาก 'chatRooms'
                const chatRoomPath = `chatRooms/${roomId}`;
                await remove(ref(this.db, chatRoomPath)); // ใช้ await
                // console.log(`Deleted chat room: ${roomId}`);
              }
              this.showSnackBar('ลบข้อมูลแชทที่เกี่ยวข้องสำเร็จ');
            } else {
              // console.log(`No chat rooms found for user ${userId}.`);
            }
          } catch (firebaseError) {
            console.error('Error deleting chat data from Firebase:', firebaseError);
            this.showSnackBar('เกิดข้อผิดพลาดในการลบข้อมูลแชท');
          }

          // 3. โหลดข้อมูลผู้ใช้ทั้งหมดใหม่หลังจากลบเสร็จสิ้น (ทั้งจาก API และ Firebase)
          this.filterUsers(0); // โหลดข้อมูลทั้งหมดใหม่
        },
        error: (error) => {
          console.error('Delete user API error:', error);
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
    // เพิ่ม field showDetail = false
    this.dataReport = response.map((r: any) => ({
      ...r,
      showDetail: false
    }));
  });

  this.isModal = true;
}

toggleDetail(report: any): void {
  report.showDetail = !report.showDetail;

  // ถ้าเพิ่งเปิด และยังไม่อ่าน → ยิง API update
  if (report.showDetail && report.status_read != '2') {
    const url = this.Constants.API_ENDPOINT + '/updateReportStatus/' + report.report_id;
    this.http.post(url, {}).subscribe({
      next: () => report.status_read = '2',
      error: (err) => console.error("อัปเดตสถานะไม่สำเร็จ:", err)
    });
  }
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
  isEditing: boolean[] = [];
  newCategory: string = '';


  openCategoryModal() {

      this.isCategoryModal = true;
      this.isEditing = new Array(this.jobCategories.length).fill(false);
      // ดึงข้อมูลประเภทผลงาน
        const url = this.Constants.API_ENDPOINT + '/tegs' ;
         this.http.get(url).subscribe((response: any) => {
      this.jobCategories = response;
      // console.log("data Tegs :", this.jobCategories);
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

  // ตรวจสอบว่ามีการกรอกข้อมูลหรือไม่
  if (!updatedName || updatedName.trim() === '') {
    this.showSnackBar('กรุณากรอกชื่อประเภทงาน');
    return;
  }

  const url = this.Constants.API_ENDPOINT + '/edit/Category/' + categoryId;
  const updateData = { name_tags: updatedName };

  this.http.put(url, updateData).subscribe({
    next: (response: any) => {
      // console.log("Category updated successfully:", response);
      this.isEditing[index] = false;
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
      // console.log("Sending id_shutter:", id_shutter);

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
           this.router.navigate(['/mainshutter'], {
         state: {
           idshutter: id_shutter
         }
       });
      }else{
      this.getuser(id_shutter);
      this.isModalprofile = true;

      }

    }

    getprofile: DataMembers[] = [];

    getuser(id: number){
      const url = this.Constants.API_ENDPOINT + '/read/' + id;
      this.http.get(url).subscribe((response: any) => {
      this.getprofile = response;
      // console.log("data Tegs :", this.getprofile);
    });
    }

  // เพิ่มประเภทงานใหม่
addCategory() {
  if (!this.newCategory || this.newCategory.trim() === '') {
    this.showSnackBar('กรุณากรอกชื่อประเภทงาน');
    return;
  }

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
      // console.log("Category added successfully:", response);

      this.jobCategories.push({
        tags_id: response.tags_id || this.jobCategories.length + 1,
        name_tags: this.newCategory.trim()
      });

      this.isEditing.push(false);
      this.newCategory = '';
      this.showSnackBar('เพิ่มประเภทงานสำเร็จ');
    },
    error: (error) => {
      console.error("Error adding category:", error);
      this.showSnackBar('เกิดข้อผิดพลาดในการเพิ่มประเภทงาน');
    }
  });
}

  chat(id_shutter: number){
      this.router.navigate(['/roomchat']);
      }
}
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DataFollow, DataMembers, Datapackages, DataReview, DataShowWork } from '../../../model/models';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { AuthService } from '../../../service/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Database, ref, onValue } from '@angular/fire/database';

// Confirm delete dialog component
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatButtonModule, CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>ยืนยันการลบ</h2>
    <div mat-dialog-content>คุณต้องการลบแพ็กเกจนี้ใช่หรือไม่?</div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>ยกเลิก</button>
      <button mat-button [mat-dialog-close]="true" color="warn">ลบ</button>
    </div>
  `
})
export class ConfirmDeleteDialogComponent {}


@Component({
  selector: 'app-main-shutter',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule ,
    MatCardModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule
    
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './main-shutter.component.html',
  styleUrl: './main-shutter.component.scss'
})
export class MainShutterComponent implements OnInit{
  // dataLogin:any
  data: DataMembers[]=[];
  dataAdmin: DataMembers[] = [];
  datawork:DataShowWork[]=[]
  datareview:any[]=[]
  datafollower : DataFollow[] =[] ;
  datapackages : Datapackages[] = [];

  rating: number = 0; // ค่าเริ่มต้นของการให้คะแนน
  hoverRating = 0;
  stars = new Array(5).fill(0);

  // for chat notification ---
  hasUnreadMessages = false;
  private chatRoomListenerUnsubscribe?: () => void;
  private messageListenersUnsubscribe: (() => void)[] = [];
  
  averageRating: number = 0; // ค่าเริ่มต้นของคะแนนเฉลี่ย
  Ratingstars: any[] = [];

  showButton = false; // ซ่อนปุ่มก่อน
  isLoading: boolean = false;
  opened = true;
  isModelOpen: boolean = false;
 datalike: any[] = [];  // ข้อมูลการถูกใจ (likes) ของ portfolio

 private photographerId: number | null = null;

showLikeModal: boolean = false; // ใช้สำหรับควบคุมการแสดง modal ของ likes
selectedPortfolioId: string = '';
  constructor(private fb: FormBuilder,
    private router : Router,
    private route: ActivatedRoute,
    private Constants: Constants , 
    private http: HttpClient
  ,private authService: AuthService,
private dialog: MatDialog,
private snackBar: MatSnackBar,
private db: Database ){
    
   
  }

ngOnInit(): void {
  // 1. ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่เสมอ เป็นขั้นตอนแรก
  const currentUser = this.authService.getUser();

  // 2. ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่ ถ้าไม่มีให้ไปหน้า login
  if (!currentUser) {
    console.warn("No user logged in. Redirecting to login...");
    this.router.navigate(['/login']);
    return;
  }

  // 3. ดึง ID ของช่างภาพจาก navigation state ที่ส่งมา
  //    history.state จะมี property 'idshutter' ตามที่คุณส่งมาใน router.navigate
  const photographerIdFromState = history.state.idshutter;

  // 4. ตรวจสอบเงื่อนไข: 
  //    - เป็นแอดมิน (type 3) และ 
  //    - มี ID ช่างภาพส่งมาใน state หรือไม่
  //    - (ปรับปรุงการเช็ค type_user ให้รัดกุมขึ้น)
  if (String(currentUser.type_user) === '3' && photographerIdFromState) {
    // --- กรณีแอดมินดูโปรไฟล์ช่างภาพ ---
    const photographerId = +photographerIdFromState; // แปลง ID เป็น number
    // console.log(`Admin view: Fetching data for photographer ID: ${photographerId}`);
    this.dataAdmin = [currentUser]; // ใช้ข้อมูลของแอดมิน
    this.getdatauser(photographerId);
    this.listenForUnreadMessages(photographerId); // เรียกใช้ listener ด้วย ID ของช่างภาพ

  } else {
    // --- กรณีผู้ใช้ทั่วไปดูโปรไฟล์ตัวเอง หรือ แอดมินดูโปรไฟล์ตัวเอง ---
    // console.log(`Self view: Displaying data for logged-in user ID: ${currentUser.user_id}`);
    this.data = [currentUser]; // ใช้ข้อมูลของคนที่ล็อกอินอยู่ได้เลย
    
    // เรียกใช้ฟังก์ชันต่างๆ ด้วย ID ของตัวเอง
    this.getpackages(currentUser.user_id);
    this.getwork(currentUser.user_id);
    this.getFollower(currentUser.user_id);
    this.getreview(currentUser.user_id);
    this.listenForUnreadMessages(currentUser.user_id); // เรียกใช้ listener ด้วย ID ของตัวเอง
  }
}

// ฟังก์ชัน getdatauser (ควรมีลักษณะนี้)
getdatauser(id: number): void {
  // console.log('Fetching user data via API for id:', id);
  const url = `${this.Constants.API_ENDPOINT}/read/${id}`; // ตัวอย่าง URL
  this.http.get<DataMembers[]>(url).subscribe((response: any) => {
    this.data = response;
    // console.log("API response for User:", this.data);

    if (this.data && this.data.length > 0) {
      const photographer = this.data[0];
      this.getpackages(photographer.user_id);
      this.getwork(photographer.user_id);
      this.getFollower(photographer.user_id);
      this.getreview(photographer.user_id);
    } else {
      console.error("No data returned from API for the given photographer ID.");
    }
  });
}


 ngOnDestroy(): void {
    if (this.chatRoomListenerUnsubscribe) {
      this.chatRoomListenerUnsubscribe();
    }
    this.messageListenersUnsubscribe.forEach(unsub => unsub());
  }

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


  toggleSidenav() {
    this.opened = !this.opened;
  }

  rate(star: number) {
    this.rating = star;
  }

  hover(star: number) {
    this.hoverRating = star;
  }
  getwork(id : number){ //เพิ่มเอาคนที่ถูกใจออกมาด้วย
    // console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/workAndPack_for1/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datawork = response; 
      // console.log("datawork :",this.datawork); 
      
    });
  }

  //ข้อมูลการถูกใจ (likes) ของ portfolio
getLike(portfolio_id: string | number) {
  // console.log('id', portfolio_id);
  const url = `${this.Constants.API_ENDPOINT}/get/likes/` + portfolio_id;
  this.http.get(url).subscribe((response: any) => {
    this.datalike = response;
    this.selectedPortfolioId = portfolio_id.toString(); // เก็บ ID ของ portfolio ที่ถูกเลือก
    this.showLikeModal = true;
    // console.log("data datalike :", this.datalike); 
  });
}


get likerNames(): string {
  if (!this.datalike || this.datalike.length === 0) {
    return 'ยังไม่มีใครถูกใจ';
  }

  // สมมุติว่า datalike เป็น array ของ object ที่มีชื่อว่า name หรือ username
  const names = this.datalike.map((liker: any) => liker.name || liker.username);
  return names.join(', ');
}


  //ไว้ดูว่าใครไลค์บ้าง //ทำmodel
  getLikework(portfolio_id:number){
    const url = this.Constants.API_ENDPOINT+'/get/likes/'+portfolio_id;
    this.http.get(url).subscribe((response: any) => {
      this.datapackages = response; 
      // console.log("datapackages :",this.datapackages); 
      
    });
  }

    closeLikeModal() {
    this.showLikeModal = false;
    this.datalike = [];
  }

  getreview(id : number){
    const url = this.Constants.API_ENDPOINT+'/get/review/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datareview = response; 
      // console.log("datareview :",this.datareview); 
       // คำนวณคะแนนเฉลี่ย ทั้งหมด/จำนวนรีวิว
      const total = this.datareview.reduce((sum, r) => sum + r.rating, 0);
      this.averageRating = parseFloat((total / this.datareview.length).toFixed(1));
      
      // สร้าง array ของดาว
      this.generateStars();
      
    });
  }

    generateStars() {
    this.stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (this.averageRating >= i) {
        // ดาวเต็ม
        this.stars.push({ type: 'full', class: 'fas fa-star', color: 'full' });
      } else if (this.averageRating >= i - 0.5) {
        // ดาวครึ่ง
        this.stars.push({ type: 'half', class: 'fas fa-star-half-alt', color: 'half' });
      } else {
        // ดาวว่าง
        this.stars.push({ type: 'empty', class: 'far fa-star', color: 'empty' });
      }
    }
  }

  getpackages(id : number){
    // console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/packages/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datapackages = response; 
      // console.log("datapackages :",this.datapackages); 
      
    });
  }

  getFollower(id : number){
    // console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/Follower/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datafollower = response; 
      // console.log("datafollower :",this.datafollower); 
   
    });
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  @ViewChild('wrapper', { static: false }) wrapper!: ElementRef;

  scrollLeft() {
    this.wrapper.nativeElement.scrollLeft -= 200; // ปรับระยะการเลื่อน
  }

  scrollRight() {
    this.wrapper.nativeElement.scrollLeft += 200;
  }

scrollTopack() {
    const rankElement = document.getElementById('second');
    if (rankElement) {
        rankElement.scrollIntoView({ behavior: 'smooth' });
    }
    }

    scrollToport() {
      const rankElement = document.getElementById('third');
      if (rankElement) {
          rankElement.scrollIntoView({ behavior: 'smooth' });
      }
      }
      scrollToreview() {
        const rankElement = document.getElementById('four');
        if (rankElement) {
            rankElement.scrollIntoView({ behavior: 'smooth' });
        }
        }
        scrollTo() {
        const rankElement = document.getElementById('description');
        if (rankElement) {
            rankElement.scrollIntoView({ behavior: 'smooth' });
        }
        }
        
        @HostListener('window:scroll', [])
        onScroll() {
          this.showButton = window.scrollY > 300; // แสดงปุ่มเมื่อเลื่อนลงมาเกิน 300px
        }
      
        scrollToTop() {
          window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนไปบนสุดแบบ Smooth
        }
       
        goToPackagePack(): void {
          this.router.navigate(['/editpac']);
          // this.router.navigate(['/editpac'], { state: { data: this.data} });
        }
       
        goToEditProfile(): void {
          this.router.navigate(['/editshutter']);
          // console.log('ข้อมูลที่ส่งไปหน้า แก้ไข :',this.data);
          // this.router.navigate(['/editshutter'], { state: { data: this.data} });
        }
        goToHomeShutter(){
          this.router.navigate(['/mainshutter']);
        //  this.router.navigate(['/mainshutter'], { state: { data: this.data} });
        }
        goToEditWork(){
          this.router.navigate(['/insertport']);
          // this.router.navigate(['/insertport'], { state: { data: this.data} });
        }


  viewProfile(follower: any) {
    console.log('View', follower.username);
  }
openModel(){
  this.isModelOpen = true;
}
closeList() {
  // ใส่ logic ปิด modal หรือ element
    this.isModelOpen = false;
}

  chat(id_shutter: number){
      // console.log("📤 Sending datauser:", this.data);
    
      if (id_shutter ) {
         this.router.navigate(['/roomchat'], { 
        state: { 
          // datauser: this.data, 
          idshutter: id_shutter 
        } 
      });
      }else{
        this.router.navigate(['/roomchat'], { 
        // state: { 
        //   datauser: this.data, 
        // } 
      });
      }
    
      
     }

     editWork(id: number) {
      this.router.navigate(['/editwork'], { 
        state: { 
          idshutter: id // ส่ง ID ของงานที่ต้องการแก้ไข
        } 
      });
     }

     //ลบผลงาน
    deleteWork(portfolio_id: number): void {
  const categoryToDelete = portfolio_id; // <-- ต้องมี dataWork ที่เก็บข้อมูลผลงาน
  const userId = this.data?.[0]?.user_id; // <-- เช็คให้แน่ใจว่า user_id มีอยู่

  const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent);
  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      const confirmed = confirm('คุณต้องการลบผลงานนี้ใช่หรือไม่?');
      if (!confirmed) return;

      const url = `${this.Constants.API_ENDPOINT}/delete/portfolio`;
      const requestBody = {
        portfolio_id: categoryToDelete,
        user_id: userId
      };

      // console.log('Delete request body:', requestBody);

      this.http.delete(url, { body: requestBody }).subscribe({
        next: (response) => {
          // console.log('Portfolio deleted successfully:', response);
          this.showSnackBar('ลบผลงานสำเร็จ');
          // รีเฟรชข้อมูลหลังจากลบสำเร็จ
          this.getwork(userId);
        },
        error: (error) => {
          console.error('Delete portfolio error:', error);
          this.showSnackBar('เกิดข้อผิดพลาดในการลบผลงาน');
        }
      });
    }
  });
}

  showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

   goToMember(): void {
    this.router.navigate(['/profile']);
  }

  showprofile(id: number ){
    // console.log("main sent id:",id);
       this.router.navigate(['/profileuser'], { 
        state: { 
          // datauser: this.datauser[0], 
          iduser: id 
        } 
      });
  }

      profile(){
          this.router.navigate(['/admin'],);
      
    }

     logout(): void {
      this.authService.logout();
      this.router.navigate(['/login']); // กลับไปหน้า login
}
}

import { inject, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataLike, DataMembers } from '../../../model/models';
import { CommonModule } from '@angular/common';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../service/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Database, ref, onValue } from '@angular/fire/database'; // Import Firebase Database services

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'] // Corrected to styleUrls
})
export class ProfileComponent implements OnInit, OnDestroy {
  data: DataMembers[] = [];
  currentSlideIndex: number[] = [];
  Like: DataLike[] = [];
  Follow: any[] = []; // Changed to any[] for flexibility

  // for chat notification ---
  hasUnreadMessages = false;
  private chatRoomListenerUnsubscribe?: () => void;
  private messageListenersUnsubscribe: (() => void)[] = [];

  constructor(
    private router: Router,
    private Constants: Constants,
    private http: HttpClient,
    private authService: AuthService, // inject AuthService
    private db: Database // Inject Firebase Database
  ) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user) {
       alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง");
      this.router.navigate(['/login']);
      return;
    }

    this.data = [user];
    // console.log("🔐 ผู้ใช้:", this.data);

    this.getMyLike(this.data[0].user_id);
    this.getFollow(this.data[0].user_id);
    this.Like.forEach((_, index) => {
      this.currentSlideIndex[index] = 0;
    });

    // --- NEW: Start listening for unread messages ---
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


  // ฟังก์ชันเพื่อไปยังภาพถัดไป (เลื่อนเฉพาะ portfolio ของตัวเอง)
  getNext(portfolioIndex: number) {
    if (this.Like[portfolioIndex]?.image_urls?.length > 0) {
      const maxIndex = this.Like[portfolioIndex].image_urls.length - 1;
      this.currentSlideIndex[portfolioIndex] = ((this.currentSlideIndex[portfolioIndex] || 0) + 1) % (maxIndex + 1);
      console.log(this.currentSlideIndex);
    }
  }
  getPrev(portfolioIndex: number) {
    if (this.Like[portfolioIndex]?.image_urls?.length > 0) {
      const maxIndex = this.Like[portfolioIndex].image_urls.length - 1;
      this.currentSlideIndex[portfolioIndex] = ((this.currentSlideIndex[portfolioIndex] || 0) - 1 + (maxIndex + 1)) % (maxIndex + 1);
      console.log(this.currentSlideIndex);
    }
  }

  goToEditPro(): void {
    this.router.navigate(['/edituser']);
  }
  goToShutter(): void {
    this.router.navigate(['/mainshutter']);
  }

  back() {
    this.router.navigate(['']);
  }
  tofollow() {
    this.router.navigate(['/tofollow']);
  }

  cancelEdit() {
    this.router.navigate(['/profile']);
  }

  getMyLike(id: number) {
    const url = `${this.Constants.API_ENDPOINT}/get/like/${id}`;
    this.http.get(url).subscribe((response: any) => {
      this.Like = response.map((item: any) => ({
        ...item,
        isLiked: true  // เพิ่ม isLiked = true
      }));
      // console.log("สิ่งที่ถูกใจ :", this.Like);
    });
  }

  likeCancel(portfolioId: number | null) {
    const validPortfolioId = portfolioId ?? 0;
    if (validPortfolioId === 0) {
      console.error("Invalid portfolio_id!");
      return;
    }

    const userId = this.data?.[0]?.user_id ?? 0;
    if (userId === 0) {
      console.error("Invalid user_id!");
      return;
    }

    const url = `${this.Constants.API_ENDPOINT}/like/${validPortfolioId}/${userId}`;
    this.http.post(url, {}).subscribe({
      next: () => {
        console.log("Unlike success");
        // To reflect the change immediately, we can remove the item from the local array
        this.Like = this.Like.filter(item => item.portfolio_id !== validPortfolioId);
      },
      error: (error) => console.error("Unlike error:", error)
    });

  }

  toShutter(id_shutter: number | null) {
    // console.log("📤 Sending id_shutter:", id_shutter);

    if (!id_shutter) {
      console.error(" Error: id_shutter is undefined or invalid");
      return;
    }

    this.router.navigate(['/preshutter'], {
      state: {
        idshutter: id_shutter
      }
    });
  }

  chat(id_shutter: number) {
    this.router.navigate(['/roomchat']);
  }


  getFollow(id: number) {
    const url = `${this.Constants.API_ENDPOINT}/get/follow/${id}`;
    this.http.get(url).subscribe((res: any) => {
      this.Follow = res;
      // console.log("👥 รายการติดตาม:", this.Follow);
    });
  }
}
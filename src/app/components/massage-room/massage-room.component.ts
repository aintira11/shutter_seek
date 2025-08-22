import { inject, Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataMembers } from '../../model/models'; // ตรวจสอบว่า DataMembers มีครบถ้วน
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../config/constants';
import { Database, ref, set, push, onValue, update, get, onDisconnect } from '@angular/fire/database';
import { ImageUploadService } from '../../services_image/image-upload.service';
import { AuthService } from '../../service/auth.service';
import { HostListener } from '@angular/core';

declare var bootstrap: any;

// *** เพิ่ม Interface สำหรับ ChatRoom ที่จะแสดงผล ***
interface ChatRoomDisplay {
  roomId: string;  // รหัสห้อง เช่น "room_1_25"
  partnerId: number;   // ID ของคู่สนทนา
  lastMessage: string;   // ข้อความล่าสุด
  lastMessageTime: string; // หรือ Date ถ้าคุณจะแปลงเป็น Date object ทันที
  hasUnreadMessages: boolean;  // มีข้อความที่ยังไม่อ่านหรือไม่
  lastMessageSenderId?: number;  // ผู้ส่งข้อความล่าสุด
}

@Component({
  selector: 'app-massage-room',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './massage-room.component.html',
  styleUrl: './massage-room.component.scss'
})
export class MassageRoomComponent implements OnInit, AfterViewChecked, OnDestroy, AfterViewInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('imageModalElement') imageModalElement!: ElementRef;
  private imageBootstrapModal: any;

  private db: Database = inject(Database);
  myId: number = 0; // ID ที่ใช้ในการแชท
  myActualId: number = 0; // เก็บ ID จริงของผู้ใช้ (สำหรับแอดมิน)
  myUserType: string | null = null; // ประเภทผู้ใช้ (1=ลูกค้า, 2=ช่างภาพ, 3=แอดมิน, 4=อื่นๆ)
  chatRooms: ChatRoomDisplay[] = []; // ใช้ ChatRoomDisplay interface
  messages: any[] = [];
  selectedRoomId: string | null = null;
  selectedPartnerId: number | null = null;
  newMessage :string = '';

  files: { file: File; preview: string; newName?: string }[] = [];
  isUploading = false;

  data: DataMembers | null = null;
  partnersData: DataMembers[] = [];
  initialPartnerId: number = 0;

  private shouldScroll: boolean = false;

  private partnerOnlineStatus: { [key: number]: string } = {};
  private partnerStatusUnsubscribe: { [key: number]: () => void } = {};
  private messagesUnsubscribe: () => void = () => { }; // ฟังก์ชันสำหรับยกเลิกการฟังข้อความ

  isSidebarOpen = true;

  startX: number = 0;
  currentX: number = 0;
  swiping: boolean = false;

  showImageModal: boolean = false;
  modalImageUrls: string = '';

  private touchStartTime: number = 0;
private touchStartPosition: { x: number, y: number } = { x: 0, y: 0 };

  constructor(
    private route: ActivatedRoute,
    private constants: Constants,
    private http: HttpClient,
    private imageUploadService: ImageUploadService,
    private authService: AuthService,
    private router: Router,
  ) { }

ngOnInit(): void {
  this.route.paramMap.subscribe(() => {
    setTimeout(() => {
      this.data = this.authService.getUser();
      this.initialPartnerId = window.history.state.idshutter || null;

      if (!this.data || !this.data.user_id || !this.data.type_user) {
        console.error("[OnInit] Error: ไม่พบข้อมูลผู้ใช้ที่ล็อกอิน (datauser), user_id หรือ type_user ขาดหายไป");
        alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง");
        this.router.navigate(['/login']);
        return;
      }

      this.myActualId = this.data.user_id; // เก็บ ID จริงของผู้ใช้
      this.myUserType = this.data.type_user;

      // *** สำหรับแอดมิน (type_user = 3) ให้ใช้ ID = 1 ในการแชท ***
      if (this.myUserType === '3') {
        this.myId = 1; // ใช้ ID = 1 สำหรับแอดมินทุกคน
        console.log('[OnInit] Admin detected. Using shared admin ID: 1');
      } else {
        this.myId = this.data.user_id; // ใช้ ID จริงสำหรับผู้ใช้ทั่วไป
      }

      // --- แก้ไข: Online Status Management สำหรับ Admin ---
      // *** สำหรับ Admin: ตั้งสถานะออนไลน์ทั้ง ID จริงและ ID แชท (1) ***
      if (this.myUserType === '3') {
        // ตั้งสถานะออนไลน์สำหรับ ID จริงของ Admin
        this.setOnlineStatus(this.myActualId);
        // ตั้งสถานะออนไลน์สำหรับ ID แชท (1) ด้วย
        this.setOnlineStatus(1);
        console.log(`[Online Status] Admin online status set for both actual ID (${this.myActualId}) and chat ID (1)`);
      } else {
        // สำหรับผู้ใช้ทั่วไป ใช้ ID เดียวกัน
        this.setOnlineStatus(this.myId);
        console.log(`[Online Status] Regular user online status set for ID: ${this.myId}`);
      }

      // โหลดห้องแชทสำหรับผู้ใช้ที่ล็อกอิน (ใช้ myId ในการค้นหาห้อง)
      this.loadChatRooms();

      // initialPartnerId จะถูกจัดการใน loadChatRooms's subscribe เพื่อให้แน่ใจว่า partnersData มีข้อมูลแล้ว
    }, 100);
  });
}


// เพิ่มเมธอดใหม่สำหรับตั้งสถานะออนไลน์
private setOnlineStatus(userId: number): void {
  const userStatusRef = ref(this.db, `users/${userId}/onlineStatus`);
  const connectedRef = ref(this.db, '.info/connected');

  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      set(userStatusRef, 'online').catch(e => console.error(`[Online Status] Error setting online status for user ${userId}:`, e));
      onDisconnect(userStatusRef).set('offline');
      console.log(`[Online Status] User ${userId} is now online.`);
    } else {
      console.log(`[Online Status] Not connected to Firebase for user ${userId}.`);
    }
  });
}
  isSidebarCollapsed: boolean = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    // console.log('[UI] Sidebar open:', this.isSidebarOpen);
    if (this.isSidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const element = this.imageModalElement?.nativeElement;
      if (element) {
        this.imageBootstrapModal = bootstrap.Modal.getOrCreateInstance(element);
        element.addEventListener('hidden.bs.modal', () => {
          this.modalImageUrls = '';
          console.log('[Modal] Image modal hidden.');
        });
        console.log('[Modal] Image modal initialized.');
      }
    }, 100);
  }
  

  openImageModal(imageUrl: string): void {
    // console.log('[Modal] Opening image modal with URL:', imageUrl);
    this.modalImageUrls = imageUrl;
    this.showImageModal = true;
    document.body.style.overflow = 'hidden';

    const modalImageElement = this.imageModalElement?.nativeElement?.querySelector('#modalImage');
    if (modalImageElement) {
      modalImageElement.src = imageUrl;
      modalImageElement.onerror = () => {
        console.error('[Modal] Error loading image:', imageUrl);
        modalImageElement.src = 'assets/images/image-error.png';
      };
    }

    if (this.imageBootstrapModal) {
      this.imageBootstrapModal.show();
    } else {
      console.warn("[Modal] Modal not initialized yet, attempting to get instance!");
      const element = this.imageModalElement?.nativeElement;
      if (element) {
        this.imageBootstrapModal = bootstrap.Modal.getOrCreateInstance(element);
        this.imageBootstrapModal.show();
      }
    }
  }

  closeImageModal(): void {
    console.log('[Modal] Closing image modal.');
    this.showImageModal = false;
    this.modalImageUrls = '';
    document.body.style.overflow = 'auto';
    if (this.imageBootstrapModal) {
      this.imageBootstrapModal.hide(); // Ensure Bootstrap modal is hidden
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showImageModal) {
      this.closeImageModal();
    }
  }

  onTouchStart(event: TouchEvent) {
    this.startX = event.touches[0].clientX;
    this.swiping = true;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.swiping) return;
    this.currentX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.swiping) return;
    this.swiping = false;

    const deltaX = this.currentX - this.startX;
    if (deltaX < -50) {
      this.isSidebarOpen = false;
      console.log('[UI] Sidebar closed by swipe.');
    }
  }

  shouldShowDateSeparator(currentMessage: any, previousMessage: any): boolean {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    return currentDate !== previousDate;
  }

  formatDateSeparator(timestamp: string): string {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'วันนี้';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'เมื่อวาน';
    } else {
      return messageDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  ngOnDestroy(): void {
  console.log('[Lifecycle] MassageRoomComponent ngOnDestroy called.');
  if (this.messagesUnsubscribe) {
    this.messagesUnsubscribe();
    console.log('[Firebase] Messages listener unsubscribed.');
  }
  for (const partnerId in this.partnerStatusUnsubscribe) {
    if (this.partnerStatusUnsubscribe.hasOwnProperty(partnerId)) {
      this.partnerStatusUnsubscribe[partnerId]();
    }
  }

  // *** แก้ไข: เมื่อ Component ถูกทำลาย ให้ตั้งค่าสถานะผู้ใช้เป็น 'offline' ***
  if (this.myUserType === '3') {
    // สำหรับ Admin: ตั้งสถานะออฟไลน์ทั้ง ID จริงและ ID แชท
    this.setOfflineStatus(this.myActualId);
    this.setOfflineStatus(1);
    console.log(`[Firebase] Admin status set to offline for both actual ID (${this.myActualId}) and chat ID (1)`);
  } else {
    // สำหรับผู้ใช้ทั่วไป
    this.setOfflineStatus(this.myId);
    console.log(`[Firebase] Regular user ${this.myId} status set to offline`);
  }
}

// เพิ่มเมธอดใหม่สำหรับตั้งสถานะออฟไลน์
private setOfflineStatus(userId: number): void {
  const userStatusRef = ref(this.db, `users/${userId}/onlineStatus`);
  set(userStatusRef, 'offline')
    .then(() => console.log(`[Firebase] User ${userId} status set to offline.`))
    .catch(e => console.error(`[Firebase] Error setting user ${userId} offline:`, e));
}


  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  getPhotographerData(id: string): void {
    // console.log('[Data Fetch] กำลังดึงข้อมูลคู่สนทนาสำหรับ ID:', id);
    const partnerUserId = Number(id);

    // สำหรับแอดมิน: ตรวจสอบกับ myActualId เพื่อป้องกันการแชทกับตัวเอง
    const idToCheck = this.myUserType === '3' ? this.myActualId : this.myId;
    if (partnerUserId === idToCheck) {
      console.warn('[Data Fetch] พยายามดึงข้อมูลตัวเองเพื่อแชท การกระทำนี้ถูกบล็อก.');
      this.showAlert('คุณไม่สามารถแชทกับตัวเองได้', false);
      this.selectedPartnerId = null;
      this.selectedRoomId = null;
      this.messages = [];
      return;
    }

    const existingPartner = this.partnersData.find(p => p.user_id === partnerUserId);
    if (existingPartner) {
      // console.log("[Data Fetch] ใช้ข้อมูล partner ที่มีอยู่แล้ว:", existingPartner);
      this.proceedWithChatSetup(existingPartner);
      return;
    }

    const url = `${this.constants.API_ENDPOINT}/read/${id}`;
    this.http.get<DataMembers[]>(url).subscribe({
      next: (response) => {
        const newPartner = response[0];
        if (newPartner) {
          if (!this.partnersData.some(p => p.user_id === newPartner.user_id)) {
            this.partnersData.push(newPartner);
            this.listenToPartnerStatus(newPartner.user_id);
          }
          // console.log("[Data Fetch] ข้อมูลคู่สนทนาที่ดึงมาใหม่:", newPartner);
          this.proceedWithChatSetup(newPartner);
        } else {
          console.warn('[Data Fetch] ไม่พบข้อมูลคู่สนทนาสำหรับ ID:', id);
        }
      },
      error: (error) => {
        console.error('[Data Fetch] เกิดข้อผิดพลาดในการดึงข้อมูลคู่สนทนา:', error);
      }
    });
  }

  private proceedWithChatSetup(partner: DataMembers): void {
    // เพิ่มเงื่อนไขสำหรับแอดมิน (type_user = 3)
    if (this.myUserType === '1' || this.myUserType === '4' || this.myUserType === '2' || this.myUserType === '3') {
      // console.log(`[Chat Setup] Proceeding with chat setup for partner ${partner.user_id} based on user type ${this.myUserType}.`);
      this.setupChat(partner.user_id);
    } else {
      console.warn(`[Chat Setup] Not proceeding with chat setup for partner ${partner.user_id}. User type ${this.myUserType} not allowed or initialPartnerId not matched.`);
    }
  }

  private initializeChatAfterPartnersLoaded(): void {
    if (this.initialPartnerId && this.initialPartnerId !== 0) {
      // console.log('[Chat Init] Checking initialPartnerId for chat setup:', this.initialPartnerId);
      
      // สำหรับแอดมิน: ตรวจสอบกับ myActualId เพื่อป้องกันการแชทกับตัวเอง
      const idToCheck = this.myUserType === '3' ? this.myActualId : this.myId;
      if (this.initialPartnerId === idToCheck) {
        console.warn('[Chat Init] พยายามแชทกับตัวเองจาก initialPartnerId. การกระทำนี้ถูกบล็อก.');
        this.showAlert('คุณไม่สามารถแชทกับตัวเองได้', false);
        this.selectedPartnerId = null;
        this.selectedRoomId = null;
        this.messages = [];
      } else {
        // console.log('[Chat Init] กำลังเริ่มต้นแชทกับคู่สนทนา ID (จาก initialPartnerId):', this.initialPartnerId);
        this.isSidebarOpen = false;

        const existingPartner = this.partnersData.find(p => p.user_id === this.initialPartnerId);
        if (existingPartner) {
          console.log('[Chat Init] Found existing partner data for initialPartnerId.');
          this.proceedWithChatSetup(existingPartner);
        } else {
          console.log('[Chat Init] Partner data not found, fetching for initialPartnerId.');
          this.getPhotographerData(String(this.initialPartnerId));
        }
      }
    } else {
      console.log('[Chat Init] No initialPartnerId provided or it is 0.');
    }
  }

  // Firebase listener สำหรับตรวจสอบห้องแชทที่เกี่ยวข้อง
  loadChatRooms(): void {
    const chatRoomsRef = ref(this.db, 'chatRooms');
    console.log('[Firebase Listener] Setting up chatRooms listener...');

    onValue(chatRoomsRef, snapshot => {
      const allRooms: any = snapshot.val() || {};
      const tempChatRooms: ChatRoomDisplay[] = [];
      const partnersToLoad: number[] = [];

      // console.log('--- [loadChatRooms] Firebase Snapshot Received ---');
      // console.log('My Chat ID (used for rooms):', this.myId);
      // console.log('My Actual ID:', this.myActualId);
      // console.log('All rooms from Firebase (raw):', allRooms);

      // วนดูทุกห้อง
      for (const roomId in allRooms) {
        const roomData = allRooms[roomId];
        // ตรวจสอบโครงสร้างข้อมูลพื้นฐานของห้อง
        if (!roomData || typeof roomData.user1 === 'undefined' || typeof roomData.user2 === 'undefined') {
            console.warn(`[loadChatRooms] Invalid room data for roomId ${roomId}:`, roomData);
            continue;
        }

        // ตรวจสอบว่าผู้ใช้เป็นสมาชิกของห้องนี้หรือไม่
        if (roomData.user1 === this.myId || roomData.user2 === this.myId) {
          const partnerId = (roomData.user1 === this.myId) ? roomData.user2 : roomData.user1;

          if (partnerId === this.myId) {
            console.warn(`[loadChatRooms] Skipping room ${roomId} as partnerId is same as myId.`);
            continue;
          }
           // ดึง senderId ของ lastMessage ถ้ามี
    const lastSenderId = typeof roomData.lastMessageSenderId === 'number' ? roomData.lastMessageSenderId : undefined; // <<< เพิ่มตรงนี้


          const myUnreadCountKey = `unreadCount_${this.myId}`; // ใช้ myId สำหรับ unread count
          // ตรวจสอบให้แน่ใจว่า roomData[myUnreadCountKey] เป็นตัวเลข
          const unreadCountForMe = typeof roomData[myUnreadCountKey] === 'number' ? roomData[myUnreadCountKey] : 0;
          const hasUnread = unreadCountForMe > 0;

          tempChatRooms.push({
            roomId: roomId,
            partnerId: partnerId,
            lastMessage: roomData.lastMessage || 'ยังไม่มีข้อความ',
            lastMessageTime: roomData.lastMessageTime || '',
            hasUnreadMessages: hasUnread,
             lastMessageSenderId: lastSenderId
          });

          // console.log(`[loadChatRooms] Processed room: ${roomId}, Partner ID: ${partnerId}`);
          // console.log(`  - My unread count key: ${myUnreadCountKey}, Value from Firebase: ${unreadCountForMe}`);
          // console.log(`  - hasUnreadMessages calculated as: ${hasUnread}`);

          if (!this.partnersData.some(p => p.user_id === partnerId)) {
            if (!partnersToLoad.includes(partnerId)) {
              partnersToLoad.push(partnerId);
            }
          }
        }
      }

      // console.log('[loadChatRooms] Finished processing rooms. Partners to load:', partnersToLoad);

      if (partnersToLoad.length > 0) {
        this.loadPartnersData(partnersToLoad).then(() => {
          this.updateChatRoomsList(tempChatRooms);
          this.initializeChatAfterPartnersLoaded();
        });
      } else {
        this.updateChatRoomsList(tempChatRooms);
        this.initializeChatAfterPartnersLoaded();
      }
    });
  }

 private updateChatRoomsList(tempChatRooms: ChatRoomDisplay[]): void {
  this.chatRooms = tempChatRooms;

  this.chatRooms.sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA;
  });

  // console.log('[ChatRooms List] โหลดห้องแชทแล้ว (sorted):', this.chatRooms);
  // console.log('[ChatRooms List] ข้อมуล partners ที่มีในระบบ:', this.partnersData);
}

  private loadPartnersData(partnerIds: number[]): Promise<void> {
    // console.log('[Partners Data] Loading partner data for IDs:', partnerIds);
    const promises = partnerIds.map(partnerId => {
      return new Promise<void>((resolve) => {
        const url = `${this.constants.API_ENDPOINT}/read/${partnerId}`;
        this.http.get<DataMembers[]>(url).subscribe({
          next: (response) => {
            const partner = response[0];
            if (partner && !this.partnersData.some(p => p.user_id === partner.user_id)) {
              this.partnersData.push(partner);
              this.listenToPartnerStatus(partner.user_id);
              // console.log(`[Partners Data] โหลดข้อมูล partner ${partnerId} สำเร็จ:`, partner);
            } else if (!partner) {
                console.warn(`[Partners Data] No data found for partner ID ${partnerId}.`);
            }
            resolve();
          },
          error: (error) => {
            console.error(`[Partners Data] เกิดข้อผิดพลาดในการดึงข้อมูลคู่สนทนา ${partnerId}:`, error);
            resolve();
          }
        });
      });
    });
    return Promise.all(promises).then(() => {
      console.log('[Partners Data] โหลดข้อมูล partners ทั้งหมดเสร็จสิ้น.');
    });
  }


  // ตั้งค่าแชทสำหรับ ID พาร์ทเนอร์ที่ระบุ
  setupChat(partnerId: number): void {
  // console.log(`--- [Chat Setup] Entering setupChat for partnerId: ${partnerId} ---`);

  // เพิ่มการปิด sidebar อัตโนมัติบนมือถือ
  if (window.innerWidth <= 768) {
    this.isSidebarOpen = false;
    console.log('[Mobile] Auto-closing sidebar after selecting chat');
  }

  // *** เพิ่มการตรวจสอบว่ากำลังแชทกับคนเดียวกันหรือไม่ ***
  if (this.selectedPartnerId === partnerId) {
    // console.log(`[Chat Setup] Already in chat with partnerId: ${partnerId}. Marking messages as read.`);
    this.scrollToBottom();
    const currentRoomId = this.getRoomId(this.myId, partnerId);
    this.markMessagesAsRead(currentRoomId);
    return; // *** สำคัญ: return ตรงนี้เพื่อไม่ให้ทำการ setup ใหม่ ***
  }

  // 1. ยกเลิก Listener ของห้องแชทเก่าก่อนเสมอ
  if (this.messagesUnsubscribe) {
    this.messagesUnsubscribe();
    console.log('[Firebase Listener] Unsubscribed from previous messages listener.');
  }

  this.selectedPartnerId = partnerId;
  const roomId = this.getRoomId(this.myId, partnerId);
  this.selectedRoomId = roomId;
  // console.log(`[Chat Setup] Selected Room ID: ${roomId}, Selected Partner ID: ${partnerId}`);

  const roomRef = ref(this.db, `chatRooms/${roomId}`);
  // ตรวจสอบว่าห้องแชทมีอยู่หรือไม่ ถ้าไม่มีให้สร้าง
  get(roomRef).then(snapshot => {
    if (!snapshot.exists()) {
      // console.log(`[Firebase] Chat room ${roomId} does not exist. Creating new room.`);
      set(roomRef, {
        user1: this.myId,
        user2: partnerId,
        lastMessage: '',
        lastMessageTime: '',
        [`unreadCount_${this.myId}`]: 0,
        [`unreadCount_${partnerId}`]: 0
      }).then(() => {
          // console.log(`[Firebase] Room ${roomId} created with initial unread counts.`);
          this.markMessagesAsRead(roomId);
      }).catch(error => {
          console.error(`[Firebase] Error setting initial chat room data for ${roomId}:`, error);
      });
    } else {
      // console.log(`[Firebase] Chat room ${roomId} already exists. Marking messages as read.`);
      this.markMessagesAsRead(roomId);
    }
  }).catch(error => {
    console.error("[Firebase] Error checking/creating chat room:", error);
  });

  const msgRef = ref(this.db, `messages/${roomId}`);
  this.messagesUnsubscribe = onValue(msgRef, snapshot => {
    const data = snapshot.val();
    this.messages = data ? Object.values(data) : [];
    this.shouldScroll = true;

    // console.log('[Firebase Listener] Received messages update for room:', roomId);
    // console.log('  Raw message data from Firebase:', data);
    // console.log('  Processed messages array:', this.messages);
  }, (error) => {
      console.error(`[Firebase Listener] Error listening to messages in room ${roomId}:`, error);
  });

  // อัปเดตสถานะ hasUnreadMessages ใน chatRooms array ทันทีที่เปิดห้อง
  const currentRoomInList = this.chatRooms.find(r => r.roomId === roomId);
  if (currentRoomInList) {
    if (currentRoomInList.hasUnreadMessages) {
        // console.log(`[Chat Setup] Setting hasUnreadMessages to false for room ${roomId} in UI.`);
        currentRoomInList.hasUnreadMessages = false;
    }
  }
  // console.log(`--- [Chat Setup] Exiting setupChat for partnerId: ${partnerId} ---`);
}

  getRoomId(a: number, b: number): string {
    return a < b ? `room_${a}_${b}` : `room_${b}_${a}`;
  }

sendMessage(): void {
  console.log('[Send] Attempting to send message.');
  
  // ตรวจสอบ state พื้นฐาน
  if (!this.selectedRoomId || this.selectedPartnerId === null) {
    this.showAlert('กรุณาเลือกห้องแชทและคู่สนทนาก่อนส่งข้อความ');
    console.warn('[Send] Invalid state: No room or partner selected.');
    return;
  }

  // *** เพิ่มการตรวจสอบความสอดคล้องของ roomId ***
  const expectedRoomId = this.getRoomId(this.myId, this.selectedPartnerId);
  if (this.selectedRoomId !== expectedRoomId) {
    console.warn('[Send] Room ID mismatch detected, correcting...');
    console.log(`[Send] Current roomId: ${this.selectedRoomId}, Expected: ${expectedRoomId}`);
    this.selectedRoomId = expectedRoomId;
  }

  console.log(`[Send] Confirmed sending to Partner ID: ${this.selectedPartnerId}, Room ID: ${this.selectedRoomId}`);

  if (this.files.length > 0) {
    console.log('[Send] Sending image(s).');
    this.uploadAndSendImage();
  } else if (this.newMessage?.trim()) {
    console.log('[Send] Sending text message.');
    this.sendTextMessage(this.newMessage);
  } else {
    this.showAlert('กรุณาพิมพ์ข้อความหรือเลือกรูปภาพ', false);
    console.warn('[Send] Message is empty or no files selected.');
  }
}


private sendTextMessage(text: string): void {
  if (this.selectedPartnerId === null) {
    console.error("[Send Text] Selected partner ID is null, cannot send message.");
    return;
  }
  if (!this.selectedRoomId) {
    console.error("[Send Text] Selected room ID is null, cannot send message.");
    return;
  }

  // *** แก้ไขหลัก: เก็บค่า state และป้องกันการเปลี่ยนแปลงระหว่างการส่งข้อความ ***
  const targetPartnerId = this.selectedPartnerId;
  const targetRoomId = this.selectedRoomId;
  
  console.log(`[Send Text] Sending to Partner ID: ${targetPartnerId}, Room ID: ${targetRoomId}`);

  const now = new Date().toISOString();
  // 1. สร้างข้อความ
  const msg = {
    senderId: this.myId,
    messageText: text,
    timestamp: now,
    isRead: false,
    type: 'text'
  };

  console.log(`[Send Text] Preparing to send text message: "${text}" to room ${targetRoomId}.`);
  const msgListRef = push(ref(this.db, `messages/${targetRoomId}`));
  set(msgListRef, msg)
      .then(() => {
        console.log('[Send Text] Message saved to /messages successfully.');
        // *** ยืนยันว่า state ยังคงเป็นของห้องที่ต้องการ ***
        this.ensureCorrectChatState(targetPartnerId, targetRoomId);
      })
      .catch(e => {
        console.error('[Send Text] Error saving message to /messages:', e);
        this.ensureCorrectChatState(targetPartnerId, targetRoomId);
      });

  // *** อัปเดต lastMessage และ unreadCount สำหรับผู้รับ ***
  const chatRoomRef = ref(this.db, `chatRooms/${targetRoomId}`);
  const partnerUnreadCountKey = `unreadCount_${targetPartnerId}`;

  console.log(`[Send Text] Updating chatRooms/${targetRoomId} for partner: ${targetPartnerId} (key: ${partnerUnreadCountKey}).`);

  get(chatRoomRef).then(snapshot => {
    const currentRoomData = snapshot.val();
    let currentUnreadCount = 0;
    if (currentRoomData && typeof currentRoomData[partnerUnreadCountKey] === 'number') {
        currentUnreadCount = currentRoomData[partnerUnreadCountKey];
    } else if (currentRoomData) {
        console.warn(`[Send Text] ${partnerUnreadCountKey} not found in chat room data. Initializing unread count to 0.`);
    } else {
        console.error(`[Send Text] No chat room data found for ${targetRoomId}. Cannot update unread count.`);
        return;
    }

    const newUnreadCount = currentUnreadCount + 1;

    console.log(`[Send Text] Current unread count for partner (${partnerUnreadCountKey}): ${currentUnreadCount}, New unread count: ${newUnreadCount}`);

    update(chatRoomRef, {
      lastMessage: text,
      lastMessageTime: now,
      [partnerUnreadCountKey]: newUnreadCount,
      lastMessageSenderId: this.myId 
    }).then(() => {
        console.log(`[Send Text] Successfully updated chat room ${targetRoomId} with new lastMessage, lastMessageTime, and unreadCount for partner.`);
        // *** ยืนยันว่า state ยังคงเป็นของห้องที่ต้องการ ***
        this.ensureCorrectChatState(targetPartnerId, targetRoomId);
    }).catch(error => {
      console.error("[Send Text] Error updating chat room unread count or last message:", error);
      this.ensureCorrectChatState(targetPartnerId, targetRoomId);
    });
  }).catch(error => {
    console.error("[Send Text] Error getting chat room data to update unread count:", error);
    this.ensureCorrectChatState(targetPartnerId, targetRoomId);
  });

  this.newMessage = '';
  this.shouldScroll = true;
}

  getChatPartnerInfo(partnerId: number): DataMembers | undefined {
    return this.partnersData.find(p => p.user_id === partnerId);
  }

  getPartnerStatus(partnerId: number): string {
    return this.partnerOnlineStatus[partnerId] || 'offline';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        if (this.messagesContainer) {
          this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
          console.log('[UI] Scrolled to bottom of messages container.');
        }
      } catch (err) {
        console.error('[UI] Could not scroll to bottom:', err);
      }
    }, 0);
  }

  // เมธอดสำหรับ 'อ่านแล้ว' และรีเซ็ต unread count ใน chatRooms
  private markMessagesAsRead(roomId: string): void {
    // console.log(`--- [Mark Read] markMessagesAsRead called for room: ${roomId} ---`);
    // console.log(`[Mark Read] My ID for unread count reset: ${this.myId}`);

    const messagesRef = ref(this.db, `messages/${roomId}`);

    get(messagesRef).then(snapshot => {
      const updates: { [key: string]: any } = {};
      let messagesMarkedAsReadCount = 0;

      snapshot.forEach(childSnapshot => {
        const message = childSnapshot.val();
        const messageKey = childSnapshot.key;

        // อัปเดตเฉพาะข้อความที่ส่งมาจากอีกฝ่าย (senderId ไม่ใช่ฉัน)
        // และข้อความนั้นยังไม่ได้ถูกอ่าน (isRead เป็น false)
        if (message.senderId !== this.myId && !message.isRead) {
          updates[`messages/${roomId}/${messageKey}/isRead`] = true;
          messagesMarkedAsReadCount++;
        }
      });

      // *** Reset unreadCount ของฉันใน chatRooms ให้เป็น 0 ***
      const myUnreadCountKey = `unreadCount_${this.myId}`;
      updates[`chatRooms/${roomId}/${myUnreadCountKey}`] = 0;

      // console.log(`[Mark Read] Updates to be applied to Firebase (includes unread count reset):`, updates);

      // อัปเดตข้อมูลทั้งหมดใน Firebase ครั้งเดียว
      if (Object.keys(updates).length > 0) {
        update(ref(this.db), updates)
          .then(() => {
            console.log(`[Mark Read] SUCCESS: Messages in room ${roomId} marked as read (${messagesMarkedAsReadCount} messages) and ${myUnreadCountKey} reset.`);
          })
          .catch(error => console.error("[Mark Read] ERROR: marking messages as read or resetting unread count:", error));
      } else {
          console.log(`[Mark Read] No unread messages from partner in room ${roomId} to mark as read.`);
          // หากไม่มีข้อความให้ mark as read แต่อาจจะต้อง ensure ว่า unreadCount ของฉันเป็น 0
          // ทำการอัปเดตเฉพาะ unreadCount ของผู้ใช้ปัจจุบันให้เป็น 0
          const chatRoomSpecificRef = ref(this.db, `chatRooms/${roomId}`);
          update(chatRoomSpecificRef, { [myUnreadCountKey]: 0 })
            .then(() => console.log(`[Mark Read] Ensured ${myUnreadCountKey} is 0 for room ${roomId}.`))
            .catch(error => console.error(`[Mark Read] Error ensuring ${myUnreadCountKey} is 0:`, error));
      }

    }).catch(error => console.error("[Mark Read] Error fetching messages to mark as read:", error));
  }

  private listenToPartnerStatus(partnerId: number): void {
    if (this.partnerStatusUnsubscribe[partnerId]) {
      // console.log(`[Firebase Listener] Already listening to status for partner ${partnerId}.`);
      return;
    }

    const partnerStatusRef = ref(this.db, `users/${partnerId}/onlineStatus`);
    // console.log(`[Firebase Listener] Setting up status listener for partner ${partnerId}.`);

    const unsubscribe = onValue(partnerStatusRef, (snapshot) => {
      this.partnerOnlineStatus[partnerId] = snapshot.val() || 'offline';
      console.log(`[Firebase Listener] สถานะของ ${partnerId}: ${this.partnerOnlineStatus[partnerId]}`);
    }, (error) => {
        console.error(`[Firebase Listener] Error listening to partner ${partnerId} status:`, error);
    });

    this.partnerStatusUnsubscribe[partnerId] = unsubscribe;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      console.log('[File Select] No files selected.');
      return;
    }

    const selectedFilesArray = Array.from(input.files);
    const totalFilesAfterSelection = this.files.length + selectedFilesArray.length;

    if (totalFilesAfterSelection > 10) {
      this.showAlert(`คุณสามารถอัปโหลดได้สูงสุด 10 รูปเท่านั้น (ปัจจุบันมี ${this.files.length} รูป, เลือกเพิ่ม ${selectedFilesArray.length} รูป)`);
      input.value = ''; // Clear the input
      console.warn('[File Select] Too many files selected. Max 10.');
      return;
    }

    selectedFilesArray.forEach(file => {
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        this.showAlert('รองรับเฉพาะไฟล์ .jpg หรือ .png เท่านั้น');
        console.warn(`[File Select] Invalid file type: ${file.type} for file ${file.name}`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.showAlert(`ขนาดไฟล์ ${file.name} ต้องไม่เกิน 5MB`);
        console.warn(`[File Select] File too large: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.files.push({ file, preview: e.target.result });
        // console.log(`[File Select] Added file: ${file.name}, preview generated.`);
      };
      reader.readAsDataURL(file);
    });

    input.value = ''; // Clear the input after processing files
  }

  removeFile(index: number): void {
    if (index >= 0 && index < this.files.length) {
      console.log(`[File Select] Removing file at index ${index}: ${this.files[index].file.name}`);
      this.files.splice(index, 1);
    }
  }

  //1. อัปโหลดรูปภาพผ่าน ImageUploadService
async uploadAndSendImage(): Promise<void> {
  if (this.files.length === 0 || !this.selectedRoomId || this.selectedPartnerId === null) {
    this.showAlert('กรุณาเลือกรูปภาพและเลือกห้องแชท');
    console.warn('[Send Image] Cannot upload: no files, room, or partner selected.');
    return;
  }

  // *** แก้ไขหลัก: เก็บค่า state และป้องกันการเปลี่ยนแปลงระหว่างการส่งรูปภาพ ***
  const targetPartnerId = this.selectedPartnerId;
  const targetRoomId = this.selectedRoomId;
  
  console.log(`[Send Image] Sending to Partner ID: ${targetPartnerId}, Room ID: ${targetRoomId}`);

  this.isUploading = true;
  let successCount = 0;
  const filesToUpload = [...this.files];

  console.log(`[Send Image] Starting upload for ${filesToUpload.length} images.`);

  for (let i = 0; i < filesToUpload.length; i++) {
    const fileObj = filesToUpload[i];
    try {
      console.log(`[Send Image] Uploading image ${i + 1}/${filesToUpload.length}: ${fileObj.file.name}`);
      const imageUrl: any = await this.imageUploadService.uploadImageAndGetUrl(fileObj.file).toPromise();

      console.log(`[Send Image] Image ${i + 1} uploaded successfully. URL:`, imageUrl);

      const now = new Date().toISOString();
      const msg = {
        senderId: this.myId,
        messageText: imageUrl,
        timestamp: now,
        isRead: false,
        type: 'image'
      };

      const msgListRef = push(ref(this.db, `messages/${targetRoomId}`));
      await set(msgListRef, msg);
      console.log(`[Send Image] Image message ${i + 1} saved to /messages successfully.`);
      successCount++;

    } catch (uploadError) {
      console.error(`[Send Image] Error uploading or saving image message ${i + 1}:`, uploadError);
      this.showAlert(`ไม่สามารถอัปโหลดรูปที่ ${i + 1} ได้`, false);
    }
  }

  if (successCount > 0) {
    const now = new Date().toISOString();
    const chatRoomRef = ref(this.db, `chatRooms/${targetRoomId}`);
    const partnerUnreadCountKey = `unreadCount_${targetPartnerId}`;

    console.log(`[Send Image] All images processed. Updating chatRooms/${targetRoomId} for partner: ${targetPartnerId} (key: ${partnerUnreadCountKey}).`);

    get(chatRoomRef).then(snapshot => {
      const currentRoomData = snapshot.val();
      let currentUnreadCount = 0;
      if (currentRoomData && typeof currentRoomData[partnerUnreadCountKey] === 'number') {
          currentUnreadCount = currentRoomData[partnerUnreadCountKey];
      } else if (currentRoomData) {
          console.warn(`[Send Image] ${partnerUnreadCountKey} not found in chat room data. Initializing unread count to 0.`);
      } else {
          console.error(`[Send Image] No chat room data found for ${targetRoomId}. Cannot update unread count.`);
          return;
      }

      const newUnreadCount = currentUnreadCount + successCount;

      console.log(`[Send Image] Current unread count for partner (${partnerUnreadCountKey}): ${currentUnreadCount}, New unread count: ${newUnreadCount}`);

      update(chatRoomRef, {
        lastMessage: '📷 รูปภาพ',
        lastMessageTime: now,
        [partnerUnreadCountKey]: newUnreadCount,
        lastMessageSenderId: this.myId
      }).then(() => {
          console.log(`[Send Image] Successfully updated chat room ${targetRoomId} with new lastMessage, lastMessageTime, and unreadCount for partner.`);
          // *** ยืนยันว่า state ยังคงเป็นของห้องที่ต้องการ ***
          this.ensureCorrectChatState(targetPartnerId, targetRoomId);
      }).catch(error => {
        console.error("[Send Image] Error updating chat room unread count or last message:", error);
        this.ensureCorrectChatState(targetPartnerId, targetRoomId);
      });
    }).catch(error => {
      console.error("[Send Image] Error getting chat room data to update unread count:", error);
      this.ensureCorrectChatState(targetPartnerId, targetRoomId);
    });
  }

  this.files = [];
  this.shouldScroll = true;
  this.isUploading = false;
  
  // *** ยืนยันว่า state ยังคงเป็นของห้องที่ต้องการ ***
  this.ensureCorrectChatState(targetPartnerId, targetRoomId);
  console.log('[Send Image] Finished upload process.');
}

private ensureCorrectChatState(targetPartnerId: number, targetRoomId: string): void {
  // ตรวจสอบและบังคับให้ state เป็นไปตามที่ต้องการ
  setTimeout(() => {
    if (this.selectedPartnerId !== targetPartnerId || this.selectedRoomId !== targetRoomId) {
      console.warn(`[Chat State] State mismatch detected! Correcting...`);
      console.log(`[Chat State] Current: Partner ${this.selectedPartnerId}, Room ${this.selectedRoomId}`);
      console.log(`[Chat State] Expected: Partner ${targetPartnerId}, Room ${targetRoomId}`);
      
      // บังคับให้ state เป็นไปตามที่ต้องการ
      this.selectedPartnerId = targetPartnerId;
      this.selectedRoomId = targetRoomId;
      
      // ตรวจสอบว่า messages listener กำลังฟังห้องที่ถูกต้องหรือไม่
      // ถ้าไม่ใช่ให้ setup ใหม่
      this.reestablishMessagesListener(targetRoomId);
    }
    
    console.log(`[Chat State] State confirmed: Partner ${this.selectedPartnerId}, Room ${this.selectedRoomId}`);
  }, 100);
}
private reestablishMessagesListener(targetRoomId: string): void {
  console.log(`[Messages Listener] Re-establishing listener for room: ${targetRoomId}`);
  
  // ยกเลิก listener เก่า
  if (this.messagesUnsubscribe) {
    this.messagesUnsubscribe();
    console.log('[Messages Listener] Previous listener unsubscribed.');
  }

  // สร้าง listener ใหม่
  const msgRef = ref(this.db, `messages/${targetRoomId}`);
  this.messagesUnsubscribe = onValue(msgRef, snapshot => {
    const data = snapshot.val();
    this.messages = data ? Object.values(data) : [];
    this.shouldScroll = true;

    console.log(`[Messages Listener] Messages updated for room: ${targetRoomId}`);
  }, (error) => {
      console.error(`[Messages Listener] Error listening to messages in room ${targetRoomId}:`, error);
  });
}


  onImageLoad(): void {
    // This is useful for images loaded within the chat bubble itself
    this.shouldScroll = true;
    console.log('[UI] Image loaded in chat bubble, triggering scroll.');
  }

  isImageUrl(text: string | null | undefined): boolean {
    if (typeof text !== 'string' || !text) {
      return false;
    }
    // Updated regex to be more robust, considers common image extensions and some image hosting patterns
    return (/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(text)) ||
           (text.startsWith('http') && (text.includes('ibb.co') || text.includes('imgur.com') || text.includes('cloudinary.com')));
  }

  profile(typeuser : string | undefined ) {
    const type = typeuser;
    console.log("[Navigation] ค่าของ type:", type, "| ประเภท:", typeof type);
    if (type === '2') {
      this.router.navigate(['/mainshutter'], ); 
    }else if (type === '3'){
          this.router.navigate(['/admin'],); }
    else {
      this.router.navigate(['/profile'],  );
    }
  }

  private showAlert(message: string, isModal: boolean = true): void {
    if (isModal) {
      alert(message);
      console.log(`[Alert] Showing modal alert: ${message}`);
    } else {
      console.log(`[Alert] Console alert: ${message}`);
    }
  }

  onChatItemTouchStart(event: TouchEvent, partnerId: number): void {
  this.touchStartTime = Date.now();
  this.touchStartPosition = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  };
  console.log(`[Touch] Touch start on partner ${partnerId}`);
}

onChatItemTouchEnd(event: TouchEvent, partnerId: number): void {
  const touchEndTime = Date.now();
  const touchDuration = touchEndTime - this.touchStartTime;
  
  // ตรวจสอบว่าเป็นการแตะสั้นๆ (ไม่ใช่การลาก)
  if (touchDuration < 500) {
    const touchEndPosition = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY
    };
    
    // ตรวจสอบว่าไม่ได้เลื่อนมากจนเกินไป
    const deltaX = Math.abs(touchEndPosition.x - this.touchStartPosition.x);
    const deltaY = Math.abs(touchEndPosition.y - this.touchStartPosition.y);
    
    if (deltaX < 10 && deltaY < 10) { // ถ้าเลื่อนน้อยกว่า 10px
      // console.log(`[Touch] Valid touch end on partner ${partnerId}, setting up chat`);
      this.setupChat(partnerId);
      event.preventDefault();
      event.stopPropagation();
    }
  }
}


}
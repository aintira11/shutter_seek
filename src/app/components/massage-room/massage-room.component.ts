import { inject, Component, OnInit ,ViewChild, ElementRef, AfterViewChecked ,OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataMembers } from '../../model/models'; 
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../config/constants';

import { Database, ref, set, push, onValue, update, get ,onDisconnect } from '@angular/fire/database';
import { ImageUploadService } from '../../services_image/image-upload.service'; // นำเข้า ImageUploadService
import { AuthService } from '../../service/auth.service';
import { HostListener } from '@angular/core';

declare var bootstrap: any;
@Component({
    selector: 'app-massage-room',
    standalone: true,
    imports: [FormsModule ,CommonModule],
    templateUrl: './massage-room.component.html',
    styleUrl: './massage-room.component.scss'
})

export class MassageRoomComponent implements OnInit, AfterViewChecked, OnDestroy{
   @ViewChild('messagesContainer') private messagesContainer!: ElementRef; // ประกาศ ViewChild
  @ViewChild('imageModalElement') imageModalElement!: ElementRef;
  private imageBootstrapModal: any; 

  private db: Database = inject(Database);
  myId: number = 0; 
  myUserType: string | null = null; // ประเภทผู้ใช้: '1' = user, '2' = shutter, '3' = admin
  chatRooms: any[] = [];
  messages: any[] = [];
  selectedRoomId: string | null = null;
  selectedPartnerId: number | null = null;
  newMessage = '';

  files: { file: File; preview: string; newName?: string }[] = [];
  isUploading = false;

  data: DataMembers | null = null; // ข้อมูลผู้ใช้ที่กำลังล็อกอิน
  partnersData: DataMembers[] = []; // คู่สนทนา (ช่างภาพสำหรับ user, ผู้ใช้สำหรับ photographer), '4' = both user and photographer
  initialPartnerId: number = 0; 

  private shouldScroll: boolean = false; // Flag เพื่อป้องกันการ Scroll ซ้ำซ้อน

  private partnerOnlineStatus: { [key: number]: string } = {};
  private partnerStatusUnsubscribe: { [key: number]: () => void } = {};

  isSidebarOpen = true;

  startX: number = 0;
currentX: number = 0;
swiping: boolean = false;

  showImageModal: boolean = false;
  modalImageUrls: string = '';

  constructor(
    private route: ActivatedRoute,
    private constants: Constants, 
    private http: HttpClient,
    private imageUploadService: ImageUploadService,
    private authService: AuthService,private router : Router,
    ) {}

  ngOnInit(): void {
    // รับข้อมูลที่ส่งมาจาก route ก่อนหน้าโดยใช้ history.state
    this.route.paramMap.subscribe(() => {
      setTimeout(() => {
        // this.data = window.history.state.datauser || null;
         this.data = this.authService.getUser();
        this.initialPartnerId = window.history.state.idshutter || null;

        if (!this.data || !this.data.user_id || !this.data.type_user) { // ตรวจสอบ type_user ด้วย
          console.error("Error: ไม่พบข้อมูลผู้ใช้ที่ล็อกอิน (datauser), user_id หรือ type_user ขาดหายไป");
          // จัดการตรงนี้ เช่น เปลี่ยนเส้นทางไปยังหน้าล็อกอิน
          return;
        }

        this.myId = this.data.user_id;
        this.myUserType = this.data.type_user; // กำหนดประเภทผู้ใช้
        console.log('ID ผู้ใช้ของฉัน (myId):', this.myId);
        console.log('ประเภทผู้ใช้ของฉัน (myUserType):', this.myUserType);
        console.log('ได้รับข้อมูลผู้ใช้ที่ล็อกอินแล้ว:', this.data);
        console.log('ได้รับ ID คู่สนทนาเริ่มต้น (initialPartnerId):', this.initialPartnerId);

        // --- ส่วนของการจัดการสถานะออนไลน์ของผู้ใช้ที่ล็อกอิน ---
        if (this.myId) {
          const userStatusRef = ref(this.db, `users/${this.myId}/onlineStatus`);
          const connectedRef = ref(this.db, '.info/connected');

          // Listener for connection status
          // onValue on connectedRef also returns an unsubscribe function
          const connectedUnsubscribe = onValue(connectedRef, (snapshot) => {
            if (snapshot.val() === true) {
              set(userStatusRef, 'online');
              onDisconnect(userStatusRef).set('offline');
            }
          });
          // เก็บ connectedUnsubscribe ไว้ในที่ที่สามารถเข้าถึงได้ใน ngOnDestroy หากต้องการยกเลิก
          // หรือปล่อยให้มันทำงานต่อไปตลอดอายุของ Service Worker (ถ้ามี)
          // สำหรับคอมโพเนนต์ เราสามารถยกเลิกได้ใน ngOnDestroy ถ้าจำเป็น
          // this.partnerStatusUnsubscribe['connected'] = connectedUnsubscribe; // ตัวอย่างการเก็บ
        }
        // --- สิ้นสุดส่วนจัดการสถานะออนไลน์ของผู้ใช้ที่ล็อกอิน ---

        // โหลดห้องแชทสำหรับผู้ใช้ที่ล็อกอิน
        this.loadChatRooms();

        //ตรวจสอบและเริ่มต้นแชทกับ initialPartnerId
            if (this.initialPartnerId && this.initialPartnerId !== 0) { // ถ้ามีค่า idshutter และไม่ใช่ 0
            
                if (this.initialPartnerId === this.myId) {
                    // 2.1 กรณี: พยายามแชทกับตัวเอง
                    console.warn('พยายามแชทกับตัวเองจาก initialPartnerId. การกระทำนี้ถูกบล็อก.');
                    this.showAlert('คุณไม่สามารถแชทกับตัวเองได้', false);
                    // ล้างข้อมูลห้องแชทที่เลือก เพื่อให้หน้าจอแสดง "เลือกช่างภาพที่ต้องการสนทนา"
                    this.selectedPartnerId = null; 
                    this.selectedRoomId = null; 
                    this.messages = []; 
                    
                } else {
                    // 2.2 กรณี: แชทกับคู่สนทนาคนอื่น (ถูกต้อง)
                    console.log('กำลังเริ่มต้นแชทกับคู่สนทนา ID (จาก initialPartnerId):', this.initialPartnerId);
                     this.isSidebarOpen = false;
                    this.getPhotographerData(String(this.initialPartnerId)); // ดึงข้อมูลคู่สนทนาและเปิดแชท
                }
            }
        }, 100);
    });
}

  isSidebarCollapsed: boolean = false;

toggleSidebar() {
  this.isSidebarOpen = !this.isSidebarOpen;
  console.log('Sidebar open:', this.isSidebarOpen);
  if (this.isSidebarOpen) {
    document.body.classList.add('sidebar-open');
  } else {
    document.body.classList.remove('sidebar-open');
  }
}

// Lifecycle Hook ที่ถูกเรียกหลังจาก View ถูก Initialized แล้ว
ngAfterViewInit(): void {
  // เพิ่ม setTimeout เพื่อให้แน่ใจว่า DOM โหลดเสร็จแล้ว
  setTimeout(() => {
    const element = this.imageModalElement?.nativeElement;
    if (element) {
      this.imageBootstrapModal = bootstrap.Modal.getOrCreateInstance(element);
      
      // เพิ่ม event listener สำหรับการปิด modal
      element.addEventListener('hidden.bs.modal', () => {
        this.modalImageUrls = '';
      });
    }
  }, 100);
}

// ฟังก์ชันสำหรับเปิด Modal แสดงรูปภาพเต็ม
openImageModal(imageUrl: string): void {
  console.log('Opening image modal with URL:', imageUrl);
  
  // ตั้งค่า URL ของรูปภาพ
  this.modalImageUrls = imageUrl;
  this.showImageModal = true;
    // ป้องกันการ scroll ของ body
    document.body.style.overflow = 'hidden';

  // หา element ของรูปภาพใน modal
  const modalImageElement = this.imageModalElement?.nativeElement?.querySelector('#modalImage');
  
  if (modalImageElement) {
    modalImageElement.src = imageUrl;
    modalImageElement.onerror = () => {
      console.error('Error loading image:', imageUrl);
      modalImageElement.src = 'assets/images/image-error.png'; // ถ้ามีรูป error placeholder
    };
  }

  // เปิด modal
  if (this.imageBootstrapModal) {
    this.imageBootstrapModal.show();
  } else {
    console.warn("Modal not initialized yet!");
    // ลองสร้าง modal ใหม่ถ้ายังไม่ได้สร้าง
    const element = this.imageModalElement?.nativeElement;
    if (element) {
      this.imageBootstrapModal = bootstrap.Modal.getOrCreateInstance(element);
      this.imageBootstrapModal.show();
    }
  }
}

// เพิ่มฟังก์ชันสำหรับปิด Modal (ถ้าต้องการ)

// เมธอดสำหรับเปิด modal
  // openImageModal(imageUrl: string): void {
  //   this.modalImageUrls = imageUrl;
  //   this.showImageModal = true;
  //   // ป้องกันการ scroll ของ body
  //   document.body.style.overflow = 'hidden';
  // }

  // เมธอดสำหรับปิด modal
  closeImageModal(): void {
    this.showImageModal = false;
    this.modalImageUrls = '';
    // คืนค่าการ scroll ของ body
    document.body.style.overflow = 'auto';
  }

  // เมธอดสำหรับจัดการ ESC key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showImageModal) {
      this.closeImageModal();
    }
  }


//for phone 
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
  if (deltaX < -50) { // ปัดซ้ายเกิน 50px = ปิด sidebar
    this.isSidebarOpen = false;
  }
}

  // Method สำหรับตรวจสอบและแสดง date separator
shouldShowDateSeparator(currentMessage: any, previousMessage: any): boolean {
  if (!previousMessage) return true;
  
  const currentDate = new Date(currentMessage.timestamp).toDateString();
  const previousDate = new Date(previousMessage.timestamp).toDateString();
  
  return currentDate !== previousDate;
}

// Method สำหรับ format วันที่
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
    // ตั้งค่าสถานะผู้ใช้ปัจจุบันเป็น 'offline' เมื่อออกจากหน้า
    if (this.myId) {
      set(ref(this.db, `users/${this.myId}/onlineStatus`), 'offline');
      // ลบ onDisconnect handler ที่ตั้งไว้ตอนเชื่อมต่อ
      onDisconnect(ref(this.db, `users/${this.myId}/onlineStatus`)).cancel();
    }

    // ยกเลิกการฟังสถานะของคู่สนทนาทั้งหมด
    for (const partnerId in this.partnerStatusUnsubscribe) {
      if (this.partnerStatusUnsubscribe.hasOwnProperty(partnerId)) {
        this.partnerStatusUnsubscribe[partnerId](); // เรียกฟังก์ชัน unsubscribe
      }
    }
  }

 ngAfterViewChecked(): void {
    // เลื่อนไปข้อความล่าสุดเมื่อ shouldScroll เป็น true
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false; 
    }
  }

  


  // ดึงข้อมูลสำหรับช่างภาพที่ระบุ
getPhotographerData(id: string): void {
    console.log('กำลังดึงข้อมูลคู่สนทนาสำหรับ ID:', id);
    const partnerUserId = Number(id); 

    if (partnerUserId === this.myId) {
        console.warn('พยายามดึงข้อมูลตัวเองเพื่อแชท การกระทำนี้ถูกบล็อก.');
        this.showAlert('คุณไม่สามารถแชทกับตัวเองได้', false);
        this.selectedPartnerId = null; 
        this.selectedRoomId = null; 
        this.messages = []; 
        return;
    }

    const url = `${this.constants.API_ENDPOINT}/read/${id}`;
    this.http.get<DataMembers[]>(url).subscribe({
      next: (response) => {
        const newPartner = response[0]; 
        if (newPartner) {
          if (!this.partnersData.some(p => p.user_id === newPartner.user_id)) {
            this.partnersData.push(newPartner);
          }
          console.log("ข้อมูลคู่สนทนา:", newPartner);
          
          // ปรับเงื่อนไขสำหรับการตั้งค่าแชท
          // - ผู้ใช้ทั่วไป (type_user === '1') สามารถแชทกับใครก็ได้
          // - ช่างภาพ (type_user === '2') สามารถแชทกับ initialPartnerId ได้
          // - ผู้ใช้ที่เป็นทั้งสองอย่าง (type_user === '4') สามารถแชทกับใครก็ได้
          if (this.myUserType === '1' || 
              this.myUserType === '4' || 
              (this.myUserType === '2' && newPartner.user_id === this.initialPartnerId)) {
             this.setupChat(newPartner.user_id);
          }
        } else {
          console.warn('ไม่พบข้อมูลคู่สนทนาสำหรับ ID:', id);
        }
      },
      error: (error) => {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลคู่สนทนา:', error);
      }
    });
  }

  loadChatRooms(): void {
    // ดึงห้องแชททั้งหมดแล้วกรองเฉพาะห้องที่เกี่ยวข้องกับ myId
    const chatRoomsRef = ref(this.db, 'chatRooms');

    onValue(chatRoomsRef, snapshot => {
      const allRooms: any = snapshot.val() || {};
      this.chatRooms = [];

      // วนลูปผ่านทุกห้องแชทใน Firebase
       for (const roomId in allRooms) {
        const roomData = allRooms[roomId];
        if (roomData.user1 === this.myId || roomData.user2 === this.myId) {
            const partnerId = (roomData.user1 === this.myId) ? roomData.user2 : roomData.user1;

            // *** เพิ่มตรงนี้: ข้ามการเพิ่มตัวเองเข้าในรายการคู่สนทนา ***
            if (partnerId === this.myId) {
                continue; // ข้าม (ไม่ทำขั้นตอนที่เหลือในลูปนี้)
            }

            if (!this.partnersData.some(p => p.user_id === partnerId)) {
                this.getPhotographerData(String(partnerId));
            }

            this.chatRooms.push({
                roomId: roomId,
                partnerId: partnerId,
                lastMessage: roomData.lastMessage || 'ยังไม่มีข้อความ',
                lastMessageTime: roomData.lastMessageTime || '',
            });
        }
    }
      // จัดเรียงห้องแชทตามเวลาข้อความล่าสุด
      this.chatRooms.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      console.log('โหลดห้องแชทแล้ว:', this.chatRooms);
    });
  }

  // ตั้งค่าแชทสำหรับ ID พาร์ทเนอร์ที่ระบุ
setupChat(partnerId: number): void {
    this.selectedPartnerId = partnerId;
    const roomId = this.getRoomId(this.myId, partnerId);
    this.selectedRoomId = roomId;

    const roomRef = ref(this.db, `chatRooms/${roomId}`);
    onValue(roomRef, snapshot => {
      if (!snapshot.exists()) {
        set(roomRef, { user1: this.myId, user2: partnerId, lastMessage: '', lastMessageTime: '' });
      }
    });

    const msgRef = ref(this.db, `messages/${roomId}`);
    onValue(msgRef, snapshot => {
      const data = snapshot.val();
      this.messages = data ? Object.values(data) : [];
      this.shouldScroll = true;
      
      // *** เพิ่ม console.log ตรงนี้ ***
      console.log('--- ข้อมูลข้อความที่ได้รับจาก Firebase ---');
      console.log('Raw data from Firebase:', data); // ข้อมูลดิบที่ได้จาก snapshot.val()
      console.log('Processed messages array:', this.messages); // array ที่แปลงเป็น Object.values() แล้ว

      // เพื่อดูข้อความแต่ละข้อความ
      this.messages.forEach((msg, index) => {
        console.log(`Message ${index}:`, msg);
        console.log(`  messageText Type:`, typeof msg.messageText);
        if (typeof msg.messageText === 'object' && msg.messageText !== null) {
          console.log(`  messageText Value (if object):`, JSON.stringify(msg.messageText));
        } else {
          console.log(`  messageText Value (if string/other):`, msg.messageText);
        }
      });
      console.log('-------------------------------------------');


      if (this.messages.length > 0) {
        this.markMessagesAsRead(roomId);
      }
    });
  }

  // สร้าง Room ID ที่สอดคล้องกันโดยไม่คำนึงถึงลำดับของผู้ใช้
  getRoomId(a: number, b: number): string {
    return a < b ? `room_${a}_${b}` : `room_${b}_${a}`;
  }

  // ส่งข้อความใหม่
sendMessage(): void {
    if (!this.selectedRoomId) {
      this.showAlert('กรุณาเลือกห้องแชทก่อนส่งข้อความ'); // เพิ่มข้อความแจ้งเตือนให้ชัดเจนขึ้น
      return;
    }

    if (this.files.length > 0) {
      this.uploadAndSendImage();
    } else if (this.newMessage?.trim()) {
     
      this.sendTextMessage(this.newMessage);
    } else {
      
      this.showAlert('กรุณาพิมพ์ข้อความหรือเลือกรูปภาพ', false);
    }
  }

  //ส่งข้อความตัวอักษร
  private sendTextMessage(text: string): void {
    const now = new Date().toISOString();
    const msg = {
      senderId: this.myId,
      messageText: text,
      timestamp: now,
      isRead: false,
      type: 'text' 
    };

    const msgListRef = push(ref(this.db, `messages/${this.selectedRoomId}`));
    set(msgListRef, msg);

    update(ref(this.db, `chatRooms/${this.selectedRoomId}`), {
      lastMessage: text,
      lastMessageTime: now
    });

    this.newMessage = '';
    this.shouldScroll = true;
  }


  // รับข้อมูลช่างภาพจากรายการที่โหลดไว้
   getChatPartnerInfo(partnerId: number): DataMembers | undefined {
    return this.partnersData.find(p => p.user_id === partnerId);
  }

    getPartnerStatus(partnerId: number): string {
    return this.partnerOnlineStatus[partnerId] || 'offline';
  }

    // เลื่อน Scroll ไปข้อความล่าสุด
  private scrollToBottom(): void {
    // เพิ่ม setTimeout เล็กน้อยเพื่อให้ Angular มีเวลาอัปเดต DOM
    setTimeout(() => {
      try {
        if (this.messagesContainer) { // ตรวจสอบว่า messagesContainer มีอยู่
          this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
        }
      } catch (err) {
        console.error('Could not scroll to bottom:', err);
      }
    }, 0); // setTimeout ด้วย 0ms จะให้ Angular ทำงานให้เสร็จก่อน
  }

  // เมธอดสำหรับ 'อ่านแล้ว' 
  private markMessagesAsRead(roomId: string): void {
    const messagesRef = ref(this.db, `messages/${roomId}`);

    // ใช้ get() เพื่อดึงข้อมูลครั้งเดียว ไม่ต้อง onValue() เพื่อหลีกเลี่ยง loop ไม่สิ้นสุด
    get(messagesRef).then(snapshot => {
      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const message = childSnapshot.val();
          // อัปเดตเฉพาะข้อความที่ส่งมาจากอีกฝ่าย (senderId ไม่ใช่ฉัน)
          // และข้อความนั้นยังไม่ได้ถูกอ่าน (isRead เป็น false)
          if (message.senderId !== this.myId && !message.isRead) {
            update(childSnapshot.ref, { isRead: true })
              .catch(error => console.error("Error marking message as read:", error));
          }
        });
      }
    }).catch(error => console.error("Error fetching messages to mark as read:", error));
  }

    private listenToPartnerStatus(partnerId: number): void {
    if (this.partnerStatusUnsubscribe[partnerId]) {
      return;
    }

    const partnerStatusRef = ref(this.db, `users/${partnerId}/onlineStatus`);
    
    // onValue จะคืนค่าฟังก์ชันสำหรับ unsubscribe ซึ่งมี Type เป็น () => void
    const unsubscribe = onValue(partnerStatusRef, (snapshot) => {
      this.partnerOnlineStatus[partnerId] = snapshot.val() || 'offline';
      console.log(`สถานะของ ${partnerId}: ${this.partnerOnlineStatus[partnerId]}`);
    });

    this.partnerStatusUnsubscribe[partnerId] = unsubscribe;
  }

  //สำหรับจัดการการเลือกไฟล์รูปภาพ 
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }
    
    // Check if adding these files would exceed the limit
    const totalFiles = this.files.length + input.files.length;
    if (totalFiles > 10) {
      this.showAlert('คุณสามารถอัปโหลดได้สูงสุด 10 รูปเท่านั้น');
      input.value = '';
      return;
    }
    
    // Process selected files
    const selectedFiles = Array.from(input.files);
    
    selectedFiles.forEach(file => {
      // Validate file type
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        this.showAlert('รองรับเฉพาะไฟล์ .jpg หรือ .png เท่านั้น');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showAlert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.files.push({ file, preview: e.target.result });
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input value
    input.value = '';
  }

   removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  //อัปโหลดและส่งรูปภาพ 
 async uploadAndSendImage(): Promise<void> {
    if (this.files.length === 0 || !this.selectedRoomId) {
        this.showAlert('กรุณาเลือกรูปภาพและเลือกห้องแชท');
        return;
    }

    this.isUploading = true;
    let successCount = 0;
    const filesToUpload = [...this.files]; // สร้างสำเนาเพื่อวนลูปและล้าง this.files ทีหลัง

    try {
        for (let i = 0; i < filesToUpload.length; i++) {
            const fileObj = filesToUpload[i];
            // this.showAlert(`กำลังอัปโหลดรูปที่ ${i + 1} จาก ${filesToUpload.length}`, false);

            try {
                // await เพื่อรอให้การอัปโหลดเสร็จสิ้น
                const imageUrl: any = await this.imageUploadService.uploadImageAndGetUrl(fileObj.file).toPromise();
                
                console.log(`รูปที่ ${i + 1} อัปโหลดสำเร็จ:`, imageUrl);

                // ส่งข้อความรูปภาพเข้า Firebase
                const now = new Date().toISOString();
                const msg = {
                    senderId: this.myId,
                    messageText: imageUrl, 
                    timestamp: now,
                    isRead: false,
                    type: 'image'
                };

                const msgListRef = push(ref(this.db, `messages/${this.selectedRoomId}`));
                await set(msgListRef, msg); // ใช้ await สำหรับ set ด้วย เพื่อให้แน่ใจว่าข้อความถูกบันทึกก่อนไปต่อ
                
                successCount++;

            } catch (uploadError) {
                console.error(`Error uploading image ${i + 1}:`, uploadError);
                this.showAlert(`ไม่สามารถอัปโหลดรูปที่ ${i + 1} ได้`, false);
            }
        }

        // อัปเดต lastMessage ใน chatRooms หลังจากอัปโหลดและส่งข้อความทั้งหมด
        if (successCount > 0) {
            const now = new Date().toISOString(); // ใช้เวลาปัจจุบันสำหรับ lastMessage
            await update(ref(this.db, `chatRooms/${this.selectedRoomId}`), {
                lastMessage: '📷 รูปภาพ', // แสดงว่าข้อความล่าสุดคือรูปภาพ
                lastMessageTime: now
            });
        }

        // แสดงผลลัพธ์สุดท้าย
        // if (successCount === filesToUpload.length) {
        //     this.showAlert('อัปโหลดรูปทั้งหมดสำเร็จ', true);
        // } else if (successCount > 0) {
        //     this.showAlert(`อัปโหลดสำเร็จ ${successCount} จาก ${filesToUpload.length} รูป`, true);
        // } else {
        //     this.showAlert('ไม่สามารถอัปโหลดรูปได้ กรุณาลองใหม่อีกครั้ง', true);
        // }

        this.files = []; // ล้าง array files หลังจากอัปโหลดและส่งทั้งหมด
        this.shouldScroll = true; // ตั้งค่าให้ scroll ไปด้านล่าง
        
    } catch (processError) {
        console.error('Error during upload process:', processError);
        this.showAlert('เกิดข้อผิดพลาดระหว่างการอัปโหลด กรุณาลองใหม่อีกครั้ง', true);
    } finally {
        this.isUploading = false; 
    }
}

 // เมื่อรูปภาพโหลดเสร็จสิ้น ให้เลื่อนไปที่ด้านล่าง
 onImageLoad(): void {
  this.shouldScroll = true; // ตั้งค่าให้ scroll
  }

  isImageUrl(text: string | null | undefined): boolean { 
    if (typeof text !== 'string' || !text) {
      return false; 
    }
  
    //ตรวจสอบว่าเป็น URL ของรูปภาพหรือไม่
    return (text.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/) != null) || 
           (text.startsWith('http') && text.includes('ibb.co')); 
  }

    profile(){
      const type = Number(this.data?.type_user);
      console.log("ค่าของ type:", type, "| ประเภท:", typeof type); // ✅ ดูค่าที่แท้จริง
      if(type === 2 ){
        this.router.navigate(['/'], { state: { data: this.data } });
      }
      this.router.navigate(['/profile'], { state: { data: this.data } });
    }

  private showAlert(message: string, isModal: boolean = true): void {
    if (isModal) {
       alert(message);
    } else {
      console.log(message); 
     }
    }

}
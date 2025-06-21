import { inject, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DataMembers } from '../../model/models'; 
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../config/constants';

import { Database, ref, set, push, onValue, update, query, orderByChild } from '@angular/fire/database';

@Component({
    selector: 'app-massage-room',
    standalone: true,
    imports: [FormsModule ,CommonModule],
    templateUrl: './massage-room.component.html',
    styleUrl: './massage-room.component.scss'
})

export class MassageRoomComponent implements OnInit{
  private db: Database = inject(Database);
  myId: number = 0; 
  myUserType: string | null = null; // ประเภทผู้ใช้: '1' = user, '2' = shutter, '3' = admin
  chatRooms: any[] = [];
  messages: any[] = [];
  selectedRoomId: string | null = null;
  selectedPartnerId: number | null = null;
  newMessage = '';

  data: DataMembers | null = null; // ข้อมูลผู้ใช้ที่กำลังล็อกอิน (รวมถึง type_user)
  partnersData: DataMembers[] = []; // รายชื่อคู่สนทนา (ช่างภาพสำหรับ user, ผู้ใช้สำหรับ photographer)
  initialPartnerId: number = 0; // เดิมคือ idshutter, เป็น ID ของคู่สนทนาเริ่มต้น

  constructor(
    private route: ActivatedRoute,
    private constants: Constants, 
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // รับข้อมูลที่ส่งมาจาก route ก่อนหน้าโดยใช้ history.state
    this.route.paramMap.subscribe(() => {
      setTimeout(() => {
        this.data = window.history.state.datauser || null;
        this.initialPartnerId = window.history.state.idshutter || null;

        if (!this.data || !this.data.user_id || !this.data.type_user) { // ตรวจสอบ type_user ด้วย
          console.error("Error: ไม่พบข้อมูลผู้ใช้ที่ล็อกอิน (datauser), user_id หรือ type_user ขาดหายไป");
          // ควรจัดการตรงนี้ เช่น เปลี่ยนเส้นทางไปยังหน้าล็อกอิน
          return;
        }

        this.myId = this.data.user_id;
        this.myUserType = this.data.type_user; // กำหนดประเภทผู้ใช้
        console.log('✅ ID ผู้ใช้ของฉัน (myId):', this.myId);
        console.log('✅ ประเภทผู้ใช้ของฉัน (myUserType):', this.myUserType);
        console.log('✅ ได้รับข้อมูลผู้ใช้ที่ล็อกอินแล้ว:', this.data);
        console.log('✅ ได้รับ ID คู่สนทนาเริ่มต้น (initialPartnerId):', this.initialPartnerId);

        // โหลดห้องแชทสำหรับผู้ใช้ที่ล็อกอิน
        this.loadChatRooms();

        // ถ้ามี initialPartnerId (กรณี user คลิกช่างภาพ) และเป็นบทบาท 'user' (type_user === '1')
        if (this.initialPartnerId && this.myUserType === '1') {
          console.log('กำลังเริ่มต้นแชทกับคู่สนทนา ID:', this.initialPartnerId);
          this.getPhotographerData(String(this.initialPartnerId)); // ดึงข้อมูลสำหรับคู่สนทนาคนนั้น
        }
      }, 100);
    });
  }

  // ดึงข้อมูลสำหรับช่างภาพที่ระบุ
  getPhotographerData(id: string): void {
    console.log('กำลังดึงข้อมูลคู่สนทนาสำหรับ ID:', id);
    const url = `${this.constants.API_ENDPOINT}/read/${id}`;
    this.http.get<DataMembers[]>(url).subscribe({
      next: (response) => {
        const newPartner = response[0]; // สมมติว่า API คืนค่าเป็น array และเราต้องการตัวแรก
        if (newPartner) {
          // เพิ่มลงในรายการ partnersData หากยังไม่มี
          if (!this.partnersData.some(p => p.user_id === newPartner.user_id)) {
            this.partnersData.push(newPartner);
          }
          console.log("ข้อมูลคู่สนทนา:", newPartner);
          // หากเป็นผู้ใช้งานทั่วไป (type_user === '1') หรือเป็นช่างภาพ (type_user === '2') และ partner นี้เป็น initialPartnerId
          // เราจะตั้งค่าแชททันที
          if (this.myUserType === '1' || (this.myUserType === '2' && newPartner.user_id === this.initialPartnerId)) {
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
        // ตรวจสอบว่าผู้ใช้ปัจจุบัน (myId) อยู่ใน user1 หรือ user2 ของห้องนี้หรือไม่
        if (roomData.user1 === this.myId || roomData.user2 === this.myId) {
          // กำหนด partnerId: ถ้า user1 คือฉัน, partner คือ user2; ถ้า user2 คือฉัน, partner คือ user1
          const partnerId = (roomData.user1 === this.myId) ? roomData.user2 : roomData.user1;

          // ดึงข้อมูลพาร์ทเนอร์หากยังไม่มีในลิสต์ photographers
          if (!this.partnersData.some(p => p.user_id === partnerId)) {
            this.getPhotographerData(String(partnerId));
          }

          // เพิ่มห้องลงในรายการ chatRooms
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
        // สร้างห้องแชทใหม่: user1 คือผู้ใช้ล็อกอิน (myId), user2 คือช่างภาพ (partnerId)
        set(roomRef, { user1: this.myId, user2: partnerId, lastMessage: '', lastMessageTime: '' });
      }
    });

    const msgRef = ref(this.db, `messages/${roomId}`);
    onValue(msgRef, snapshot => {
      const data = snapshot.val();
      this.messages = data ? Object.values(data) : [];
      // (เลือกได้) ทำเครื่องหมายข้อความเป็นอ่านแล้วสำหรับห้องที่เลือก
      // this.markMessagesAsRead(roomId);
    });
  }

  // สร้าง Room ID ที่สอดคล้องกันโดยไม่คำนึงถึงลำดับของผู้ใช้
  getRoomId(a: number, b: number): string {
    return a < b ? `room_${a}_${b}` : `room_${b}_${a}`;
  }

  // ส่งข้อความใหม่
  sendMessage(): void {
    if (!this.newMessage?.trim() || !this.selectedRoomId) return;

    const now = new Date().toISOString();
    const msg = {
      senderId: this.myId,
      messageText: this.newMessage,
      timestamp: now,
      isRead: false // ข้อความใหม่เริ่มต้นเป็นยังไม่อ่าน
    };

    const msgListRef = ref(this.db, `messages/${this.selectedRoomId}`);
    const newMsgRef = push(msgListRef);
    set(newMsgRef, msg);

    // อัปเดตข้อความล่าสุดในห้องแชท
    update(ref(this.db, `chatRooms/${this.selectedRoomId}`), {
      lastMessage: this.newMessage,
      lastMessageTime: now
    });

    this.newMessage = ''; // ล้างช่องป้อนข้อมูล
  }

  // ตัวช่วยในการรับข้อมูลช่างภาพจากรายการที่โหลดไว้
   getChatPartnerInfo(partnerId: number): DataMembers | undefined {
    return this.partnersData.find(p => p.user_id === partnerId);
  }

  // (เลือกได้) ฟังก์ชันสำหรับทำเครื่องหมายข้อความเป็นอ่านแล้ว
  // markMessagesAsRead(roomId: string): void {
  //   const messagesRef = ref(this.db, `messages/${roomId}`);
  //   onValue(messagesRef, snapshot => {
  //     snapshot.forEach(childSnapshot => {
  //       const message = childSnapshot.val();
  //       if (message.senderId !== this.myId && !message.isRead) {
  //         update(childSnapshot.ref, { isRead: true });
  //       }
  //     });
  //   }, { onlyOnce: true }); // ทำงานเพียงครั้งเดียวเพื่อหลีกเลี่ยง infinite loops
  // }
}
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, NgZone } from '@angular/core'; // เพิ่ม NgZone
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../../config/constants';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatafilterUsers, DataMembers } from '../../../model/models';
import { MatButtonModule } from '@angular/material/button';
// เพิ่ม import สำหรับ Firebase Realtime Database (push, update, serverIncrement)
import { Database, DataSnapshot, get, ref, set, push, update } from '@angular/fire/database';

// กำหนดโครงสร้างข้อมูลสำหรับหมวดหมู่หลัก (Main Category)
interface ApprovalCategory {
  id: string;
  title: string;
  subCriteria: SubCriterion[];
  isEditing?: boolean; // สถานะว่ากำลังแก้ไขชื่อหมวดหมู่นี้อยู่หรือไม่
  originalTitle?: string; // เก็บชื่อเดิมไว้เผื่อกดยกเลิกการแก้ไข
}
// กำหนดโครงสร้างข้อมูลสำหรับเกณฑ์ย่อย (Sub-Criterion)
interface SubCriterion {
  id: string;
  text: string;
  isEnabled: boolean; // สถานะเปิด/ปิดการใช้งานของเกณฑ์ย่อยนี้
  isEditing?: boolean; // สถานะว่ากำลังแก้ไขข้อความของเกณฑ์ย่อยนี้อยู่หรือไม่
  originalText?: string; // เก็บข้อความเดิมไว้เผื่อกดยกเลิกการแก้ไข
}

// กำหนด ID ของ System Admin ที่ใช้ร่วมกัน (ตามที่คุณระบุว่าคือ ID 1)
const SYSTEM_ADMIN_ID = 1;

@Component({
  selector: 'app-comfirm-shutter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  templateUrl: './comfirm-shutter.component.html',
  styleUrl: './comfirm-shutter.component.scss'
})
export class ComfirmShutterComponent implements OnInit, OnDestroy {

  private db: Database = inject(Database);
  private criteriaPath = 'approvalCriteria'; // Path ใน Firebase Realtime Database
  private rejectionReasonsPath = 'userRejectionReasons'; // Path ใหม่สำหรับเก็บเหตุผลการปฏิเสธ

  approvalCategories: ApprovalCategory[] = [];
  isLoading = true;
  hasError = false;

  datauser: DataMembers[] = [];
  datafilterUsers: DatafilterUsers[] = [];

  refuse = 0;
  comfirm = 0;
  pending = 0;

  // สถานะ Tab ที่เลือก
  public selectedTab: 1 | 2 | 3 = 1;

  // สถานะ Modal สำหรับปฏิเสธ
  public isRejectModalOpen: boolean = false; // สถานะสำหรับ Modal เหตุผลการปฏิเสธ

  // สถานะ Modal สำหรับแสดงเหตุผลการปฏิเสธ
  public isViewReasonsModalOpen: boolean = false;
  public reasonsToDisplay: { categoryTitle: string; reasonText: string; }[] = [];

  // สถานะ Modal สำหรับแสดงตัวอย่างข้อความแชท (เปลี่ยนชื่อจาก isEmailPreviewModalOpen)
  public isChatMessagePreviewModalOpen: boolean = false;
  // เนื้อหาข้อความแชทสำหรับแสดงตัวอย่าง (เปลี่ยนชื่อจาก emailPreviewContent)
  public chatMessagePreviewContent: string = '';
  // หัวข้อ Modal (เช่น "ตัวอย่างข้อความอนุมัติ/ปฏิเสธ") (เปลี่ยนชื่อจาก emailPreviewSubject)
  public chatMessagePreviewTitle: string = '';
  // Flag เพื่อระบุว่าเป็นข้อความอนุมัติหรือปฏิเสธ (เปลี่ยนชื่อจาก isApprovalEmail)
  public isApprovalMessage: boolean = false;

  // ตัวแปรสำหรับเก็บ user_id ของช่างภาพที่กำลังจะถูกปฏิเสธ/แสดงเหตุผล/อนุมัติ
  public selectedUserToReject: number | null = null;
  public selectedUserToViewReasons: number | null = null;
  public selectedUserToApprove: number | null = null; // เพิ่มตัวแปรสำหรับผู้ใช้ที่จะอนุมัติ

  // Key คือ subCriterion.id, Value คือ true/false (ถูกเลือกหรือไม่)
  public selectedRejectionReasons: { [subCriterionId: string]: boolean } = {};

  // ตัวแปรสำหรับเก็บ interval ของ countdown (ไม่ได้ใช้ในบริบทนี้ แต่คงไว้ตามโค้ดเดิม)
  private countdownIntervals: { [userId: number]: any } = {};

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private Constants: Constants,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.datauser = [user];
      console.log("Loaded user from AuthService:", this.datauser);
    } else {
      console.warn("No user found in AuthService. Redirecting to login...");
      this.router.navigate(['/']);
      return;
    }

    // โหลดข้อมูลครั้งแรก
    this.filterUsers(1);
    this.countUsersByType();
    this.loadCriteria(); // โหลดเกณฑ์การอนุมัติ
  }

  ngOnDestroy(): void {
    // ทำความสะอาด interval เมื่อ component ถูกทำลาย
    Object.values(this.countdownIntervals).forEach(interval => {
      clearInterval(interval);
    });
  }

  // โหลดข้อมูลเกณฑ์อนุมัติจาก Firebase Realtime Database
  async loadCriteria(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;

    try {
      const criteriaRef = ref(this.db, this.criteriaPath);
      const snapshot: DataSnapshot = await get(criteriaRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        if (Array.isArray(data)) {
          this.approvalCategories = data;
        } else if (typeof data === 'object' && data !== null) {
          this.approvalCategories = Object.keys(data).map(key => ({
            id: key,
            title: data[key].title,
            subCriteria: data[key].subCriteria ? Object.keys(data[key].subCriteria).map((subKey: string) => ({
              id: subKey,
              text: data[key].subCriteria[subKey].text,
              isEnabled: data[key].subCriteria[subKey].isEnabled
            })) : []
          }));
        } else {
          console.warn('รูปแบบข้อมูลเกณฑ์จาก Firebase ไม่ตรงกับที่คาดไว้ จะแสดงเป็นหน้าว่าง.');
          this.approvalCategories = [];
        }
        console.log('ข้อมูลเกณฑ์ที่ดึงมา:', this.approvalCategories);
      } else {
        console.warn('ไม่พบข้อมูลเกณฑ์ใน Firebase จะแสดงเป็นหน้าว่างเปล่าเพื่อให้เพิ่มข้อมูลใหม่.');
        this.approvalCategories = [];
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลเกณฑ์จาก Firebase:', error);
      this.hasError = true;
      this.approvalCategories = [];
    } finally {
      this.isLoading = false;
    }
  }

  countUsersByType(): void {
    // นับจำนวนผู้ใช้ในแต่ละสถานะ
    this.pending = this.datafilterUsers.filter(user => user.sht_status === 1).length;
    this.comfirm = this.datafilterUsers.filter(user => user.sht_status === 2).length;
    this.refuse = this.datafilterUsers.filter(user => user.sht_status === 3).length;
  }

  public filterUsers(status: number): void {
    // อัพเดตสถานะ tab ที่เลือก
    switch (status) {
      case 1:
        this.selectedTab = 1;
        break;
      case 2:
        this.selectedTab = 2;
        break;
      case 3:
        this.selectedTab = 3;
        break;
    }

    const url = this.Constants.API_ENDPOINT + '/getshutterbytype/' + this.selectedTab;
    this.http.get(url).subscribe(
      (response: any) => {
        // แปลงข้อมูลจาก API เป็น ExtendedDatafilterUsers
        this.datafilterUsers = response.map((user: DatafilterUsers) => ({
          ...user,
        }));

        console.log("data datafilterUsers :", this.datafilterUsers);

        // นับจำนวนผู้ใช้ในแต่ละสถานะ
        this.countUsersByType();

      },
      (error) => {
        console.error('Error fetching users:', error);
        this.snackBar.open('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'ปิด', { duration: 3000 , verticalPosition: 'top'});
      }
    );
  }

  // ฟังก์ชันหลักในการเปลี่ยนสถานะช่างภาพ (เรียก API Backend)
  // ฟังก์ชันนี้จะถูกเรียกจาก sendChatAndConfirmStatus() เท่านั้น
  public async changeUserStatus(userId: number, newStatus: 2 | 3, rejectionReasons: string[] = []): Promise<void> {
    const url = this.Constants.API_ENDPOINT + '/approveshutter/' + userId;

    // ส่งสถานะและเหตุผล (ถ้ามี) ไปยัง Backend
    const payload = {
      sht_status: newStatus,
      rejectionReasons: newStatus === 3 ? rejectionReasons : [] // ส่งเหตุผลไปให้ Backend เพื่อใช้ในอีเมล
    };

    console.log('Sending payload to backend:', payload);

    try {
      await this.http.put(url, payload).toPromise(); // ใช้ toPromise() เพื่อรอให้เสร็จสิ้น
      console.log('Status updated successfully for user:', userId);

      const message = newStatus === 2 ? 'อนุมัติช่างภาพสำเร็จ' : 'ปฏิเสธช่างภาพสำเร็จ';
      this.snackBar.open(message, 'ปิด', { duration: 2000 , verticalPosition: 'top'});

      // รีเฟรชข้อมูล - ถ้าปฏิเสธให้ไปที่แท็บปฏิเสธ
      const targetTab = newStatus === 3 ? 3 : this.selectedTab;
      this.filterUsers(targetTab);

      // ไม่ต้องปิด Modal ตรงนี้ เพราะจะถูกปิดโดย closeChatMessagePreviewModal() ใน sendChatAndConfirmStatus()

    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอัปเดตสถานะหรือส่งข้อมูลไป Backend:', error);
      this.snackBar.open('เกิดข้อผิดพลาดในการอัปเดตสถานะ', 'ปิด', { duration: 3000 , verticalPosition: 'top'});
    }
  }

  // Helper function to get room ID
  private getRoomId(userAId: number, userBId: number): string {
    // ตรวจสอบให้แน่ใจว่า ID ของผู้ส่ง (SYSTEM_ADMIN_ID) อยู่ในลำดับที่ถูกต้องเมื่อสร้าง roomId
    return userAId < userBId ? `room_${userAId}_${userBId}` : `room_${userBId}_${userAId}`;
  }

  // New method to send system messages (from SYSTEM_ADMIN_ID)
  private async sendSystemMessageToPhotographer(photographerId: number, messageText: string): Promise<void> {
    const roomId = this.getRoomId(SYSTEM_ADMIN_ID, photographerId);
    const messagesRef = ref(this.db, `messages/${roomId}`);
    const chatRoomRef = ref(this.db, `chatRooms/${roomId}`);

    const now = new Date().toISOString();

    try {
      // 1. Check if chat room exists, if not, create it with initial unread counts
      const roomSnapshot = await get(chatRoomRef);
      if (!roomSnapshot.exists()) {
        console.log(`[System Message] Creating new chat room ${roomId} for system admin (${SYSTEM_ADMIN_ID}) and photographer ${photographerId}.`);
        await set(chatRoomRef, {
          user1: SYSTEM_ADMIN_ID,
          user2: photographerId,
          lastMessage: '', // Will be updated by the message below
          lastMessageTime: '', // Will be updated by the message below
          [`unreadCount_${SYSTEM_ADMIN_ID}`]: 0,
          [`unreadCount_${photographerId}`]: 0
        });
      }

      // 2. Send the message
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, {
        senderId: SYSTEM_ADMIN_ID, // ใช้ SYSTEM_ADMIN_ID (1) เป็นผู้ส่ง
        messageText: messageText,
        timestamp: now,
        isRead: false, // Mark as unread for the photographer (recipient)
        type: 'text'
      });
      console.log(`[System Message] Message sent to room ${roomId}.`);

      // 3. Update chat room's last message, time, sender, and increment unread count for photographer
      const photographerUnreadCountKey = `unreadCount_${photographerId}`;
      await update(chatRoomRef, {
        lastMessage: messageText,
        lastMessageTime: now,
        lastMessageSenderId: SYSTEM_ADMIN_ID, // ตั้งค่าผู้ส่งข้อความล่าสุดเป็น SYSTEM_ADMIN_ID
        [photographerUnreadCountKey]: 1 // Increment unread count for the recipient
      });
      console.log(`[System Message] Chat room ${roomId} updated with new last message and unread count for ${photographerId}.`);

    } catch (error) {
      console.error(`[System Message] Error sending system message to photographer ${photographerId}:`, error);
      this.snackBar.open('เกิดข้อผิดพลาดในการส่งข้อความแจ้งเตือน', 'ปิด', { duration: 3000 , verticalPosition: 'top'});
    }
  }

  // *** ฟังก์ชันใหม่: เปิด Modal ตัวอย่างข้อความแชทสำหรับอนุมัติ (เปลี่ยนชื่อจาก openApproveEmailPreviewModal) ***
  async openApproveMessagePreviewModal(userId: number): Promise<void> {
  this.selectedUserToApprove = userId;
  this.isApprovalMessage = true; // ตั้งค่าเป็นข้อความอนุมัติ

  // เคลียร์เหตุผลการปฏิเสธเก่า (หากมี) เมื่อกำลังจะอนุมัติ
  const rejectionRef = ref(this.db, `${this.rejectionReasonsPath}/${userId}`);
  try {
    await set(rejectionRef, null);
    console.log(`Cleared rejection reasons from Firebase (frontend) for user ${userId} before approving.`);
  } catch (error) {
    console.error('Error clearing rejection reasons before approval:', error);
    this.snackBar.open('เกิดข้อผิดพลาดในการล้างเหตุผลการปฏิเสธเก่า', 'ปิด', { duration: 3000 , verticalPosition: 'top'});
  }

  // เตรียมเนื้อหาข้อความแชทสำหรับแสดงตัวอย่าง
  const photographer = this.datafilterUsers.find(u => u.user_id === this.selectedUserToApprove);
  const username = photographer ? photographer.username : 'ช่างภาพ';

  this.chatMessagePreviewTitle = 'ตัวอย่างข้อความแจ้งอนุมัติ';

  // ข้อความแชทสำหรับอนุมัติ (ใช้ \n เพื่อขึ้นบรรทัดใหม่)
  this.chatMessagePreviewContent =
    `ยินดีด้วยคุณ${username}! 🎉\n\n` + // ขึ้นบรรทัดใหม่ 2 ครั้ง
    `การสมัครช่างภาพของคุณได้รับการอนุมัติแล้ว คุณสามารถเข้าสู่ระบบและเริ่มใช้งานแพลตฟอร์ม Shutter Seek ได้ทันที\n\n` + // ขึ้นบรรทัดใหม่ 2 ครั้ง
    `หากมีข้อสงสัยโปรดติดต่อเรา`;

  this.isChatMessagePreviewModalOpen = true; // เปิด Modal ตัวอย่างข้อความแชท
}

  // ฟังก์ชันอนุมัติช่างภาพ - จะเรียก openApproveMessagePreviewModal แทน
  approveUser(userId: number): void {
    console.log(`Approving user ${userId}`);
    this.openApproveMessagePreviewModal(userId); // เรียกเปิด Modal ตัวอย่างข้อความแชท
  }


  // ฟังก์ชันเปิด Modal ปฏิเสธช่างภาพ
  openRejectModal(userId: number): void {
    this.selectedUserToReject = userId;
    this.selectedRejectionReasons = {}; // เคลียร์การเลือกเหตุผลเก่า
    this.isApprovalMessage = false; // ตั้งค่าเป็นข้อความปฏิเสธ
    this.isRejectModalOpen = true;
  }

  // ฟังก์ชันปิด Modal ปฏิเสธช่างภาพ
  cancelReject(): void {
    this.isRejectModalOpen = false;
    this.selectedUserToReject = null;
    this.selectedRejectionReasons = {}; // เคลียร์การเลือกเหตุผล
  }

  // ฟังก์ชันสลับการเลือกเหตุผลการปฏิเสธ
  toggleReasonSelection(subCriterionId: string): void {
    this.selectedRejectionReasons[subCriterionId] = !this.selectedRejectionReasons[subCriterionId];
    console.log('Selected reasons:', this.selectedRejectionReasons);
  }

  // ฟังก์ชันยืนยันการปฏิเสธจาก Modal เหตุผล (บันทึก Firebase และเปิด Modal ตัวอย่างข้อความแชท)
async confirmRejectUser(): Promise<void> {
  if (this.selectedUserToReject === null) {
    this.snackBar.open('ไม่พบผู้ใช้ที่ต้องการปฏิเสธ', 'ปิด', { duration: 3000 , verticalPosition: 'top'});
    return;
  }

  const reasons: string[] = [];
  this.approvalCategories.forEach(category => {
    category.subCriteria.forEach(sub => {
      if (sub.isEnabled && this.selectedRejectionReasons[sub.id]) {
        reasons.push(sub.text);
      }
    });
  });

  if (reasons.length === 0) {
    this.snackBar.open('กรุณาเลือกเหตุผลการปฏิเสธอย่างน้อยหนึ่งข้อ', 'ปิด', { duration: 3000 , verticalPosition: 'top'});
    return;
  }

  try {
    const rejectionRef = ref(this.db, `${this.rejectionReasonsPath}/${this.selectedUserToReject}`);
    await set(rejectionRef, reasons);
    console.log(`บันทึกเหตุผลการปฏิเสธลง Firebase จาก Frontend สำหรับผู้ใช้ ${this.selectedUserToReject}:`, reasons);

    const photographer = this.datafilterUsers.find(u => u.user_id === this.selectedUserToReject);
    const username = photographer ? photographer.username : 'ช่างภาพ';

    this.chatMessagePreviewTitle = 'ตัวอย่างข้อความแจ้งปฏิเสธ';
    let reasonsList = '';

    if (reasons.length > 0) {
      reasonsList = 'เนื่องจากเหตุผลดังนี้:\n';
      reasons.forEach(reason => {
        reasonsList += `• ${reason}\n`;
      });
    } else {
      reasonsList = `ไม่พบเหตุผลที่เฉพาะเจาะจง โปรดติดต่อทีมงาน Shutter Seek เพื่อสอบถามข้อมูลเพิ่มเติม`;
    }

    this.chatMessagePreviewContent =
      `เรียนคุณ${username},\n\n` +
      `ขออภัยที่แจ้งให้ทราบว่า การสมัครช่างภาพของคุณยังไม่ได้รับการอนุมัติในขณะนี้\n\n` +
      `${reasonsList}\n\n` +
      `คุณสามารถแก้ไขข้อมูลและยื่นใบสมัครใหม่ได้ หากมีข้อสงสัยเพิ่มเติมโปรดติดต่อทีมงาน Shutter Seek`;

    // this.cancelReject(); // 

    this.isApprovalMessage = false;
    this.isChatMessagePreviewModalOpen = true; // เปิด Modal ตัวอย่างข้อความแชท

    // ** สำคัญ: ปิด Modal เลือกเหตุผลหลังจากเปิด Modal ตัวอย่างข้อความแชท **
    // เราจะปิด Modal เลือกเหตุผลตรงนี้ แทนที่จะใช้ cancelReject()
    this.isRejectModalOpen = false;
    this.selectedRejectionReasons = {}; // เคลียร์การเลือกเหตุผลเก่าไปเลย

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึกเหตุผลลง Firebase หรือเตรียมตัวอย่างข้อความแชท:', error);
    this.snackBar.open('เกิดข้อผิดพลาดในการดำเนินการปฏิเสธ', 'ปิด', { duration: 3000 , verticalPosition: 'top'});
  }
}

  // ฟังก์ชันสำหรับส่งข้อความแชทและยืนยันสถานะ (เรียกจาก Modal ตัวอย่างข้อความแชท)
  async sendChatAndConfirmStatus(): Promise<void> { // เปลี่ยนชื่อจาก sendEmailAndConfirmStatus
    const userIdToSend = this.isApprovalMessage ? this.selectedUserToApprove : this.selectedUserToReject;

    if (userIdToSend === null) {
      this.snackBar.open('ไม่พบผู้ใช้ที่ต้องการส่งข้อความ', 'ปิด', { duration: 3000 , verticalPosition: 'top'});
      return;
    }

    try {
      // 1. Change user status in backend
      const newStatus = this.isApprovalMessage ? 2 : 3;
      const reasons: string[] = []; // รวบรวมเหตุผลถ้าเป็นกรณีปฏิเสธ
      if (!this.isApprovalMessage) {
        this.approvalCategories.forEach(category => {
          category.subCriteria.forEach(sub => {
            if (sub.isEnabled && this.selectedRejectionReasons[sub.id]) {
              reasons.push(sub.text);
            }
          });
        });
      }
      await this.changeUserStatus(userIdToSend, newStatus, reasons); // ส่งเหตุผลไป Backend ด้วย

      // 2. Send approval/rejection message via chat
      await this.sendSystemMessageToPhotographer(userIdToSend, this.chatMessagePreviewContent);
      this.filterUsers(1); // รีเฟรชข้อมูลผู้ใช้หลังจากส่งข้อความ

      // 3. Navigate to chat room after sending message and updating status
      // this.ngZone.run(() => {
      //   this.router.navigate(['/roomchat'], {
      //     state: {
      //       idshutter: userIdToSend
      //     }
      //   });
      // });

    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการส่งข้อความแชทและอัปเดตสถานะ:', error);
      this.snackBar.open('เกิดข้อผิดพลาดในการส่งข้อความและอัปเดตสถานะ', 'ปิด', { duration: 3000 , verticalPosition: 'top'});
    }
    // ปิด Modal หลังจากส่งและนำทาง
    this.closeChatMessagePreviewModal(); // เปลี่ยนชื่อฟังก์ชัน
  }

  // ฟังก์ชันปิด Modal ตัวอย่างข้อความแชท (เปลี่ยนชื่อจาก closeEmailPreviewModal)
closeChatMessagePreviewModal(): void {
  this.isChatMessagePreviewModalOpen = false;
  this.chatMessagePreviewContent = '';
  this.chatMessagePreviewTitle = '';
  this.isApprovalMessage = false;
  this.selectedUserToReject = null;   
  this.selectedUserToApprove = null;  
}


  // ฟังก์ชันเปิด Modal แสดงเหตุผลการปฏิเสธ
  async openViewReasonsModal(userId: number): Promise<void> {
    this.selectedUserToViewReasons = userId;
    this.reasonsToDisplay = []; // เคลียร์เหตุผลเก่า

    try {
      const rejectionRef = ref(this.db, `${this.rejectionReasonsPath}/${userId}`);
      const snapshot: DataSnapshot = await get(rejectionRef);

      if (snapshot.exists()) {
        const fetchedReasonTexts: string[] = snapshot.val();
        if (Array.isArray(fetchedReasonTexts)) {
          // Map fetched reason texts back to include category titles
          this.reasonsToDisplay = fetchedReasonTexts.map(reasonText => {
            // Find the corresponding sub-criterion and its category
            for (const category of this.approvalCategories) {
              const foundSubCriterion = category.subCriteria.find(sub => sub.text === reasonText);
              if (foundSubCriterion) {
                return { categoryTitle: category.title, reasonText: foundSubCriterion.text };
              }
            }
            // Fallback if reason text is not found in current criteria (e.g., criteria changed)
            return { categoryTitle: 'ไม่ระบุหมวดหมู่', reasonText: reasonText };
          });
        } else {
          console.warn(`รูปแบบข้อมูลเหตุผลการปฏิเสธสำหรับผู้ใช้ ${userId} ไม่ถูกต้อง.`);
          this.reasonsToDisplay = [{ categoryTitle: 'ข้อผิดพลาด', reasonText: 'ไม่พบข้อมูลเหตุผล หรือข้อมูลไม่ถูกต้อง' }];
        }
      } else {
        this.reasonsToDisplay = [{ categoryTitle: 'ไม่พบ', reasonText: 'ไม่พบเหตุผลการปฏิเสธสำหรับผู้ใช้คนนี้' }];
      }
      this.isViewReasonsModalOpen = true;
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงเหตุผลการปฏิเสธจาก Firebase:', error);
      this.reasonsToDisplay = [{ categoryTitle: 'ข้อผิดพลาด', reasonText: 'เกิดข้อผิดพลาดในการโหลดเหตุผล' }];
      this.isViewReasonsModalOpen = true; // ยังคงเปิด Modal เพื่อแสดงข้อผิดพลาด
    }
  }

  // ฟังก์ชันปิด Modal แสดงเหตุผลการปฏิเสธ
  closeViewReasonsModal(): void {
    this.isViewReasonsModalOpen = false;
    this.selectedUserToViewReasons = null;
    this.reasonsToDisplay = [];
  }


  // ฟังก์ชันนำทาง
  Approval(): void {
    this.router.navigate(['/Approval']);
  }

  goToadd(): void {
    this.router.navigate(['/addmin']);
  }

  profile(): void {
    this.router.navigate(['/editadmin']);
  }

  goToLogin(): void {
    // ออกจากระบบ
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  back(): void {
    this.router.navigate(['/admin']);
  }
}
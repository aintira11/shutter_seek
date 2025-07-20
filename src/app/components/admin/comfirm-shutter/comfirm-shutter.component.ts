import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../../config/constants';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatafilterUsers, DataMembers } from '../../../model/models';

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

// เพิ่ม interface สำหรับเก็บข้อมูลเพิ่มเติม
interface ExtendedDatafilterUsers extends DatafilterUsers {
  rejected_at?: string;
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
export class ComfirmShutterComponent implements OnInit {
  
  datauser: DataMembers[] = [];
  datafilterUsers: ExtendedDatafilterUsers[] = []; 

  refuse = 0;
  comfirm = 0;
  pending = 0;

  // สถานะ Tab ที่เลือก
  public selectedTab: 1 | 2 | 3 = 1;
  
  // สถานะ Modal
  public isDetailModal: boolean = false;
  public isRejectModal: boolean = false;
  
  // ผู้ใช้ที่ถูกเลือกสำหรับ Modal
  public selectedUserForDetail: ExtendedDatafilterUsers | null = null;
  public tempCriteria: Criteria = this.createDefaultCriteria();

  // ตัวแปรสำหรับเก็บ interval ของ countdown
  private countdownIntervals: { [userId: number]: any } = {};

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private Constants: Constants, 
    private snackBar: MatSnackBar
  ) {}

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
  }

  ngOnDestroy(): void {
    // ทำความสะอาด interval เมื่อ component ถูกทำลาย
    Object.values(this.countdownIntervals).forEach(interval => {
      clearInterval(interval);
    });
  }

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

  countUsersByType(): void {
    // นับจำนวนผู้ใช้ในแต่ละสถานะ
    this.pending = this.datafilterUsers.filter(user => user.sht_status === 1).length;
    this.comfirm = this.datafilterUsers.filter(user => user.sht_status === 2).length;
    this.refuse = this.datafilterUsers.filter(user => user.sht_status === 3).length;
  }

  public filterUsers(status: number): void {
    // อัพเดตสถานะ tab ที่เลือก
    switch(status) {
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
          rejected_at: undefined,
          countdownText: undefined,
          criteria: this.createDefaultCriteria()
        }));
        
        console.log("data datafilterUsers :", this.datafilterUsers);
        
        // นับจำนวนผู้ใช้ในแต่ละสถานะ
        this.countUsersByType();
        
        // เริ่ม countdown สำหรับผู้ใช้ที่ถูกปฏิเสธ
        this.datafilterUsers.forEach(user => {
          if (user.type_user === '3') {
            // สำหรับผู้ใช้ที่ถูกปฏิเสธ ให้ดึงข้อมูล rejected_at จาก API หรือใช้ค่าเริ่มต้น
            user.rejected_at = user.rejected_at || new Date().toISOString();
            this.startCountdown(user);
          }
        });
      },
      (error) => {
        console.error('Error fetching users:', error);
        this.snackBar.open('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'ปิด', { duration: 3000 });
      }
    );
  }

  // ฟังก์ชันหลักในการเปลี่ยนสถานะช่างภาพ
  public changeUserStatus(userId: number, newStatus: 2 | 3, criteria?: Criteria): void {
    const url = this.Constants.API_ENDPOINT + '/approveshutter/' + userId;
    const payload: any = {
      status: newStatus
    };

    // ถ้าเป็นการปฏิเสธ (status = 3) ให้เพิ่ม criteria และ rejected_at
    if (newStatus === 3 && criteria) {
      payload.criteria = criteria;
      payload.rejected_at = new Date().toISOString();
    }

    this.http.put(url, payload).subscribe(
      (response: any) => {
        console.log('Status updated successfully:', response);
        
        const message = newStatus === 2 ? 'อนุมัติช่างภาพสำเร็จ' : 'ปฏิเสธช่างภาพสำเร็จ';
        this.snackBar.open(message, 'ปิด', { duration: 2000 });
        
        // ปิด modal ถ้ามีเปิดอยู่
        this.closeAllModals();
        
        // รีเฟรชข้อมูล - ถ้าปฏิเสธให้ไปที่แท็บปฏิเสธ
        const targetTab = newStatus === 3 ? 3 : this.selectedTab;
        this.filterUsers(targetTab);
      },
      (error) => {
        console.error('Error updating status:', error);
        this.snackBar.open('เกิดข้อผิดพลาดในการอัพเดตสถานะ', 'ปิด', { duration: 3000 });
      }
    );
  }

  // ฟังก์ชันนับถอยหลัง
  public startCountdown(user: ExtendedDatafilterUsers): void {
    if (!user.rejected_at) return;

    // ล้าง interval เก่าถ้ามี
    if (this.countdownIntervals[user.user_id]) {
      clearInterval(this.countdownIntervals[user.user_id]);
    }

    this.countdownIntervals[user.user_id] = setInterval(() => {
      const now = new Date();
      const rejectedDate = new Date(user.rejected_at!);
      const target = new Date(rejectedDate.getTime());
      target.setDate(target.getDate() + 7); // เพิ่ม 7 วัน

      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        this.ngZone.run(() => {
          user.countdownText = 'หมดเวลา';
        });
        clearInterval(this.countdownIntervals[user.user_id]);
        delete this.countdownIntervals[user.user_id];
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      this.ngZone.run(() => {
        user.countdownText = `[ ${days} ] [${hours.toString().padStart(2, '0')} : ${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}]`;
      });
    }, 1000);
  }

  // ฟังก์ชันเปิด modal รายละเอียด
  openDetailDialog(user: ExtendedDatafilterUsers): void {
    this.selectedUserForDetail = user;
    this.tempCriteria = { ...(user.criteria || this.createDefaultCriteria()) };
    this.isDetailModal = true;
    this.isRejectModal = false;
  }

  // ฟังก์ชันเปิด modal การปฏิเสธ
  openRejectDialog(user: ExtendedDatafilterUsers): void {
    this.selectedUserForDetail = user;
    this.tempCriteria = this.createDefaultCriteria();
    this.isDetailModal = false;
    this.isRejectModal = true;
  }

  // ฟังก์ชันปิด modal ทั้งหมด
  closeAllModals(): void {
    this.isDetailModal = false;
    this.isRejectModal = false;
    this.selectedUserForDetail = null;
    this.tempCriteria = this.createDefaultCriteria();
  }

  // ฟังก์ชันอนุมัติช่างภาพ
  approveUser(userId: number): void {
    this.changeUserStatus(userId, 2);
  }

  // ฟังก์ชันปฏิเสธช่างภาพ (ใช้จาก modal)
  rejectUser(): void {
    if (!this.selectedUserForDetail) return;
    this.changeUserStatus(this.selectedUserForDetail.user_id, 3, this.tempCriteria);
  }

  // ฟังก์ชันนำทาง
  goToadd(): void {
    this.router.navigate(['/addmin']);
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
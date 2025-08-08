import { Component, OnInit } from '@angular/core';
import { DataMembers } from '../../../model/models';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Constants } from '../../../config/constants';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../service/auth.service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

export const slideInAnimation = trigger('slideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-10px)' }),
    animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('300ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' }))
  ])
]);


@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    RouterModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit{
  datashutter: DataMembers | null = null; // ✅ ถูกต้อง
  datauser: DataMembers[] = [];

  photographerReportForm!: FormGroup;
  submitted: boolean = false;

  reportForm!: FormGroup;
  photographerId: number | null = null;
  username_shutter: string | null = null;
  isSubmitting = false;
  alertMessage = '';
  alertType = '';
  showAlert = false;

    reasonOptions = [
    { value: '', label: 'กรุณาเลือกเหตุผล' },
    { value: 'พฤติกรรมไม่เหมาะสม', label: 'พฤติกรรมไม่เหมาะสม' },
    { value: 'งานไม่ตรงตามข้อตกลง', label: 'งานไม่ตรงตามข้อตกลง' },
    { value: 'คุณภาพงานไม่ดี', label: 'คุณภาพงานไม่ดี' },
    { value: 'มาสาย/ไม่มาทำงาน', label: 'มาสาย/ไม่มาทำงาน' },
    { value: 'เรียกเก็บเงินเพิ่ม', label: 'เรียกเก็บเงินเพิ่ม' },
    { value: 'การสื่อสารไม่ดี', label: 'การสื่อสารไม่ดี' },
    { value: 'การปฏิบัติตัวไม่เหมาะสม', label: 'การปฏิบัติตัวไม่เหมาะสม' },
    { value: 'อื่นๆ', label: 'อื่นๆ' }
  ];

   constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private Constants: Constants,
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {
    this.reportForm = this.fb.group({
      reason: ['', [Validators.required]],
      customReason: [''],
      details: ['', [Validators.required, Validators.minLength(20)]],
      truthConfirmation: [false, Validators.requiredTrue], 
    });
  }

  ngOnInit(): void {
    // รับ photographer_id จาก route parameters
   const state = history.state;
  this.photographerId = state.idshutter || null;
  this.username_shutter = state.username_shutter || null;

  if (state) {
    this.photographerId = state.idshutter || null;
    this.username_shutter = state.username_shutter || null;
  //   console.log('ID:', this.photographerId);
  //   console.log('ชื่อ:', this.username_shutter);
  }
    // ดึงข้อมูล user จาก AuthService (sessionStorage)
        const user = this.authService.getUser();
        if (user) {
        this.datauser = [user];
        // console.log('Received data:', this.datauser);
        // console.log('Received idshutter:', this.photographerId);
        // console.log('Received username_shutter:', this.username_shutter);
           } else {
          console.error("Error: User data not found in AuthService");
        }

    // ติดตามการเปลี่ยนแปลงของ reason dropdown
    this.reportForm.get('reason')?.valueChanges.subscribe(value => {
      const customReasonControl = this.reportForm.get('customReason');
      
      if (value === 'อื่นๆ') {
        customReasonControl?.setValidators([Validators.required, Validators.maxLength(100)]);
      } else {
        customReasonControl?.clearValidators();
        customReasonControl?.setValue('');
      }
      customReasonControl?.updateValueAndValidity();
      
    });
  }


   get isCustomReasonVisible(): boolean {
    return this.reportForm.get('reason')?.value === 'อื่นๆ';
  }

  // เพิ่ม getter
get truthConfirmationControl() {
  return this.reportForm.get('truthConfirmation');
}

  get reasonControl() {
    return this.reportForm.get('reason');
  }

  get customReasonControl() {
    return this.reportForm.get('customReason');
  }

  get detailsControl() {
    return this.reportForm.get('details');
  }

  showAlertMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;

    // ซ่อนข้อความหลังจาก 5 วินาที
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  onSubmit(): void {
     if (this.reportForm.valid) {
    this.isSubmitting = true;

    const formData = this.reportForm.value;
    const finalReason = formData.reason === 'อื่นๆ' ? formData.customReason : formData.reason;

    // console.log('เหตุผลที่เลือก:', finalReason);

    const reportData = {
      reporter_id: this.datauser[0].user_id,
      photographer_id: this.photographerId,
      reason: finalReason,
      details: formData.details,
      
    };

      // console.log('Report Data:', reportData);

      const apiUrl = `${this.Constants.API_ENDPOINT}/reportShutter`;
      // สำหรับการส่งข้อมูลจริง - uncomment และแก้ไขตาม API ของคุณ
      
     this.http.post(apiUrl, reportData).subscribe({
  next: (response) => {
    // console.log("Update success:", response);
    alert("ส่งรายงานเรียบร้อยแล้ว ทางระบบจะดำเนินการตรวจสอบต่อไป");
    this.router.navigate(['/homeshutter'], { 
        state: { 
          idshutter: this.photographerId
        } 
      });
  },
  error: (error) => {
    console.error("report error:", error);

    if (error.status === 400) {
      this.showSnackBar('คุณได้รายงานช่างภาพนี้ไปแล้ว ไม่สามารถรายงานซ้ำได้');
      this.router.navigate(['/homeshutter'], { 
        state: { 
          idshutter: this.photographerId
        } 
      });

    } else {
      this.showSnackBar('เกิดข้อผิดพลาดในการส่งรายงาน กรุณาลองใหม่อีกครั้ง');
    }
  }
});

    
    } else {
      this.showAlertMessage('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง', 'error');
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.reportForm.controls).forEach(key => {
      const control = this.reportForm.get(key);
      control?.markAsTouched();
    });
  }

   showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }


  goBack(): void {
   this.router.navigate(['/homeshutter'], { 
        state: {  
          idshutter: this.photographerId
        } 
      });
  }

  closeAlert(): void {
    this.showAlert = false;
  }
}

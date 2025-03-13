import { Component } from '@angular/core';
import { DataMembers } from '../../../model/models';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  datashutter: DataMembers | null = null; // ✅ ถูกต้อง
  datauser: DataMembers[] = [];

  photographerReportForm!: FormGroup;
  submitted: boolean = false;

  constructor(private route: ActivatedRoute,private formBuilder: FormBuilder,private router : Router){}

  ngOnInit() { 
    this.route.paramMap.subscribe(() => {                
      setTimeout(() => { // เพิ่ม setTimeout() เพื่อให้ state โหลดเสร็จก่อน
        this.datauser = window.history.state.datauser || [];
        this.datashutter = window.history.state.datashutter || null;
  
        console.log('✅ Received data:', this.datauser);
        console.log('✅ Received idshutter:', this.datashutter);
  
        // if (!this.data || this.data === 0) {
        //   console.error("❌ Error: datauser is undefined or missing");
        // }
        if (!this.datashutter) {
          console.error("❌ Error: idshutter is undefined or missing");
        }
  
        // this.getdatauser(this.datashutter); // เรียก API หลังจากแน่ใจว่าข้อมูลมาแล้ว
      }, 100);
    });
    this.initForm();
    this.setupFormListeners();
  }

  initForm(): void {
    this.photographerReportForm  = this.formBuilder.group({
      // ข้อมูลผู้รายงาน
      reporterName: ['', Validators.required],
      reporterEmail: ['', [Validators.required, Validators.email]],
      reporterPhone: [''],

      // ข้อมูลช่างภาพ
      photographerName: ['', Validators.required],

      // รายละเอียดการว่าจ้าง
      serviceType: ['', Validators.required],
      otherServiceType: [''],
      serviceDate: ['', Validators.required],
      serviceLocation: [''],
      servicePrice: [''],

      // รายละเอียดปัญหา
      problemType: ['', Validators.required],
      problemDescription: ['', Validators.required],

      // การดำเนินการ
      actionTaken: ['', Validators.required],
      expectation: [''],
      
      // อื่นๆ
      additionalInfo: [''],
      confirmInfo: [false, Validators.requiredTrue]
    });
  }

  setupFormListeners(): void {
    // ตรวจสอบการเปลี่ยนแปลงเมื่อเลือกประเภทงานเป็น "อื่นๆ"
    this.photographerReportForm.get('serviceType')?.valueChanges.subscribe((value: string) => {
      if (value === 'other') {
        this.photographerReportForm.get('otherServiceType')?.setValidators(Validators.required);
      } else {
        this.photographerReportForm.get('otherServiceType')?.clearValidators();
      }
      this.photographerReportForm.get('otherServiceType')?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.photographerReportForm.invalid) {
      return;
    }
    
    // ส่งข้อมูลฟอร์มไปยัง API
    console.log('Form submitted:', this.photographerReportForm.value);
    
    // แสดงข้อความขอบคุณ
    alert('ขอบคุณสำหรับการรายงาน เราได้รับข้อมูลของท่านเรียบร้อยแล้ว');
    
    // รีเซ็ตฟอร์ม
    this.photographerReportForm.reset();
    this.submitted = false;
  }

  resetForm(): void {
    this.photographerReportForm.reset();
    this.submitted = false;
    
    // ตั้งค่าเริ่มต้นสำหรับค่าที่ควรมีค่าเริ่มต้น
    this.photographerReportForm.patchValue({
      hasEvidence: 'no'
    });
  }

  // เพิ่มเมธอดสำหรับตรวจสอบความผิดพลาดของฟอร์ม
  get f() { 
    return this.photographerReportForm.controls; 
  }

  navigateHome() {
    this.router.navigate(['/'], { state: { data: this.datauser[0] } });  // ส่งข้อมูลผ่าน 'state'
  }

  out(){
    // 1. เคลียร์ข้อมูลใน LocalStorage หรือ SessionStorage
    localStorage.clear(); // หรือใช้ sessionStorage.clear()

    // 3. นำทางกลับไปที่หน้า Login
    this.router.navigate(['/login']).then(() => {
      window.location.reload(); // รีเฟรชหน้า เพื่อให้ UI โหลดใหม่
     });
 }

 profile(){
  const type = Number(this.datauser[0].type_user);
  console.log("ค่าของ type:", type, "| ประเภท:", typeof type); // ✅ ดูค่าที่แท้จริง
  if(type === 2 ){
    this.router.navigate(['/'], { state: { data: this.datauser[0] } });
  }
  this.router.navigate(['/profile'], { state: { data: this.datauser[0] } });
}
}

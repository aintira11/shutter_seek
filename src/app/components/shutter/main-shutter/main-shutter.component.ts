import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DataFollower, DataMembers, Datapackages, DataReview, DataShowWork } from '../../../model/models';
import { ActivatedRoute, Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';


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
  dataLogin:any
  data: any = {}; 
  datawork:DataShowWork[]=[]
  datareview:any[]=[]
  datafollower : DataFollower[] =[] ;
  datapackages : Datapackages[] = [];

  rating: number = 0; // ค่าเริ่มต้นของการให้คะแนน
  hoverRating = 0;
  stars = new Array(5).fill(0);

  showButton = false; // ซ่อนปุ่มก่อน
  isLoading: boolean = false;
  opened = true;
  constructor(private fb: FormBuilder,private router : Router,private route: ActivatedRoute,private Constants: Constants , private http: HttpClient){
    
   
  }
  async ngOnInit(): Promise<void> {

    // this.isLoading = true;
    // // ไม่ต้องรอให้เสร็จ ทำงานอื่นไปเลย
    // new Promise(resolve => setTimeout(resolve, 3500)).then(() => {
    // this.isLoading = false;
    // });
    // รับข้อมูลจากหน้าที่ส่งมา
    this.route.paramMap.subscribe(() => {
      const receivedData = window.history.state.data;
  
      // ตรวจสอบว่า receivedData เป็นอาร์เรย์และมีข้อมูลหรือไม่
      if (Array.isArray(receivedData) && receivedData.length > 0) {
        this.dataLogin = receivedData[0]; // ดึงข้อมูลจากอาร์เรย์ตำแหน่งแรก
      } else {
        this.dataLogin = receivedData; // ถ้าไม่ใช่อาร์เรย์ ใช้ค่าตามเดิม
      }
  
      console.log('Response form login :', this.dataLogin);
      this.getdatauser(this.dataLogin.user_id);
      
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
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/workAndPack/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datawork = response; 
      console.log("datawork :",this.datawork); 
      
    });
  }

  //ไว้ดูว่าใครไลค์บ้าง //ทำmodel
  getLikework(portfolio_id:number){
    const url = this.Constants.API_ENDPOINT+'/get/likes/'+portfolio_id;
    this.http.get(url).subscribe((response: any) => {
      this.datapackages = response; 
      console.log("datapackages :",this.datapackages); 
      
    });
  }

  getreview(id : number){
    const url = this.Constants.API_ENDPOINT+'/get/review/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datareview = response; 
      console.log("datareview :",this.datareview); 
      
    });
  }

  getpackages(id : number){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/packages/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datapackages = response; 
      console.log("datapackages :",this.datapackages); 
      
    });
  }

  getFollower(id : number){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/Follower/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datafollower = response; 
      console.log("datafollower :",this.datafollower); 
      
    });
  }

  getdatauser(id : number){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/read/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.data = response; 
      console.log("data User :",this.data); 
      this.getpackages(this.data[0].user_id);
      this.getwork(this.data[0].user_id);
      this.getFollower(this.data[0].user_id);
      this.getreview(this.data[0].user_id);
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
          this.router.navigate(['/editpac'], { state: { data: this.data[0]} });
        }
       
        goToEditProfile(): void {
          console.log('ข้อมูลที่ส่งไปหน้า แก้ไข :',this.data);
          this.router.navigate(['/editshutter'], { state: { data: this.data[0]} });
        }
        goToHomeShutter(){
         this.router.navigate(['/mainshutter'], { state: { data: this.data[0]} });
        }
        goToEditWork(){
          this.router.navigate(['/insertport'], { state: { data: this.data[0]} });
        }

        logout(){
          // 1. เคลียร์ข้อมูลใน LocalStorage หรือ SessionStorage
          localStorage.clear(); // หรือใช้ sessionStorage.clear();

          // 2. รีเซ็ตค่าตัวแปรที่เก็บข้อมูลของผู้ใช้
          this.data = []; // หรือให้เป็น null ตามโครงสร้างข้อมูล

          // 3. นำทางกลับไปที่หน้า Login
          this.router.navigate(['/login']).then(() => {
            window.location.reload(); // รีเฟรชหน้า เพื่อให้ UI โหลดใหม่
              
              });
    
            }
}

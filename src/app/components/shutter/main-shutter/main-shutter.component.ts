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
  datawork:DataShowWork[]=[]
  datareview:any[]=[]
  datafollower : DataFollow[] =[] ;
  datapackages : Datapackages[] = [];

  rating: number = 0; // ค่าเริ่มต้นของการให้คะแนน
  hoverRating = 0;
  stars = new Array(5).fill(0);

  showButton = false; // ซ่อนปุ่มก่อน
  isLoading: boolean = false;
  opened = true;
  isModelOpen: boolean = false;

  constructor(private fb: FormBuilder,
    private router : Router,
    private route: ActivatedRoute,
    private Constants: Constants , 
    private http: HttpClient
  ,private authService: AuthService){
    
   
  }

ngOnInit(): void {
  
    // ดึงข้อมูลจาก AuthService
   const user = this.authService.getUser();

     if (user) {
    this.data = [user];
    console.log("Loaded user from AuthService:", this.data);
        this.getpackages(user.user_id);
        this.getwork(user.user_id);
        this.getFollower(user.user_id);
        this.getreview(user.user_id);
  } else {
    console.warn(" No user found in AuthService. Redirecting to login...");
    this.router.navigate(['/login']);
    return;
  }


    
 
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

  // getdatauser(id : number){
  //   console.log('id',id);
  //   const url = this.Constants.API_ENDPOINT+'/read/'+id;
  //   this.http.get(url).subscribe((response: any) => {
  //     this.data = response; 
  //     console.log("data User :",this.data); 
  //     this.getpackages(this.data[0].user_id);
  //     this.getwork(this.data[0].user_id);
  //     this.getFollower(this.data[0].user_id);
  //     this.getreview(this.data[0].user_id);
  //   });
  // }
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
    
      // if (!this.data ) {
      //   console.error("Error: this.datauser is empty or undefined");
      //   return;
      // }
    
      this.router.navigate(['/roomchat'], { 
        // state: { 
        //   datauser: this.data, 
        // } 
      });
     }

     logout(): void {
      this.authService.logout();
      this.router.navigate(['/login']); // กลับไปหน้า login
}
}

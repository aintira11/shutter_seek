import { Component, OnInit,ElementRef, ViewChild, HostListener  } from '@angular/core';
import { DataFollower, DataLike, DataMembers, Datapackages, DataReview, DataShowWork } from '../../../model/models';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { lastValueFrom } from 'rxjs';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-home-shutter',
  standalone: true,
  imports: [CommonModule,MatCardModule, MatButtonModule,ReactiveFormsModule, MatMenuModule, MatIconModule],
  templateUrl: './home-shutter.component.html',
  styleUrl: './home-shutter.component.scss'
})
export class HomeShutterComponent implements OnInit{
  data: DataMembers | null = null; // ข้อมูลผู้ใช้
  datauser: DataMembers[] = [];   //ข้อมูลช่างภาพที่getออกมา
  datapackages : Datapackages[] = [];
  datawork : DataShowWork[] = [];
  datafollower : DataFollower[] =[] ;
  datareview:DataReview[]=[];
  idshutter : number = 0 ;
  Like :DataLike[]=[];

  rating: number = 0; // ค่าเริ่มต้นของการให้คะแนน
  hoverRating = 0;
  stars = new Array(5).fill(0);
  
  showButton = false; // ซ่อนปุ่มก่อน
  isModelOpen: boolean = false;  // สร้างตัวแปรสถานะเริ่มต้นโมเดลเป็นปิด
  isModelOpen_Success : boolean = false;
  isModelOpen_danger : boolean = false;

  reviewform: FormGroup;
  constructor(private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router : Router,
    private Constants: Constants, 
    private http: HttpClient,
    private authService: AuthService){

    // สร้างฟอร์มจาก FormBuilder
    this.reviewform = this.formBuilder.group({
      // reviewed_id: ['', [Validators.required]],
      comment: ['', Validators.required],
      // rating: [0, Validators.rating], // เพิ่ม rating ในฟอร์ม
    });
  }
  
  ngOnInit() { 
    this.route.paramMap.subscribe(() => {                
      setTimeout(() => { // เพิ่ม setTimeout() เพื่อให้ state โหลดเสร็จก่อน
        // this.data = window.history.state.datauser || [];
        this.idshutter = window.history.state.idshutter || null;
  
        // ดึงข้อมูล user จาก AuthService (sessionStorage)
        this.data = this.authService.getUser();
        console.log('Received data:', this.data);
        console.log('Received idshutter:', this.idshutter);
  
        
        if (!this.idshutter) {
          console.error("Error: idshutter is undefined or missing");
        }
  
        this.getdatashutter((String(this.idshutter))); // เรียก API หลังจากแน่ใจว่าข้อมูลมาแล้ว
      }, 100);
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
  back(){
  
  }
forfollow(shutterId: number) {
  const userId = (this.data as DataMembers).user_id;
  const url = this.Constants.API_ENDPOINT + '/Follow/' + userId + '/' + shutterId;

  this.http.post<{ success: boolean, message: string }>(url, {}).subscribe({
    next: (response) => {
      console.log(response.message); 
    },
    error: (error) => console.error("Follow/Unfollow error:", error)
  });
}

  rate(star: number) {
    this.rating = star;
  }

  hover(star: number) {
    this.hoverRating = star;
  }

  getdatashutter(id : string){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/read/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datauser = response; 
      console.log("data User :",this.datauser); 
      this.getpackages(this.datauser[0].user_id);
      this.getwork(this.datauser[0].user_id);
      this.getFollower(this.datauser[0].user_id);
      this.getreview(this.datauser[0].user_id);
    });
  }
  
  getLikework(portfolio_id:number){
    const url = this.Constants.API_ENDPOINT+'/get/likes/'+portfolio_id;
    this.http.get(url).subscribe((response: any) => {
      this.datapackages = response; 
      console.log("datapackages :",this.datapackages); 
      
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

  getwork(id : number){ //เพิ่มเอาคนที่ถูกใจออกมาด้วย
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/workAndPack/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datawork = response; 
      console.log("datawork :",this.datawork); 
      
    });
  }

  isFollowing = false;
  getFollower(id : number){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/Follower/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datafollower = response; 
      console.log("datafollower :",this.datafollower); 
      // ตรวจสอบว่าผู้ใช้ปัจจุบันติดตามช่างภาพคนนี้หรือไม่
    this.isFollowing = this.datafollower.some(f => f.follower_id === this.data?.user_id); 

    });
  }

toggleFollow(followedId: number) {
  this.forfollow(followedId); // call API
  setTimeout(() => {
    this.getFollower(followedId); // รีโหลดข้อมูลผู้ติดตามหลังจาก Follow/Unfollow
  }, 500); 
}


  getreview(id : number){
    const url = this.Constants.API_ENDPOINT+'/get/review/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datareview = response; 
      console.log("datareview :",this.datareview); 
      
    });
  }

  postreview() { 
    const userId = (this.data as DataMembers).user_id; //  บอกให้ TypeScript รู้ว่าเป็น Object
    const url = this.Constants.API_ENDPOINT + '/post/review/' + userId; 
    console.log(this.reviewform.value);  // แสดงค่าทั้งหมดในฟอร์ม
    console.log('Rating:', this.rating); // แสดงค่า rating ที่เลือก

    if (!this.reviewform.valid) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    try {
      // const formData = this.reviewform.value;
      const formData = {
        reviewed_id: this.datauser[0].user_id,
        comment: this.reviewform.value.comment,
        rating: this.rating, 
      };
  
      this.http.post(url, formData).subscribe({
        next: (res) => {
          console.log('respon:', res);
          this.isModelOpen = false;
          window.location.reload();
        },
        error: (err) => {
          console.error('Error:', err);
          alert(err.status === 409 ? 'เกิดข้อผิดพลาด' : 'กรุณาลองอีกครั้ง');
        }
      });
    } catch (error) {
      console.error('Review Failed:', error);
      alert('เกิดข้อผิดพลาดในการรีวิว');
    }
  }
  

  postreport(){

  }
 
//ยังไม่แก้
  profile(){
    const type = Number(this.data);
    console.log("ค่าของ type:", type, "| ประเภท:", typeof type); //  ดูค่าที่แท้จริง
    if(type === 2 ){
      this.router.navigate(['/'], { state: { data: this.data } });
    }
    this.router.navigate(['/profile'], { state: { data: this.data } });
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

  
  openModel() {
    // เปลี่ยนสถานะเป็นเปิดเพื่อให้โมเดลแสดง
    this.isModelOpen = true;
  }
  async closeModel() {
    // เปลี่ยนสถานะเป็นปิดเพื่อปิดโมเดล
    this.isModelOpen = false;
  }

  navigateHome() {
    this.router.navigate(['/'], { state: { data: this.data } });  // ส่งข้อมูลผ่าน 'state'
  }
  out(){
     // 1. เคลียร์ข้อมูลใน LocalStorage หรือ SessionStorage
     localStorage.clear(); // หรือใช้ sessionStorage.clear()

     // 3. นำทางกลับไปที่หน้า Login
     this.router.navigate(['/login']).then(() => {
       window.location.reload(); // รีเฟรชหน้า เพื่อให้ UI โหลดใหม่
      });
  }
  report(){
    console.log(" Sending data shutter:", this.datauser[0]);
    console.log(" Sending datauser:", this.data);
  
    if (!this.datauser[0]) {
      console.error(" Error: data shutter is undefined or invalid");
      return;
    }
    if (!this.datauser || this.datauser.length === 0) {
      console.error(" Error: this.datauser is empty or undefined");
      return;
    }
  
    this.router.navigate(['/reports'], { 
      state: { 
        datauser: this.data, 
        datashutter: this.datauser[0] 
      } 
    });
  }

  chat(id_shutter: number){
      console.log("Sending id_shutter:", id_shutter);
      // console.log(" Sending datauser:", this.data);
  
      if (!id_shutter) {
        console.error(" Error: id_shutter is undefined or invalid");
        return;
      }
      if (!this.datauser || this.datauser.length === 0) {
        console.error(" Error: this.datauser is empty or undefined");
        return;
      }
    
      this.router.navigate(['/roomchat'], { 
        state: { 
          // datauser: this.data, 
          idshutter: id_shutter 
        } 
      });
     }
}


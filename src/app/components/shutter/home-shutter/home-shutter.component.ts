import { Component, OnInit,ElementRef, ViewChild, HostListener  } from '@angular/core';
import { DataFollower, DataLike, DataMembers, Datapackages, DataReview, Datawork } from '../../../model/models';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-home-shutter',
  standalone: true,
  imports: [CommonModule,MatCardModule, MatButtonModule,ReactiveFormsModule],
  templateUrl: './home-shutter.component.html',
  styleUrl: './home-shutter.component.scss'
})
export class HomeShutterComponent implements OnInit{
  data: DataMembers | null = null; // ✅ ถูกต้อง
  datauser: DataMembers[] = [];
  datapackages : Datapackages[] = [];
  datawork : Datawork[] = [];
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
  constructor(private formBuilder: FormBuilder,private route: ActivatedRoute,private router : Router,private Constants: Constants , private http: HttpClient){
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
        this.data = window.history.state.datauser || [];
        this.idshutter = window.history.state.idshutter || null;
  
        console.log('✅ Received data:', this.data);
        console.log('✅ Received idshutter:', this.idshutter);
  
        // if (!this.data || this.data === 0) {
        //   console.error("❌ Error: datauser is undefined or missing");
        // }
        if (!this.idshutter) {
          console.error("❌ Error: idshutter is undefined or missing");
        }
  
        this.getdatauser(this.idshutter); // เรียก API หลังจากแน่ใจว่าข้อมูลมาแล้ว
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
    const userId = (this.data as DataMembers).user_id; // ✅ บอกให้ TypeScript รู้ว่าเป็น Object
    const url = this.Constants.API_ENDPOINT + '/Follow/' + userId + '/' + shutterId;
    this.http.post<{ success: boolean, message: string }>(url, {}).subscribe({
      next: async (response) => {
        if (response.message === "Unfollowed successfully") {
          
          this.isModelOpen_danger = true;
          await this.delay(2000);
          this.isModelOpen_danger = false;
          console.log("Unfollow success");
          
        } else {
          
          this.isModelOpen_Success = true;
          await this.delay(2000);
          this.isModelOpen_Success = false;
          console.log("Follow success");
          
          
        }
        window.location.reload();
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

  getdatauser(id : number){
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
    const url = this.Constants.API_ENDPOINT+'/get/work/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datawork = response; 
      console.log("datawork :",this.datawork); 
      
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

  getreview(id : number){
    const url = this.Constants.API_ENDPOINT+'/get/review/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datareview = response; 
      console.log("datareview :",this.datareview); 
      
    });
  }

  postreview() { 
    const userId = (this.data as DataMembers).user_id; // ✅ บอกให้ TypeScript รู้ว่าเป็น Object
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
 

  profile(){
    const type = Number(this.datauser[0].type_user);
    console.log("ค่าของ type:", type, "| ประเภท:", typeof type); // ✅ ดูค่าที่แท้จริง
    if(type === 2 ){
      this.router.navigate(['/'], { state: { data: this.datauser } });
    }
    this.router.navigate(['/profile'], { state: { data: this.datauser } });
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
}
//api -> /read/:User_Id
//       /get/packages/:user_id
//ผลงาน /get/work/:user_id
//รีวิว   
//ผู้ติดตาม /get/Follower/:followed_id

//ถ้า user_id ตรงกับข้อมูลในหน้านี้ที่แสดง ปุ่่มแก้ไขค่อยจะโผล่ 

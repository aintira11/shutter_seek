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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

declare var bootstrap: any;
@Component({
  selector: 'app-home-shutter',
  standalone: true,
  imports: [CommonModule,MatCardModule, 
    MatButtonModule,
    ReactiveFormsModule, 
    MatMenuModule, 
    MatIconModule,
  MatSnackBarModule],
  templateUrl: './home-shutter.component.html',
  styleUrl: './home-shutter.component.scss'
})
export class HomeShutterComponent implements OnInit{
  data: DataMembers[]=[]; // ข้อมูลผู้ใช้
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

  averageRating: number = 0; // ค่าเริ่มต้นของคะแนนเฉลี่ย
  Ratingstars: any[] = [];
  
  showButton = false; // ซ่อนปุ่มก่อน
  isModelOpen: boolean = false;  // สร้างตัวแปรสถานะเริ่มต้นโมเดลเป็นปิด
  isModelOpen_Success : boolean = false;
  isModelOpen_danger : boolean = false;

    currentSlideIndex: number[] = [];

  reviewform: FormGroup;
  constructor(private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router : Router,
    private Constants: Constants, 
    private http: HttpClient,
    private authService: AuthService,
  private snackBar: MatSnackBar,){

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
        const user = this.authService.getUser();
        if (user) {
        this.data = [user];
        console.log('Received data:', this.data);
        console.log('Received idshutter:', this.idshutter);
        this.getMyLike(user.user_id);
           } else {
          console.error("Error: User data not found in AuthService");
        }
        
        if (!this.idshutter) {
          console.error("Error: idshutter is undefined or missing");
        }
  
        this.getdatashutter((String(this.idshutter))); // เรียก API หลังจากแน่ใจว่าข้อมูลมาแล้ว
      }, 100);
    });
    
    // ตรวจสอบว่ามี Portfolio หรือไม่ ก่อนวนลูป
    if (this.datawork.length > 0) {
      this.datawork.forEach((_, index) => {
        this.currentSlideIndex[index] = 0;
      });
    }

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
  const userId = this.data[0].user_id;
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
    this.isFollowing = this.datafollower.some(f => f.follower_id === this.data[0].user_id); 

    });
  }

toggleFollow(followedId: number) {
  this.forfollow(followedId); // call API
  setTimeout(() => {
    this.getFollower(followedId); // รีโหลดข้อมูลผู้ติดตามหลังจาก Follow/Unfollow
  }, 200); 
}


  getreview(id : number){
    const url = this.Constants.API_ENDPOINT+'/get/review/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datareview = response; 
      console.log("datareview :",this.datareview); 
     // คำนวณคะแนนเฉลี่ย ทั้งหมด/จำนวนรีวิว
      const total = this.datareview.reduce((sum, r) => sum + r.rating, 0);
      this.averageRating = parseFloat((total / this.datareview.length).toFixed(1));
      
      // สร้าง array ของดาว
      this.generateStars();
    });
  }

  generateStars() {
    this.stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (this.averageRating >= i) {
        // ดาวเต็ม
        this.stars.push({ type: 'full', class: 'fas fa-star', color: 'full' });
      } else if (this.averageRating >= i - 0.5) {
        // ดาวครึ่ง
        this.stars.push({ type: 'half', class: 'fas fa-star-half-alt', color: 'half' });
      } else {
        // ดาวว่าง
        this.stars.push({ type: 'empty', class: 'far fa-star', color: 'empty' });
      }
    }
  }

  postreview() { 
    const userId = this.data[0].user_id; //  บอกให้ TypeScript รู้ว่าเป็น Object
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
  toShutter(id_shutter: number | null) {
      console.log("📤 Sending id_shutter:", id_shutter);
      // console.log("📤 Sending datauser:", this.datauser[0]);
    
      if (!id_shutter) {
        console.error(" Error: id_shutter is undefined or invalid");
        return;
      }
      if (!this.datauser || this.datauser.length === 0) {
        console.error(" Error: this.datauser is empty or undefined");
        
        return;
      }
    
      this.router.navigate(['/preshutter'], { 
        state: { 
          // datauser: this.datauser[0], 
          idshutter: id_shutter 
        }  
      });
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
        username_shutter:this.datauser[0].username,
        idshutter: this.datauser[0].user_id, 
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

     //new

     startAutoSlide(id: number): void {
    const carouselElement = document.getElementById('carousel' + id);
    const carousel = bootstrap.Carousel.getOrCreateInstance(carouselElement);
    carousel.cycle(); // Start auto sliding
  }

  stopAutoSlide(id: number): void {
    const carouselElement = document.getElementById('carousel' + id);
    const carousel = bootstrap.Carousel.getOrCreateInstance(carouselElement);
    carousel.pause(); // Stop auto sliding
  }

  getNext(portfolioIndex: number) {
  // if (this.Portfolio[portfolioIndex] && this.Portfolio[portfolioIndex].image_urls) {
    if (this.datawork[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.datawork[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndex[portfolioIndex] = (this.currentSlideIndex[portfolioIndex] + 1) % (maxIndex + 1);
  }
    
}

getPrev(portfolioIndex: number) {
  // if (this.Portfolio[portfolioIndex] && this.Portfolio[portfolioIndex].image_urls) {
    if (this.datawork[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.datawork[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndex[portfolioIndex] = (this.currentSlideIndex[portfolioIndex] - 1 + (maxIndex + 1)) % (maxIndex + 1);
  }
}

// ตรวจสอบว่าโพสนี้ถูกใจหรือไม่
isLiked(portfolioId: number | null): boolean {
  return this.Like.some(like => like.portfolio_id === portfolioId);
}

// method สำหรับการกดถูกใจ (ปรับปรุงจาก method เดิมของคุณ)
Liked(portfolioId: number | null) {
  const validPortfolioId = portfolioId ?? 0;
  if (validPortfolioId === 0) {
    console.error("Invalid portfolio_id!");
    return;
  }

  const userId = this.data?.[0]?.user_id ?? 0;
  if (userId === 0) {
    console.error("Invalid user_id!");
    return;
  }

  const url = `${this.Constants.API_ENDPOINT}/like/${validPortfolioId}/${userId}`;
  this.http.post(url, {}).subscribe({
    next: () => {
      console.log("Like/Unlike success");
      this.getMyLike(userId); // โหลดข้อมูลว่า user ไลค์อะไรบ้าง

      // 🔁 อัปเดตจำนวน like ใน datawork โดยตรง
      const targetWork = this.datawork.find(w => w.portfolio_id === validPortfolioId);
      if (targetWork) {
        // toggle like count (+1 หรือ -1)
        const isCurrentlyLiked = this.isLiked(validPortfolioId);
        targetWork.like_count = (targetWork.like_count ?? 0) + (isCurrentlyLiked ? -1 : 1);
      }
    },
    error: (error) => console.error("Like/Unlike error:", error)
  });
}


// method ดึงข้อมูลที่ถูกใจ (ปรับปรุงจาก method เดิมของคุณ)
getMyLike(id: number) {
  const url = this.Constants.API_ENDPOINT + '/get/like/' + id;
  this.http.get(url).subscribe((response: any) => {
    this.Like = response.map((item: any) => ({
      ...item,
      isLiked: true  // เพิ่ม isLiked = true
    }));
    console.log("data Like :", this.Like);
  }); 
}

 interresShutter() {
       this.authService.logout();
        this.router.navigate(['/shutter']); 
    }
      logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']); // กลับไปหน้า login
}
}


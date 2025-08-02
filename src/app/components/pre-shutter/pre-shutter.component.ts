import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Constants } from '../../config/constants';
import { AuthService } from '../../service/auth.service';
import { DataLike, DataMembers, DataPortfolioByPID } from '../../model/models';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

declare var bootstrap: any;

@Component({
  selector: 'app-pre-shutter',
  standalone: true,
  imports: [RouterModule,
      HttpClientModule,
    CommonModule
  ,MatSnackBarModule],
  templateUrl: './pre-shutter.component.html',
  styleUrl: './pre-shutter.component.scss'
})
export class PreShutterComponent implements OnInit,OnDestroy{
  @ViewChild('imageModalElement') imageModalElement!: ElementRef;

  private imageBootstrapModal: any; 
  datauser: DataMembers[]=[]; // ข้อมูลผู้ใช้
  portfolioData : DataPortfolioByPID| null = null; 
  PortfolioID: number | null = null; // ID ของ portfolio
  datalike: any[] = []; // ข้อมูลการถูกใจ (likes) ของ portfolio
  Like :DataLike[]=[]; // ข้อมูลการถูกใจของ user ปัจจุบัน

  // Gallery properties
  currentImageIndex: number = 0;
  touchStartX: number = 0;
  touchEndX: number = 0;

 modalImageUrls: string[] = [];
 modalSlideIndex: number = 0;

  constructor(private fb: FormBuilder,
      private Constants: Constants, 
      private route: ActivatedRoute, 
      private http: HttpClient,
      private router : Router,
      private authService: AuthService,
    private snackBar: MatSnackBar,) { 
    // Initialization logic can go here
  }
  ngOnInit(): void {
     this.route.paramMap.subscribe(() => {                
      setTimeout(() => { // เพิ่ม setTimeout() เพื่อให้ state โหลดเสร็จก่อน
        // this.data = window.history.state.datauser || [];
        this.PortfolioID = window.history.state.idshutter || null;
  
        // ดึงข้อมูล user จาก AuthService (sessionStorage)
        const user = this.authService.getUser();
       if (user) {
          this.datauser = [user];
          console.log("Loaded user from AuthService:", this.datauser);
          // โหลดข้อมูล Like ของ user หลังจากได้ user_id แล้ว
          this.getMyLike(user.user_id);
        } else {
          console.error("Error: User data not found in AuthService");
        }
        
        if (!this.PortfolioID) {
          console.error("Error: idshutter is undefined or missing");
        }
  
        this.getdatashutter((String(this.PortfolioID))); // เรียก API หลังจากแน่ใจว่าข้อมูลมาแล้ว
      }, 100);
    });
  }
   ngOnDestroy(): void {
    // Clean up event listeners if needed
  }



    getdatashutter(portfolio_id : string){
    console.log('id',portfolio_id);
    const url = `${this.Constants.API_ENDPOINT}/get/portfolioByportfolio_id/`+portfolio_id;
    this.http.get(url).subscribe((response: any) => {
      this.portfolioData = response; 
      console.log("data portfolio :",this.portfolioData); 
      
      // โหลดข้อมูล Like ของ portfolio นี้
      this.getLike(portfolio_id);
    });
  }

  
   getLike(portfolio_id : string){
    console.log('id',portfolio_id);
    const url = `${this.Constants.API_ENDPOINT}/get/likes/`+portfolio_id;
    this.http.get(url).subscribe((response: any) => {
      this.datalike = response; 
      console.log("data datalike :",this.datalike); 
      
    });
  }

  // ดึงข้อมูล Like ของ user ปัจจุบัน

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

// (เช็คจาก user_id ตรงกับ liker_id)
// ตรวจสอบว่าโพสนี้ถูกใจหรือไม่
isLiked(portfolioId?: number | null): boolean {
  return this.Like.some(like => like.portfolio_id === portfolioId);
}

  // การกดถูกใจ
Liked(portfolioId?: number | null) {
  const validPortfolioId = portfolioId ?? 0;
  if (validPortfolioId === 0) {
    console.error("Invalid portfolio_id!");
    return;
  }

  const userId = this.datauser?.[0]?.user_id ?? 0;
  if (userId === 0) {
    console.error("Invalid user_id!");
    this.showSnackBar('กรุณาเข้าสู่ระบบก่อนใช้งาน');
    return;
  }

  const url = `${this.Constants.API_ENDPOINT}/like/${validPortfolioId}/${userId}`;
  this.http.post(url, {}).subscribe({
    next: () => {
      console.log("Like/Unlike success");
      // ✅ โหลดข้อมูลของ user ว่าไลค์อะไรอยู่บ้าง
      this.getMyLike(userId);
      // ✅ โหลดข้อมูลทั้งหมดว่าใครไลค์งานนี้บ้าง
      this.getLike(validPortfolioId.toString());
    },
    error: (error) => console.error("Like/Unlike error:", error)
  });
}


//   showLikers = false;
//   toggleShowLikers() {
//   this.showLikers = !this.showLikers;
// }

// เพิ่ม method นี้ใน PreShutterComponent
getMinPrice(): number {
  if (!this.portfolioData?.packages || this.portfolioData.packages.length === 0) {
    return 0;
  }
  
  // หาค่าต่ำสุดจาก packages
  const prices = this.portfolioData.packages.map(pkg => pkg.price || 0);
  return Math.min(...prices);
}

// หรือถ้าต้องการให้ return string
getMinPriceString(): string {
  const minPrice = this.getMinPrice();
  return minPrice > 0 ? `฿${minPrice.toLocaleString()}` : 'ไม่ระบุราคา';
}
 // Lifecycle Hook ที่ถูกเรียกหลังจาก View ถูก Initialized แล้ว
ngAfterViewInit(): void {
  const element = this.imageModalElement?.nativeElement;
  if (element) {
    this.imageBootstrapModal = bootstrap.Modal.getOrCreateInstance(element);
  }
}

    // ฟังก์ชันสำหรับเปิด Modal แสดงรูปภาพเต็ม
openImageModal(images: string[], index: number): void {
  this.modalImageUrls = images;
  this.modalSlideIndex = index;

  const modalImageElement = this.imageModalElement.nativeElement.querySelector('#modalImage');
  if (modalImageElement) {
    modalImageElement.src = images[index];
  }

  if (this.imageBootstrapModal) {
    this.imageBootstrapModal.show(); 
  } else {
    console.warn("Modal not initialized yet!");
  }
}


nextModalImage() {
  if (this.modalImageUrls.length === 0) return;

  this.modalSlideIndex = (this.modalSlideIndex + 1) % this.modalImageUrls.length;
  const modalImageElement = this.imageModalElement.nativeElement.querySelector('#modalImage');
  if (modalImageElement) {
    modalImageElement.src = this.modalImageUrls[this.modalSlideIndex];
  }
}

prevModalImage() {
  if (this.modalImageUrls.length === 0) return;

  this.modalSlideIndex = (this.modalSlideIndex - 1 + this.modalImageUrls.length) % this.modalImageUrls.length;
  const modalImageElement = this.imageModalElement.nativeElement.querySelector('#modalImage');
  if (modalImageElement) {
    modalImageElement.src = this.modalImageUrls[this.modalSlideIndex];
  }
}


  // Gallery Methods
  get portfolioImages(): string[] {
    return this.portfolioData?.images || [];
  }

  get totalImages(): number {
    return this.portfolioImages.length;
  }

  get currentImage(): string {
    return this.portfolioImages[this.currentImageIndex] || '';
  }

  nextImage(): void {
    if (this.totalImages > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.totalImages;
    }
  }

  prevImage(): void {
    if (this.totalImages > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.totalImages) % this.totalImages;
    }
  }

  goToImage(index: number): void {
    if (index >= 0 && index < this.totalImages) {
      this.currentImageIndex = index;
    }
  }

  isActiveThumbnail(index: number): boolean {
    return index === this.currentImageIndex;
  }

get likerNames(): string {
  if (!this.datalike || this.datalike.length === 0) {
    return 'ยังไม่มีใครถูกใจ';
  }

  return this.datalike
    .map(user => user?.liker_name || 'ไม่ทราบชื่อ')
    .join(', ');
}

  // Keyboard navigation
@HostListener('document:keydown', ['$event'])
handleKeyboard(event: KeyboardEvent): void {
  // Check if modal is open
  if (this.imageBootstrapModal && this.imageBootstrapModal._isShown) {
    if (event.key === 'ArrowRight') {
      this.nextModalImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevModalImage();
    } else if (event.key === 'Escape') {
      this.imageBootstrapModal.hide();
    }
  } else {
    // Gallery navigation when modal is closed
    if (event.key === 'ArrowRight') {
      this.nextImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevImage();
    }
  }
}
  // Touch events for mobile
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const swipeDistance = this.touchEndX - this.touchStartX;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        this.prevImage();
      } else {
        this.nextImage();
      }
    }
  }

  
   toShutter(id_shutter?: number) {
      console.log("Sending id_shutter:", id_shutter);
      // console.log(" Sending datauser:", this.datauser[0]);
    
      if (!id_shutter) {
        console.error(" Error: id_shutter is undefined or invalid");
        return;
      }
      if (!this.datauser ) {
        console.error(" Error: this.datauser is empty or undefined");
        this.showSnackBar('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        return;
      }
    
      this.router.navigate(['/homeshutter'], { 
        state: { 
          // datauser: this.datauser[0], 
          idshutter: id_shutter 
        } 
      });
    }

    profile(typeuser : string){
      const type = typeuser;
      console.log("ค่าของ type:", type, "| ประเภท:", typeof type); // ✅ ดูค่าที่แท้จริง
      if(type === '2' ){
        this.router.navigate(['/'], { state: { data: this.datauser } });
      }else if (type === '3'){
          this.router.navigate(['/admin'],);
      }else{
        this.router.navigate(['/profile'], { state: { data: this.datauser } });
      }
      
    }

     showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

    chat(id_shutter: number | null) {
      console.log("Sending id_shutter:", id_shutter);
      // console.log(" Sending datauser:", this.data);
  
      if (!id_shutter) {
        console.error(" Error: id_shutter is undefined or invalid");
        return;
      }
      if (!this.portfolioData) {
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

       scrollTopack() {
    const rankElement = document.getElementById('second');
    if (rankElement) {
        rankElement.scrollIntoView({ behavior: 'smooth' });
    }
    }

     interresShutter() {
       this.authService.logout();
        this.router.navigate(['/shutter']); 
    }

  logout(): void {
  this.authService.logout();
  this.router.navigate(['/login']); // กลับไปหน้า login
}

  scroll(){
     const rankElement = document.getElementById('about');
      if (rankElement) {
          rankElement.scrollIntoView({ behavior: 'smooth' });
      }
  }

}



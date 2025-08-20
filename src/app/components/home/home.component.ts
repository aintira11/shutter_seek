import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { RouterModule,Router, RouterOutlet } from '@angular/router';
import { DataLike, DataMembers, DataPortfolio, DataSreach, DataTegs, DataTopten } from '../../model/models';
import { Constants } from '../../config/constants';
import { ActivatedRoute  } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import jsonData from '../../../assets/thai_provinces.json'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BShutter21Component } from '../shutter/b-shutter2-1/b-shutter2-1.component';

declare var bootstrap: any;
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule,
    HttpClientModule,
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
  BShutter21Component
    ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit , AfterViewInit{
   @ViewChild('imageModalElement') imageModalElement!: ElementRef;
  private imageBootstrapModal: any; 

  thaijson = jsonData
  data: any;
  datauser: DataMembers[] = [];
  Tags:DataTegs[]=[];
  Portfolio:DataTopten[]=[];
  PortfolioID:DataPortfolio[]=[];
  dataSreach:DataSreach []=[];
  form: FormGroup;
  Like :DataLike[]=[];
  

  // กำหนด index ของแต่ละ Portfolio ที่แสดง
  currentSlideIndex: number[] = [];
  currentSlideIndex1: number[] = [];
  currentSlideIndexSearch: number[]=[];

 modalImageUrls: string[] = [];
 modalSlideIndex: number = 0;
  showButton = false; 
  isLoading: boolean = false;
  isSearching: boolean = false; // ตัวแปรสำหรับควบคุม loading ตอนค้นหา
  hasSearched: boolean = false; // ตัวแปรสำหรับตรวจสอบว่ามีการค้นหาหรือไม่

    // เพิ่มตัวแปรสำหรับ pagination
  currentPage: number = 1;
  itemsPerPage: number = 4;
  totalPages: number = 0;
  paginatedPortfolio: any[] = [];

  constructor(private fb: FormBuilder,
    private Constants: Constants, 
    private route: ActivatedRoute, 
    private http: HttpClient,
    private router : Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,){
    this.form = this.fb.group({
      tags_id: [''],
      province: [''],
      price: [''],
      search: ['']
    });
}

ngOnInit(): void {
  // this.isLoading = true;
  // setTimeout(() => {
  //   this.isLoading = false;
  // }, 2000);

  // ดึงข้อมูลจาก AuthService
  const user = this.authService.getUser();
  if (user) {
    this.datauser = [user];
    // console.log("Loaded user from AuthService:", this.datauser);
    this.getMyLike(user.user_id);
  } else {
    console.warn(" No user found in AuthService. Redirecting to login...");
    this.router.navigate(['/']);
    this.gettegs();
    this.getPortfolio();
    return;
  }

  // โหลดข้อมูลหน้าแรก
  this.gettegs();
  this.getPortfolio();
  this.getPortfolioIfId(0);
  
    // ตรวจสอบว่ามี Portfolio หรือไม่ ก่อนวนลูป
    if (this.Portfolio) {
      this.Portfolio.forEach((_, index) => {
        this.currentSlideIndex[index] = 0;
      });
    }
  
    if (this.PortfolioID) {
      this.PortfolioID.forEach((_, index) => {
        this.currentSlideIndex1[index] = 0;
      });
    }
    if (this.dataSreach) {
      this.PortfolioID.forEach((_, index) => {
        this.currentSlideIndexSearch[index] = 0;
      });
    }

      //บังคับให้รอ
      // this.isLoading = true;
      // await this.delay(3500); // รอเวลา 5 วินาที
      // this.isLoading = false;
  }
  
  
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  
    // Lifecycle Hook ที่ถูกเรียกหลังจาก View ถูก Initialized แล้ว
ngAfterViewInit(): void {
  const element = this.imageModalElement?.nativeElement;
if (element) {
  this.imageBootstrapModal = bootstrap.Modal.getOrCreateInstance(element);
}
}

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
    // console.warn("Modal not initialized yet!");
  }
}

 @HostListener('window:scroll', [])
        onScroll() {
          this.showButton = window.scrollY > 300; // แสดงปุ่มเมื่อเลื่อนลงมาเกิน 300px
        }
      
        scrollToTop() {
          window.scrollTo({ top: 0, behavior: 'smooth' }); // เลื่อนไปบนสุดแบบ Smooth
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


 // ฟังก์ชันเพื่อไปยังภาพถัดไป (เลื่อนเฉพาะ portfolio ของตัวเอง)
getNext(portfolioIndex: number) {
  // if (this.Portfolio[portfolioIndex] && this.Portfolio[portfolioIndex].image_urls) {
    if (this.Portfolio[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.Portfolio[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndex[portfolioIndex] = (this.currentSlideIndex[portfolioIndex] + 1) % (maxIndex + 1);
  }
  if (this.PortfolioID[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.PortfolioID[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndex1[portfolioIndex] = (this.currentSlideIndex1[portfolioIndex] + 1) % (maxIndex + 1);
    console.log(this.currentSlideIndex1);
  }
    if (this.dataSreach[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.dataSreach[portfolioIndex].image_urls.length - 1;
    // +1 เพื่อไปภาพถัดไป และ mod ด้วยจำนวนภาพทั้งหมด
    this.currentSlideIndexSearch[portfolioIndex] = ( (this.currentSlideIndexSearch[portfolioIndex] || 0) + 1 ) % (maxIndex + 1);
    console.log(this.currentSlideIndexSearch);
  }

}

// ฟังก์ชันเพื่อไปยังภาพก่อนหน้า (เลื่อนเฉพาะ portfolio ของตัวเอง)
getPrev(portfolioIndex: number) {
  // if (this.Portfolio[portfolioIndex] && this.Portfolio[portfolioIndex].image_urls) {
    if (this.Portfolio[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.Portfolio[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndex[portfolioIndex] = (this.currentSlideIndex[portfolioIndex] - 1 + (maxIndex + 1)) % (maxIndex + 1);
  }
  if (this.PortfolioID[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.PortfolioID[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndex1[portfolioIndex] = (this.currentSlideIndex1[portfolioIndex] - 1 + (maxIndex + 1)) % (maxIndex + 1);
    console.log(this.currentSlideIndex1);
  }
 if (this.dataSreach[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.dataSreach[portfolioIndex].image_urls.length - 1;
    // -1 เพื่อกลับภาพก่อนหน้า (ถ้าน้อยกว่า 0 ให้วนกลับไปท้าย)
    this.currentSlideIndexSearch[portfolioIndex] = ((this.currentSlideIndexSearch[portfolioIndex] || 0) - 1 + (maxIndex + 1)) % (maxIndex + 1);
    console.log(this.currentSlideIndexSearch);
  }
}

  // getdatauser(id : number){
  //   console.log('id',id);
  //   const url = this.Constants.API_ENDPOINT+'/read/'+id;
  //   this.http.get(url).subscribe((response: any) => {
  //     this.datauser = response; 
  //     console.log("data User :",this.datauser); 
  //     this.getMyLike(this.datauser[0].user_id);
  //   });
  // }

  gettegs() {
    const url = this.Constants.API_ENDPOINT + '/tegs' ;
    this.http.get(url).subscribe((response: any) => {
      this.Tags = response;
      // console.log("data Tegs :", this.Tags);
    });
  }

  @ViewChild('tagList') tagList!: ElementRef;

    scrollTags(direction: string) {
        const scrollAmount = 200; // ปรับค่าการเลื่อน
        if (this.tagList) {
            const container = this.tagList.nativeElement;
            if (direction === 'left') {
                container.scrollLeft -= scrollAmount;
            } else {
                container.scrollLeft += scrollAmount;
            }
        }
    }
    getPortfolio(){
      this.isLoading = true;
      const url = this.Constants.API_ENDPOINT + '/get/portfolio/count' ;
      this.http.get(url).subscribe((response: any) => {
        this.Portfolio = response;
        this.currentSlideIndex = new Array(this.Portfolio.length).fill(0); // กำหนด index ให้ทุก portfolio
        // console.log("data Portfolio :", this.Portfolio);
      });
      setTimeout(() => {
    this.isLoading = false;
  }, 2000);
    }

  getPortfolioIfId(id: number) {
    // console.log('id:', id);
    this.currentPage = 1;
    const url = this.Constants.API_ENDPOINT + '/get/portfolio/' + id;
    this.http.get(url).subscribe((response: any) => {
      this.PortfolioID = response;
      
      // รีเซ็ตค่า index ของสไลด์ให้ตรงกับจำนวนของ Portfolio ที่เปลี่ยนไป
      this.currentSlideIndex1 = new Array(this.PortfolioID.length).fill(0);
      
      // คำนวณ pagination
      this.calculatePagination();
      
      // console.log("data PortfolioID:", this.PortfolioID);
    });
  }

  // ฟังก์ชันคำนวณ pagination
  calculatePagination() {
    this.totalPages = Math.ceil(this.PortfolioID.length / this.itemsPerPage);
    this.updatePaginatedData();
  }

  // ฟังก์ชันอัพเดทข้อมูลที่จะแสดงในหน้าปัจจุบัน
  updatePaginatedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPortfolio = this.PortfolioID.slice(startIndex, endIndex);
  }

  // ฟังก์ชันไปหน้าถัดไป
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  // ฟังก์ชันไปหน้าก่อนหน้า
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  // ฟังก์ชันไปหน้าที่ระบุ
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }
    goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // ฟังก์ชันสำหรับสร้าง array ของหมายเลขหน้า
  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

 getDisplayRange(): { start: number; end: number; total: number } {
  const start = (this.currentPage - 1) * this.itemsPerPage + 1;
  const end = Math.min(this.currentPage * this.itemsPerPage, this.PortfolioID.length);
  const total = this.PortfolioID.length;
  
  return { start, end, total };
}
    
sreach() {
    
    // [1] ตั้งค่าสถานะต่างๆ ก่อนเริ่มค้นหา
    this.isSearching = true;
    this.hasSearched = true; 
    this.dataSreach = [];

    // [2] ส่วนของการสร้าง URL สำหรับเรียก API 
    const params: any = {};
    const tags_id = this.form.value.tags_id;
    const province = this.form.value.province;
    const price = this.form.value.price;
    const search = this.form.value.search;
    
    if (tags_id) params.tags_id = tags_id;
    if (province) params.province = province;
    if (price) params.price = price;
    if (search) params.search = search;
    
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.Constants.API_ENDPOINT}/search/photographers?${queryString}`;

    // [3] เรียก API และจัดการสถานะ Loading ภายใน subscribe
    this.http.get(url).subscribe({
      next: (response: any) => {
        // ทำงานเมื่อ API ส่งข้อมูลกลับมาสำเร็จ
        this.dataSreach = response;
        // console.log("ผลลัพธ์ที่ค้นหา:", response);
  
      },
      error: (err) => {
        // ทำงานเมื่อเกิดข้อผิดพลาด
        console.error('API Error:', err);
        this.showSnackBar('เกิดข้อผิดพลาดในการค้นหา');
        this.isSearching = false; // <-- ซ่อน Loading แม้จะเกิด error
      },
    complete: () => {
      setTimeout(() => {
    this.isSearching = false;
    if (this.dataSreach.length > 0) {
      this.showSnackBar('พบผลลัพธ์ ' + this.dataSreach.length + ' รายการ');
      // ให้ Angular วาดผลลัพธ์เสร็จก่อน แล้วค่อยเลื่อน
      setTimeout(() => {
        const rankElement = document.getElementById('search');
        if (rankElement) {
          rankElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100); // ดีเลย์ 0.1 วินาที
    } else {
      this.showSnackBar('ไม่พบผลลัพธ์ที่ค้นหา');
      setTimeout(() => {
        const rankElement = document.getElementById('third');
        if (rankElement) {
          rankElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, 1000);
  console.log('การค้นหาเสร็จสิ้น');
}
      
    });
}

    profile(typeuser : string){
      const type = typeuser;
      
      if(type === '2' ){
        this.router.navigate(['/'], { state: { data: this.datauser } });
      }else if (type === '3'){
          this.router.navigate(['/admin'],);
      }else{
        this.router.navigate(['/profile'], { state: { data: this.datauser } });
      }
      
    }

// ตรวจสอบว่าโพสนี้ถูกใจหรือไม่
isLiked(portfolioId: number | null): boolean {
  return this.Like.some(like => like.portfolio_id === portfolioId);
}

// method สำหรับการกดถูกใจ 
Liked(portfolioId: number | null) {
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
      // หลังจากเรียก API สำเร็จ ให้โหลดข้อมูล Like ใหม่
      this.getMyLike(userId);
    },
    error: (error) => console.error("Like/Unlike error:", error)
  });
}

// method ดึงข้อมูลที่ถูกใจ 
getMyLike(id: number) {
  const url = this.Constants.API_ENDPOINT + '/get/like/' + id;
  this.http.get(url).subscribe((response: any) => {
    this.Like = response.map((item: any) => ({
      ...item,
      isLiked: true  // เพิ่ม isLiked = true
    }));
    // console.log("data Like :", this.Like);
  }); 
}

    toShutter(id_shutter: number | null) {
      // console.log("📤 Sending id_shutter:", id_shutter);
      // console.log("📤 Sending datauser:", this.datauser[0]);
    
      if (!id_shutter) {
        console.error(" Error: id_shutter is undefined or invalid");
        return;
      }
      if (!this.datauser || this.datauser.length === 0) {
        console.error(" Error: this.datauser is empty or undefined");
        this.showSnackBar('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        return;
      }
    
      this.router.navigate(['/preshutter'], { 
        state: { 
          // datauser: this.datauser[0], 
          idshutter: id_shutter 
        }  
      });
    }

    showSnackBar(message: string) {
    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  scroll(){
     const rankElement = document.getElementById('about');
      if (rankElement) {
          rankElement.scrollIntoView({ behavior: 'smooth' });
      }
  }
  scrollsearch(){
     const rankElement = document.getElementById('search');
      if (rankElement) {
          rankElement.scrollIntoView({ behavior: 'smooth' });
      }
  }
    
    testShutter(id: number) {
      // console.log(" Clicked photographer ID:", id);
      this.toShutter(id);
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

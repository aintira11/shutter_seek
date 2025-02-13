import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterModule,Router } from '@angular/router';
import { DataLike, DataMembers, DataPortfolio, DataSreach, DataTegs } from '../../model/models';
import { Constants } from '../../config/constants';
import { ActivatedRoute,Params  } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import jsonData from '../../../assets/thai_provinces.json'
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule,
    HttpClientModule,
    CommonModule,
    ReactiveFormsModule,
    
    ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{
  
  thaijson = jsonData
  data: any;
  datauser: DataMembers[] = [];
  Tags:DataTegs[]=[];
  Portfolio:DataPortfolio[]=[];
  PortfolioID:DataPortfolio[]=[];
  dataSreach:DataSreach []=[];
  form: FormGroup;
  Like :DataLike[]=[];
  

  // กำหนด index ของแต่ละ Portfolio ที่แสดง
  currentSlideIndex: number[] = [];
  currentSlideIndex1: number[] = [];
  currentSlideIndexSearch: number[]=[];
  

  constructor(private fb: FormBuilder,private Constants: Constants, private route: ActivatedRoute, private http: HttpClient,private router : Router){
    this.form = this.fb.group({
      tags_id: [''],
      province: [''],
      price: [''],
      search: ['']
    });
    // กำหนดให้ทุก Portfolio เริ่มต้น index ของการแสดงที่ 0
    // this.Portfolio.forEach(() => this.currentSlideIndex.push(0));
    // this.PortfolioID.forEach(() => this.currentSlideIndex1.push(0));
  }

  ngOnInit(): void {
    // รับข้อมูลจากหน้าที่ส่งมา
    this.route.paramMap.subscribe(() => {
      const receivedData = window.history.state.data;
  
      // ตรวจสอบว่า receivedData เป็นอาร์เรย์และมีข้อมูลหรือไม่
      if (Array.isArray(receivedData) && receivedData.length > 0) {
        this.data = receivedData[0]; // ดึงข้อมูลจากอาร์เรย์ตำแหน่งแรก
      } else {
        this.data = receivedData; // ถ้าไม่ใช่อาร์เรย์ ใช้ค่าตามเดิม
      }
  
      console.log('Response1:', this.data);
  
      if (this.data?.user_id) {
        this.getdatauser(this.data.user_id);
      }
  
      console.log("Calling gettegs()");
      this.gettegs();
      this.getPortfolio();
      
    });
  
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
  }

  isLiked(portfolio_id: number): boolean {
    return this.Like.some(like => like.portfolio_id === portfolio_id);
  }
  
  
   
  // ฟังก์ชันสำหรับการแสดงภาพปัจจุบัน
//   getSlide(index: number, portfolioIndex: number) {
//     const image = this.Portfolio[portfolioIndex]?.image_urls?.[index];
//     console.log("Slide Image URL:", image);
//     return image;
//  }
 
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
    if (this.dataSreach[portfolioIndex] && this.dataSreach[portfolioIndex].image_urls) {
    const maxIndex = this.dataSreach[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndexSearch[portfolioIndex] = (this.currentSlideIndexSearch[portfolioIndex] - 1 + maxIndex + 1) % (maxIndex + 1);
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
    this.currentSlideIndexSearch[portfolioIndex] = (this.currentSlideIndexSearch[portfolioIndex] - 1 + (maxIndex + 1)) % (maxIndex + 1);
    console.log(this.currentSlideIndexSearch);
  }
}

  getdatauser(id : number){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/read/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datauser = response; 
      console.log("data User :",this.datauser); 
      this.getMyLike(this.datauser[0].user_id);
    });
  }

  gettegs() {
    const url = this.Constants.API_ENDPOINT + '/tegs' ;
    this.http.get(url).subscribe((response: any) => {
      this.Tags = response;
      console.log("data Tegs :", this.Tags);
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
      const url = this.Constants.API_ENDPOINT + '/get/portfolio' ;
      this.http.get(url).subscribe((response: any) => {
        this.Portfolio = response;
        this.currentSlideIndex = new Array(this.Portfolio.length).fill(0); // กำหนด index ให้ทุก portfolio
        console.log("data Portfolio :", this.Portfolio);
      });
    }

    getPortfolioIfId(id: number) {
      console.log('id:', id);
      const url = this.Constants.API_ENDPOINT + '/get/portfolio/' + id;
      this.http.get(url).subscribe((response: any) => {
        this.PortfolioID = response;
    
        // รีเซ็ตค่า index ของสไลด์ให้ตรงกับจำนวนของ Portfolio ที่เปลี่ยนไป
        this.currentSlideIndex1 = new Array(this.PortfolioID.length).fill(0);
    
        console.log("data PortfolioID:", this.PortfolioID);
      });
    }
    
    sreach() {
      const params: any = {}; // สร้าง object เก็บค่า query params
    
      // ดึงค่าจากฟอร์ม
      const tags_id = this.form.value.tags_id;
      const province = this.form.value.province;
      const price = this.form.value.price;
      const search = this.form.value.search;
    
      // ใส่ค่าเฉพาะที่ผู้ใช้กรอกลงไปใน params object
      if (tags_id) params.tags_id = tags_id;
      if (province) params.province = province;
      if (price) params.price = price;
      if (search) params.search = search;
    
      // แปลง object เป็น query string
      const queryString = new URLSearchParams(params).toString();
    
      // เรียก API พร้อม query parameters
      const url = `${this.Constants.API_ENDPOINT}/search/photographers?${queryString}`;
      this.http.get(url).subscribe((response: any) => {
        this.dataSreach = response;
        console.log("ผลลัพธ์ที่ค้นหา:", response);
      });
    }
    profile(){
      const type = Number(this.datauser[0].type_user);
      console.log("ค่าของ type:", type, "| ประเภท:", typeof type); // ✅ ดูค่าที่แท้จริง
      if(type === 2 ){
        this.router.navigate(['/'], { state: { data: this.datauser } });
      }
      this.router.navigate(['/profile'], { state: { data: this.datauser } });
    }

    Liked(portfolioId: number | null) {
      const validPortfolioId = portfolioId ?? 0;
      if (validPortfolioId === 0) {
        console.error("Invalid portfolio_id!");
        return;
      }
    
      const userId = this.datauser?.[0]?.user_id ?? 0;
      if (userId === 0) {
        console.error("Invalid user_id!");
        return;
      }

        const url = `${this.Constants.API_ENDPOINT}/like/${validPortfolioId}/${userId}`;
        this.http.post(url, {}).subscribe({
          next: () => {
            console.log("Unlike success");
  
          },
          error: (error) => console.error("Unlike error:", error)
        });

      
    }
    

    getMyLike(portfolioId: number) {
      const userId = this.datauser?.[0]?.user_id ?? 0;
      if (userId === 0) {
        console.error("Invalid user_id!");
        return;
      }
    
      const url = `${this.Constants.API_ENDPOINT}/get/like/${portfolioId}`;
      this.http.get(url).subscribe((response: any) => {
        this.Like = response;
        
        // ตรวจสอบว่าผู้ใช้เคยกดถูกใจ portfolio นี้หรือไม่
        // this.likeStatus = this.Like.some((like: any) => like.user_id === userId);
      
       
      });
    }
    
}

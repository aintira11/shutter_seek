import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterModule,Router } from '@angular/router';
import { DataMembers, DataPortfolio, DataTegs } from '../../model/models';
import { Constants } from '../../config/constants';
import { ActivatedRoute,Params  } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule,
    HttpClientModule,
    CommonModule,
    
    ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{
  
  data: any;
  datauser: DataMembers[] = [];
  Tags:DataTegs[]=[];
  Portfolio:DataPortfolio[]=[];

  // กำหนด index ของแต่ละ Portfolio ที่แสดง
  currentSlideIndex: number[] = [];

  constructor(private Constants: Constants, private route: ActivatedRoute, private http: HttpClient,private router : Router){

    // กำหนดให้ทุก Portfolio เริ่มต้น index ของการแสดงที่ 0
    this.Portfolio.forEach(() => this.currentSlideIndex.push(0));
    
  }

  ngOnInit(): void {
    //รับข้อมูล จากหน้าที่ส่งมา 
    this.route.paramMap.subscribe(() => {
      this.data =window.history.state.data;
      console.log('Response:', this.data);
        // this.printdata();
        if (this.data?.user_id) { // เช็กว่ามี user_id หรือไม่
          this.getdatauser(this.data.user_id);
        }

        console.log("Calling gettegs()");
        this.gettegs();
        this.getPortfolio();
      });
  } 
  // ฟังก์ชันสำหรับการแสดงภาพปัจจุบัน
  getSlide(index: number, portfolioIndex: number) {
    const image = this.Portfolio[portfolioIndex]?.image_urls?.[index];
    console.log("Slide Image URL:", image);
    return image;
 }
 
 // ฟังก์ชันเพื่อไปยังภาพถัดไป (เลื่อนเฉพาะ portfolio ของตัวเอง)
getNext(portfolioIndex: number) {
  if (this.Portfolio[portfolioIndex] && this.Portfolio[portfolioIndex].image_urls) {
    const maxIndex = this.Portfolio[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndex[portfolioIndex] = (this.currentSlideIndex[portfolioIndex] + 1) % (maxIndex + 1);
  }
}

// ฟังก์ชันเพื่อไปยังภาพก่อนหน้า (เลื่อนเฉพาะ portfolio ของตัวเอง)
getPrev(portfolioIndex: number) {
  if (this.Portfolio[portfolioIndex] && this.Portfolio[portfolioIndex].image_urls) {
    const maxIndex = this.Portfolio[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndex[portfolioIndex] = (this.currentSlideIndex[portfolioIndex] - 1 + (maxIndex + 1)) % (maxIndex + 1);
  }
}

  getdatauser(id : number){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/read/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datauser = response; 
      console.log("Image User :",this.datauser); 
    });
  }

  gettegs() {
    const url = this.Constants.API_ENDPOINT + '/admin/tegs' ;
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
      const url = this.Constants.API_ENDPOINT + '/shutter/get/portfolio' ;
      this.http.get(url).subscribe((response: any) => {
        this.Portfolio = response;
        this.currentSlideIndex = new Array(this.Portfolio.length).fill(0); // กำหนด index ให้ทุก portfolio
        console.log("data Portfolio :", this.Portfolio);
      });
    }

    
}

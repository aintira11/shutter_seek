import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataLike, DataMembers } from '../../../model/models';
import { CommonModule } from '@angular/common';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit{
  data: DataMembers[]=[];
  currentSlideIndex: number[] = [];
  Like :DataLike[]=[];
  Follow:[]=[];
 
  constructor(private router : Router, private route: ActivatedRoute,private Constants: Constants, private http: HttpClient){}
  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.data=window.history.state.data;
      // const receivedData =window.history.state.data;

       // ตรวจสอบว่า receivedData เป็นอาร์เรย์และมีข้อมูลหรือไม่
      //  if (Array.isArray(receivedData) && receivedData.length > 0) {
      //   this.data = receivedData[0]; // ดึงข้อมูลจากอาร์เรย์ตำแหน่งแรก
      // } else {
      //   this.data = receivedData; // ถ้าไม่ใช่อาร์เรย์ ใช้ค่าตามเดิม
      // }
      console.log('Response:', this.data);
        // this.printdata();
        if (this.data[0]) { // เช็กว่ามี user_id หรือไม่
          //this.getdatauser(this.data.user_id);
          console.log("datauser",this.data);
        }

      });
      this.Like.forEach((_, index) => {
        this.currentSlideIndex[index] = 0;
      });
      this.getMyLike(this.data[0].user_id );
      this.getfollow(this.data[0].user_id);
  }
   // ฟังก์ชันเพื่อไปยังภาพถัดไป (เลื่อนเฉพาะ portfolio ของตัวเอง)
getNext(portfolioIndex: number) {
  if (this.Like[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.Like[portfolioIndex].image_urls.length - 1;
    // +1 เพื่อไปภาพถัดไป และ mod ด้วยจำนวนภาพทั้งหมด
    this.currentSlideIndex[portfolioIndex] = ( (this.currentSlideIndex[portfolioIndex] || 0) + 1 ) % (maxIndex + 1);
    console.log(this.currentSlideIndex);
}
}
getPrev(portfolioIndex: number) {
 if (this.Like[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.Like[portfolioIndex].image_urls.length - 1;
    // -1 เพื่อกลับภาพก่อนหน้า (ถ้าน้อยกว่า 0 ให้วนกลับไปท้าย)
    this.currentSlideIndex[portfolioIndex] = ((this.currentSlideIndex[portfolioIndex] || 0) - 1 + (maxIndex + 1)) % (maxIndex + 1);
    console.log(this.currentSlideIndex);
  }
}

  goToEditPro(): void {
    this.router.navigate(['/edituser'],{ state: { data: this.data } });
  }
  goToShutter(): void {
    this.router.navigate(['']);
  }

  back(){
    this.router.navigate([''],{ state: { data: this.data } });
  }
  tofollow(){
    this.router.navigate(['/tofollow'],{ state: { data: this.data } });
  }

  cancelEdit(){
    this.router.navigate(['/profile'],{ state: { data: this.data } });
  }

getMyLike(id: number) {
  const url = this.Constants.API_ENDPOINT + '/get/like/' + id;
  this.http.get(url).subscribe((response: any) => {
    this.Like = response.map((item: any) => ({
      ...item,
      isLiked: true  // เพิ่ม isLiked = true
    }));
    console.log("data Tegs :", this.Like);
  });
}

likeCancel(portfolioId: number | null) {
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
            console.log("Unlike success");
  
          },
          error: (error) => console.error("Unlike error:", error)
        });
  
    }


  getfollow(id : number){
    const url = this.Constants.API_ENDPOINT + '/get/follow/'+ id;
    this.http.get(url).subscribe((response: any) => {
      this.Follow = response;
      console.log("data Tegs :", this.Follow);
    });
  }
}

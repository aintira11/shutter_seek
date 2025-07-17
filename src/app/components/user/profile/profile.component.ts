import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DataLike, DataMembers } from '../../../model/models';
import { CommonModule } from '@angular/common';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'
import { AuthService } from '../../../service/auth.service'; 
import {MatButtonModule} from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule,FormsModule,MatButtonModule,MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit{
  data: DataMembers[]=[];
  currentSlideIndex: number[] = [];
  Like :DataLike[]=[];
  Follow:[]=[];
 
    constructor(
    private router: Router,
    private Constants: Constants,
    private http: HttpClient,
    private authService: AuthService // inject AuthService
  ) {}
    ngOnInit(): void {
    // ดึงข้อมูลจาก AuthService
    const user = this.authService.getUser();
    if (!user) {
      console.error("ไม่พบข้อมูลผู้ใช้ใน AuthService");
      return;
    }

    this.data = [user];
    console.log("🔐 ผู้ใช้:", this.data);

    this.getMyLike(this.data[0].user_id);
    this.getFollow(this.data[0].user_id);
    this.Like.forEach((_, index) => {
      this.currentSlideIndex[index] = 0;
    });
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
    this.router.navigate(['/edituser']);
    // this.router.navigate(['/edituser'],{ state: { data: this.data } });
  }
  goToShutter(): void {
    this.router.navigate(['/mainshutter']);
  }

  back(){
     this.router.navigate(['']);
    // this.router.navigate([''],{ state: { data: this.data } });
  }
  tofollow(){
     this.router.navigate(['/tofollow']);
    // this.router.navigate(['/tofollow'],{ state: { data: this.data } });
  }

  cancelEdit(){
    this.router.navigate(['/profile']);
    // this.router.navigate(['/profile'],{ state: { data: this.data } });
  }

getMyLike(id: number) {
  const url = `${this.Constants.API_ENDPOINT}/get/like/${id}`;
  this.http.get(url).subscribe((response: any) => {
    this.Like = response.map((item: any) => ({
      ...item,
      isLiked: true  // เพิ่ม isLiked = true
    }));
    console.log("สิ่งที่ถูกใจ :", this.Like);
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
            // this.getMyLike(this.data.user_id);
          },
          error: (error) => console.error("Unlike error:", error)
        });
  
    }

    toShutter(id_shutter: number | null) {
      console.log("📤 Sending id_shutter:", id_shutter);
      // console.log("📤 Sending datauser:", this.datauser[0]);
    
      if (!id_shutter) {
        console.error(" Error: id_shutter is undefined or invalid");
        return;
      }
      
      this.router.navigate(['/preshutter'], { 
        state: { 
          // datauser: this.datauser[0], 
          idshutter: id_shutter 
        } 
      });
    }


 getFollow(id: number) {
    const url = `${this.Constants.API_ENDPOINT}/get/follow/${id}`;
    this.http.get(url).subscribe((res: any) => {
      this.Follow = res;
      console.log("👥 รายการติดตาม:", this.Follow);
    });
  }
}

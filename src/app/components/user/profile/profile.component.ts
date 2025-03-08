import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataLike, DataMembers } from '../../../model/models';
import { CommonModule } from '@angular/common';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
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
      this.data =window.history.state.data;
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
      this.getMyLike(this.data[0].user_id);
      this.getfollow(this.data[0].user_id);
  }
   // ฟังก์ชันเพื่อไปยังภาพถัดไป (เลื่อนเฉพาะ portfolio ของตัวเอง)
getNext(portfolioIndex: number) {
  if (this.Like[portfolioIndex] && this.Like[portfolioIndex].image_urls) {
    // if (this.Like[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.Like[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndex[portfolioIndex] = (this.currentSlideIndex[portfolioIndex] + 1) % (maxIndex + 1);
  }
}

getPrev(portfolioIndex: number) {
  if (this.Like[portfolioIndex] && this.Like[portfolioIndex].image_urls) {
    // if (this.Like[portfolioIndex]?.image_urls?.length > 0) {
    const maxIndex = this.Like[portfolioIndex].image_urls.length - 1;
    this.currentSlideIndex[portfolioIndex] = (this.currentSlideIndex[portfolioIndex] - 1 + (maxIndex + 1)) % (maxIndex + 1);
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

  getMyLike(id : number){
    const url = this.Constants.API_ENDPOINT + '/get/like/'+ id;
    this.http.get(url).subscribe((response: any) => {
      this.Like = response;
      console.log("data Tegs :", this.Like);
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

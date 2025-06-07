import { Component, OnInit } from '@angular/core';
import { DataFollow, DataMembers } from '../../../model/models';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../../config/constants';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-follow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-follow.component.html',
  styleUrl: './user-follow.component.scss'
})
export class UserFollowComponent implements OnInit{
  
  data: DataMembers[]=[];
  Follow: DataFollow[]=[];
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
      this.getfollow(this.data[0].user_id);
  }

  getfollow(id : number){
    const url = this.Constants.API_ENDPOINT + '/get/follow/'+ id;
    this.http.get(url).subscribe((response: any) => {
      this.Follow = response;
      console.log("data getfollow :", this.Follow);
    });
  }

  back(){
    this.router.navigate([''],{ state: { data: this.data } });
  }

  unfollow(id : number){
    const userId = this.data?.[0]?.user_id ?? 0;
      if (userId === 0) {
        console.error("Invalid user_id!");
        return;
      }
    const url = this.Constants.API_ENDPOINT + '/Follow/'+ userId +'/'+id;
    this.http.post(url, {}).subscribe({
      next: () => {
        console.log("UnFollow success");
        this.router.navigate(['/tofollow'],{ state: { data: this.data } }).then(() => {
          window.location.reload(); // ใช้เมื่อ Angular Router ไม่เพียงพอ
        });
      },
      error: (error) => console.error("UnFollow error:", error)
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { DataFollower, DataMembers, Datapackages, Datawork } from '../../../model/models';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-shutter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-shutter.component.html',
  styleUrl: './home-shutter.component.scss'
})
export class HomeShutterComponent implements OnInit{
  data: DataMembers[]=[];
  datauser: DataMembers[] = [];
  datapackages : Datapackages[] = [];
  datawork : Datawork[] = [];
  datafollower : DataFollower[] =[] ;
  idshutter : number = 0 ;
  constructor(private route: ActivatedRoute,private router : Router,private Constants: Constants , private http: HttpClient){}
  
  ngOnInit() { 
    this.route.paramMap.subscribe(() => {
      this.data = window.history.state.datauser || null;
      this.idshutter = window.history.state.idshutter || null;
  
      console.log('✅ Received datauser:', this.data);
      console.log('✅ Received idshutter:', this.idshutter);
  
      if (!this.data) {
        console.error("❌ Error: datauser is undefined or missing");
      }
      if (!this.idshutter) {
        console.error("❌ Error: idshutter is undefined or missing");
      }
    });
    this.getdatauser(this.idshutter);
  }
  
  
  back(){
  
  }
  forfollow(){
    
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
    });
  }
  
  getpackages(id : number){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/packages/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datapackages = response; 
      console.log("data User :",this.datapackages); 
      
    });
  }

  getwork(id : number){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/work/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datawork = response; 
      console.log("data User :",this.datawork); 
      
    });
  }

  getFollower(id : number){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/get/Follower/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datafollower = response; 
      console.log("data User :",this.datafollower); 
      
    });
  }
}
//api -> /read/:User_Id
//       /get/packages/:user_id
//ผลงาน /get/work/:user_id
//รีวิว   
//ผู้ติดตาม /get/Follower/:followed_id

//ถ้า user_id ตรงกับข้อมูลในหน้านี้ที่แสดง ปุ่่มแก้ไขค่อยจะโผล่ 

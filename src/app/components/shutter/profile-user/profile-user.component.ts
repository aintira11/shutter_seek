import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataMembers } from '../../../model/models';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-profile-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-user.component.html',
  styleUrl: './profile-user.component.scss'
})
export class ProfileUserComponent implements OnInit {
  datauser: DataMembers[] = [];
  id:number=0;
  Follow:[]=[];

  constructor(private router : Router,
    private Constants: Constants,
    private http: HttpClient,
    private route: ActivatedRoute,) {}

  ngOnInit(): void {
       this.route.paramMap.subscribe(() => {                
      setTimeout(() => { // เพิ่ม setTimeout() เพื่อให้ state โหลดเสร็จก่อน
        // this.data = window.history.state.datauser || [];
        this.id = window.history.state.iduser;
        this.getdatashutter(String(this.id)); 
        
      }, 100);
    });
  }

    getdatashutter(id : string){
    // console.log('id   :',id);
    const url = this.Constants.API_ENDPOINT+'/read/'+id;
    this.http.get(url).subscribe({
  next: (response: any) => {
    this.datauser = response; 
    // console.log("data User :", this.datauser); 
    this.getFollow(this.id);
  },
  error: (err) => {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้:", err);
  }
});

  }

  
 getFollow(id: number) {
    const url = `${this.Constants.API_ENDPOINT}/get/follow/${id}`;
    this.http.get(url).subscribe((res: any) => {
      this.Follow = res;
      // console.log("รายการติดตาม:", this.Follow);
    });
  }

  goBack() {
    this.router.navigate(['/mainshutter']);
    this.datauser = [];
    this.Follow =[];
  }
}

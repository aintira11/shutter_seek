import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule,Router } from '@angular/router';
import { DataMembers } from '../../model/models';
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
  constructor(private Constants: Constants, private route: ActivatedRoute, private http: HttpClient,private router : Router){}

  async ngOnInit(): Promise<void> {
    //รับข้อมูล จากหน้าที่ส่งมา 
    this.route.paramMap.subscribe(() => {
      this.data =window.history.state.data;
      console.log('Response:', this.data);
        // this.printdata();
        this.getdatauser(this.data.user_id);
          
      });
  } 
  
  getdatauser(id : number){
    console.log('id',id);
    const url = this.Constants.API_ENDPOINT+'/read/'+id;
    this.http.get(url).subscribe((response: any) => {
      this.datauser = response; 
      console.log("Image User :",this.datauser); 
    });
  }

}

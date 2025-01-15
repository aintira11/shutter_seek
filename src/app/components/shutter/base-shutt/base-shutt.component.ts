import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { HttpClient } from '@angular/common/http';
import { DataMembers } from '../../../model/models';

@Component({
  selector: 'app-base-shutt',
  standalone: true,
  imports: [FormsModule,
       MatFormFieldModule,
       MatInputModule,
       MatButtonModule,
       RouterModule],
  templateUrl: './base-shutt.component.html',
  styleUrl: './base-shutt.component.scss'
})
export class BaseShuttComponent {
    data: any;
    datauser: DataMembers[] = [];
    constructor(private Constants: Constants, private route: ActivatedRoute, private http: HttpClient,private router : Router){}
    
    async ngOnInit(): Promise<void> {
      //รับข้อมูล จากหน้าที่ส่งมา 
      this.route.paramMap.subscribe(() => {
        this.data =window.history.state.data;
        console.log('Response:', this.data);
          // this.printdata();
          //this.getdatauser(this.data.user_id);
            
        });
    }
    
    next(){
      this.router.navigate(['/base2_1']);
    }
}

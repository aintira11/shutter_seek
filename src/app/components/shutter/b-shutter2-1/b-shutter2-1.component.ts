import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { DataMembers, DataTegs } from '../../../model/models';
import { Constants } from '../../../config/constants';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-b-shutter2-1',
  standalone: true,
  imports: [FormsModule,
         MatFormFieldModule,
         MatInputModule,
         MatButtonModule,
         RouterModule,
         ReactiveFormsModule,
         CommonModule,
         HttpClientModule],
  templateUrl: './b-shutter2-1.component.html',
  styleUrl: './b-shutter2-1.component.scss'
})
export class BShutter21Component implements OnInit{
      data: any;
      datauser: DataMembers[] = [];
      fromreister!: FormGroup;
      Tags:DataTegs[]=[];

   constructor(private fb: FormBuilder,private Constants: Constants, private route: ActivatedRoute, private http: HttpClient,private router : Router,){

    this.fromreister = this.fb.group({
                      tags_id: ['', Validators.required], 
                      name_work: ['', Validators.required],      
                    });
   }
   async ngOnInit(): Promise<void> {
    //รับข้อมูล จากหน้าที่ส่งมา 
     this.route.queryParams.subscribe(params => {
      // this.route.queryParams.subscribe(params => {
      this.data =window.history.state.data;
      // this.data = params['id'];
      console.log('Response:', this.data);
      //this.next(this.data.user_id);      
      });

      this.gettegs();
  }

  gettegs() {
    const url = this.Constants.API_ENDPOINT + '/tegs' ;
    this.http.get(url).subscribe((response: any) => {
      this.Tags = response;
      console.log("data Tegs :", this.Tags);
    });
  }
      
  next() {
    console.log('Form value:', this.fromreister.value);
    const url = this.Constants.API_ENDPOINT + '/add/Portfolio';
    const formData = {
      user_id: this.data.user_id,
      tags_id: this.fromreister.value.tags_id,
      name_work:this.fromreister.value.name_work
  };
  this.http.post(url, formData).subscribe({
    next: (res) => {
        console.log('data :',res);
        // ใช้ spread operator เพื่อเก็บข้อมูลทั้งหมดใน res
        const responseData = { ...res };
        this.router.navigate(['/base2_3'], { state: { data: responseData } });
        // this.router.navigate(['/base'], { queryParams: { id: this.data } });
    },
    error: (err) => {
        console.error('Error :', err);
        //this.signerr = 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง';
        if (err.status === 409) {
          // หากสถานะตอบกลับเป็น 409
          alert('เกิดข้อผิดพลาด');
      } else {
          // สำหรับกรณี Error อื่น ๆ
          alert('กรุณาลองอีกครั้ง');
      }
    }
});
    
  }
      back(){
        this.router.navigate(['/base']);
      }
     
}
 


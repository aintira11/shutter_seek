import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
       RouterModule,
       ReactiveFormsModule ],
  templateUrl: './base-shutt.component.html',
  styleUrl: './base-shutt.component.scss'
})
export class BaseShuttComponent {
    data: any;
    datauser: DataMembers[] = [];
    fromreister!: FormGroup;
    
    constructor(private fb: FormBuilder,private Constants: Constants, private route: ActivatedRoute, private http: HttpClient,private router : Router){

      this.fromreister = this.fb.group({
                  lineID: ['', Validators.required],
                  facebook: ['', Validators.required],
                  description: ['', Validators.required],      
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
    }


    
    next(){
      const url = this.Constants.API_ENDPOINT + '/shutter/updateline/'+this.data.user_id;
      const formData = {
        lineID: this.fromreister.value.lineID,
        facebook: this.fromreister.value.facebook,
        description: this.fromreister.value.description,
    };
    this.http.post(url, formData).subscribe({
      next: (res) => {
          console.log('data :',res);
          // ใช้ spread operator เพื่อเก็บข้อมูลทั้งหมดใน res
          const responseData = { ...res };
          this.router.navigate(['/base2_1'], { state: { data: responseData } });
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
}

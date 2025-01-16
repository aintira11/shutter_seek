import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import jsonData from '../../../../assets/thai_provinces.json'
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Constants } from '../../../config/constants';
import { DataMembers } from '../../../model/models';
import { ImageUploadService } from '../../../services_image/image-upload.service';

@Component({
  selector: 'app-create-profile',
  standalone: true,
  imports: [MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    RouterModule,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-profile.component.html',
  styleUrl: './create-profile.component.scss'
})
export class CreateProfileComponent implements OnInit {
  thaijson = jsonData
  thai : any;
  imagePreview: string = '/assets/images/user.png'; // รูปภาพเริ่มต้น
  selectedFile?: File; // เก็บไฟล์รูปภาพที่เลือก

  data: any = {};
  // data = 9;
  datauser: DataMembers[] = [];
  fromreister!: FormGroup;
  files: { file: File; preview: string; newName?: string }[] = [];

  constructor(private fb: FormBuilder,private router : Router,private Constants: Constants, private route: ActivatedRoute, private http: HttpClient,private readonly imageUploadService: ImageUploadService){ 
    console.log(this.thaijson);

     this.fromreister = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // เบอร์โทร 10 หลัก
            username: ['', Validators.required],
            first_name: ['', Validators.required],
            last_name: ['', Validators.required],
            address: ['', Validators.required],
            province: ['', Validators.required],

          });
  }
  
  async ngOnInit(): Promise<void> {
    // รับข้อมูลจากหน้าที่ส่งมา
    this.route.paramMap.subscribe(() => {
        // ตรวจสอบว่า state มีข้อมูลหรือไม่
        if (window.history.state && window.history.state.data) {
            this.data = window.history.state.data;

            console.log('Response:', this.data);

            // ตรวจสอบว่ามี last_idx หรือไม่ก่อนใช้งาน
            if (this.data.last_idx) {
                this.getdatauser(this.data.last_idx); // ส่ง last_idx ไปยังฟังก์ชัน
            } else {
                console.error('last_idx is missing in data:', this.data);
            }
        } else {
            console.error('No data found in history state');
        }
    });
}

getdatauser(id: number) {
  console.log('id', id);
  const url = this.Constants.API_ENDPOINT + '/shutter/read/' + id;
  this.http.get(url).subscribe((response: any) => {
    this.datauser = response;
    console.log("data user :", this.datauser);

    // Populate the form controls with the fetched data
    if (this.datauser.length > 0) {
      this.fromreister.patchValue({
        email: this.datauser[0].email,
        phone: this.datauser[0].phone,
        username: this.datauser[0].username,
        first_name: this.datauser[0].first_name,
        last_name: this.datauser[0].last_name,
        address: this.datauser[0].address,
        province: this.datauser[0].province,
      });
    }
  });
}

private generateRandomFileName(originalName: string): string {
  const extension = originalName.split('.').pop();
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
}

async base_for_shutt() {
  if (this.selectedFile) {
    const randomName = this.generateRandomFileName(this.selectedFile.name);

    // อัปโหลดรูปภาพ
    const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
    const image = response.data.url;

    const url = this.Constants.API_ENDPOINT + '/shutter/update/' + this.datauser[0].user_id;
    const formData = {
      email: this.fromreister.value.email,
      phone: this.fromreister.value.phone,
      username: this.fromreister.value.username,
      first_name: this.fromreister.value.first_name,
      last_name: this.fromreister.value.last_name,
      address: this.fromreister.value.address,
      province: this.fromreister.value.province,
      image_profile: image,
    };

    this.http.post(url, formData).subscribe({
      next: (res) => {
        console.log('data :', res);
        const responseData = { ...res };
        this.router.navigate(['/base'], { state: { data: responseData } });
      },
      error: (err) => {
        console.error('Error :', err);
        if (err.status === 409) {
          alert('มีอีเมลนี้อยู่ในระบบแล้ว');
        } else {
          alert('ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง');
        }
      },
    });
  } else {
    alert('กรุณาอัปโหลดรูปภาพก่อนดำเนินการ');
  }
}

triggerFileInput() {
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  fileInput.click();
}

onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.selectedFile = file; // เก็บไฟล์ที่เลือก
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string; // อัปเดตตัวแปรรูปภาพ
    };
    reader.readAsDataURL(file);
  }
}
}

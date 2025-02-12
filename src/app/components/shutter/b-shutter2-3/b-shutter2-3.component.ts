// b-shutter2-3.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Constants } from '../../../config/constants';
import { DataMembers, DataTegs } from '../../../model/models';
import { ImageUploadService } from '../../../services_image/image-upload.service';

@Component({
  selector: 'app-b-shutter2-3',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    CommonModule,
    HttpClientModule 
  ],
  templateUrl: './b-shutter2-3.component.html',
  styleUrls: ['./b-shutter2-3.component.scss']
})
export class BShutter23Component {
  data: any;
  datauser: DataMembers[] = [];
  Tegs: DataTegs[] = [];
  files: { file: File; preview: string; newName?: string }[] = [];
  
  constructor(
    private fb: FormBuilder,
    private Constants: Constants, 
    private route: ActivatedRoute, 
    private http: HttpClient,
    private router: Router,
    private readonly imageUploadService: ImageUploadService
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      this.data = window.history.state.data;
      console.log('Response 2_3:', this.data);    
    });
  }
          
  // onInput(e: Event) {
  //   const input = e.target as HTMLInputElement;
  
  //   if (input.files && input.files.length > 0) {
  //     const file = input.files[0]; // ดึงไฟล์แรก
  //     this.imageUploadService.uploadImage(file).subscribe({
  //       next: (url) => console.log('Uploaded URL:', url),
  //       error: (err) => console.error('Upload failed:', err),
  //     });
  //   } else {
  //     console.error('No files selected or input.files is null');
  //   }
  // }
  
  
  next() {
    this.router.navigate(['/base3']);
  }

  back() {
    this.router.navigate(['/base2_1']);
  }

  // onFileSelected(event: any): void {
  //   const selectedFiles = Array.from(event.target.files) as File[];
  //   selectedFiles.forEach(file => {
  //     if (file.type === 'image/jpeg' || file.type === 'image/png') {
  //       if (this.files.length < 10) {
  //         const reader = new FileReader();
  //         reader.onload = (e: any) => {
  //           this.files.push({ file, preview: e.target.result });
  //         };
  //         reader.readAsDataURL(file);
  //       } else {
  //         alert('เลือกได้สูงสุด 10 รูป');
  //       }
  //     } else {
  //       alert('ไฟล์ต้องเป็น .jpg หรือ .png เท่านั้น');
  //     }
  //   });
  //   event.target.value = '';
  // }
  
  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  onInput(e: Event): void {
    const input = e.target as HTMLInputElement;
  
    if (input.files && input.files.length > 0 && input.files.length <=10 ) {
      const selectedFiles = Array.from(input.files) as File[];
  
      // เพิ่มไฟล์เข้าไปในอาร์เรย์ files
      selectedFiles.forEach(file => {
        if (file.type === 'image/jpeg' || file.type === 'image/png') {
          const reader = new FileReader();
          reader.onload = (event: any) => {
            this.files.push({ file, preview: event.target.result });
          };
          reader.readAsDataURL(file);
        } else {
          alert('ไฟล์ต้องเป็น .jpg หรือ .png เท่านั้น');
        }
      });
  
      // ล้างค่า input เพื่อให้เลือกไฟล์ใหม่ได้ในครั้งถัดไป
      input.value = '';
    } else {
      console.error('No files selected or input.files is null');
    }
  }
  
  async onSubmit(): Promise<void> {
    if (this.files.length === 0) {
      alert('กรุณาเลือกไฟล์ก่อนทำการบันทึก');
      return;
    }
  
    try {
      for (const fileObj of this.files) {
        const randomName = this.generateRandomFileName(fileObj.file.name);
        fileObj.newName = randomName;
  
        // อัปโหลดรูปภาพ
        const response: any = await this.imageUploadService.uploadImage(fileObj.file).toPromise();
  
        if (response && response.data && response.data.url) {
          const imageUrl = response.data.url;
  
          // บันทึก URL รูปภาพในฐานข้อมูล
          const apiUrl = this.Constants.API_ENDPOINT + '/update/Portfolio/image';
          const payload = {
            // portfolio_id: this.data.last_idx, // ดึงจากข้อมูลที่ถูกส่งมาหน้า component
            portfolio_id: this.data.last_idx,
            Image_url: imageUrl,
          };
  
          await this.http.post(apiUrl, payload).toPromise();
          console.log(`Image ${imageUrl} saved successfully`);

        } else {
          throw new Error('No URL returned from the image upload API');
        }
      }
  
      alert('อัปโหลดสำเร็จและข้อมูลถูกบันทึกในฐานข้อมูล');
      this.router.navigate(['/base3'], { state: { data:  this.data  } });
      console.log('respont: ', this.data  );
       // ล้างอาร์เรย์หลังจากบันทึกเสร็จ
      this.files = [];
    } catch (error) {
      console.error('Error during upload or database save:', error);
      alert('เกิดข้อผิดพลาดระหว่างการอัปโหลดหรือบันทึกข้อมูล');
    }
  }
  
  private generateRandomFileName(originalName: string): string {
    const extension = originalName.split('.').pop();
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
  }
  
}

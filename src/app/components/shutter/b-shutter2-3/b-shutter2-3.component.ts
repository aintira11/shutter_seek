import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-b-shutter2-3',
  standalone: true,
  imports: [FormsModule
      ,MatButtonModule
      ,MatFormFieldModule
      ,MatInputModule
      ,RouterModule
      ,CommonModule
    ],
  templateUrl: './b-shutter2-3.component.html',
  styleUrl: './b-shutter2-3.component.scss'
})
export class BShutter23Component {
     constructor(private router : Router,){}
          
      next(){
        this.router.navigate(['/base3']);
      }
      back(){
        this.router.navigate(['/base2_1']);
      }

      files: { file: File; preview: string }[] = [];

      // เมื่อเลือกไฟล์
      onFileSelected(event: any): void {
        console.log('Current files:', this.files);
        

        const selectedFiles = Array.from(event.target.files) as File[];
      
        // ตรวจสอบประเภทไฟล์และจำกัดจำนวนไฟล์ที่เลือก
        selectedFiles.forEach((file) => {
          if (file.type === 'image/jpeg' || file.type === 'image/png') {
            if (this.files.length < 10) {
              const reader = new FileReader();
              reader.onload = (e: any) => {
                this.files.push({ file, preview: e.target.result });
                console.log('File added:', file.name); // Debug log
              };
              reader.readAsDataURL(file);
            } else {
              alert('เลือกได้สูงสุด 10 รูป');
            }
          } else {
            alert('ไฟล์ต้องเป็น .jpg หรือ .png เท่านั้น');
          }
        });
      
        // รีเซ็ตค่า input เพื่อให้เลือกไฟล์ซ้ำได้
        event.target.value = '';
      }
      
    
      // ลบไฟล์ออก
      removeFile(index: number): void {
        this.files.splice(index, 1);
        console.log('File removed. Current files:', this.files); // Debug log
      }
      
    
      // บันทึกไฟล์ไปที่ API
      onSubmit(): void {
        const formData = new FormData();
        this.files.forEach((fileObj) => {
          formData.append('images', fileObj.file);
        });
    
        // เรียก API (สมมติว่า API มีอยู่แล้ว)
        // this.http.post('YOUR_API_ENDPOINT', formData).subscribe(response => {
        //   console.log('Upload success', response);
        // });
    
        alert('อัพโหลดสำเร็จ');
      }
}

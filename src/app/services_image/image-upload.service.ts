

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';

// interface ImageUploadResponse {
//   data: {
//     url: string;
//   };
// } 

// @Injectable({
//   providedIn: 'root',
// })
// export class ImageUploadService {
//   private readonly apiKey: string = '5fd02ffebb282f4077ae88f7c34afd8d'; // ใส่ API Key ของคุณ

//   constructor(private readonly httpClient: HttpClient) {}

//   uploadImage(file: File): Observable<any> {
//     const formData = new FormData();
//     formData.append('image', file);
  
//     return this.httpClient.post(`https://api.imgbb.com/1/upload`, formData, {
//       params: { key: this.apiKey },
//     });
//   }
// }


// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators'; 


// interface ImgBBResponse {
//   data: {
//     url: string; // URL ของรูปภาพ
//     display_url?: string; // URL สำรอง, บางครั้ง ImgBB ก็ใช้ชื่อนี้
//   };
//   success: boolean;
//   status: number;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class ImageUploadService {
//   private readonly apiKey: string = '5fd02ffebb282f4077ae88f7c34afd8d'; 

//   constructor(private readonly httpClient: HttpClient) {}

//   uploadImage(file: File): Observable<string> {
//     const formData = new FormData();
//     formData.append('image', file);

//     return this.httpClient.post<ImgBBResponse>(`https://api.imgbb.com/1/upload`, formData, {
//       params: { key: this.apiKey },
//     }).pipe(
//       map(response => {
//         // ตรวจสอบว่า response มีข้อมูลที่จำเป็นและมี URL รูปภาพ
//         if (response && response.data && response.data.url) {
//           console.log('Image URL from ImgBB:', response.data.url); // สำหรับ debug
//           return response.data.url; // คืนค่าเฉพาะ URL (ที่เป็น string)
//         }
//         // กรณีสำรองเผื่อ ImgBB ส่งกลับมาในชื่อ display_url
//         else if (response && response.data && response.data.display_url) {
//           console.log('Image URL (display_url) from ImgBB:', response.data.display_url); // สำหรับ debug
//           return response.data.display_url;
//         }
//         // ถ้าหา URL ไม่เจอ ให้โยน Error
//         throw new Error('Image upload failed: Could not find image URL in response.');
//       })
//     );
//   }
// }

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; 

interface ImgBBResponse {
  data: {
    url: string; // URL ของรูปภาพ
    display_url?: string; // URL สำรอง, บางครั้ง ImgBB ก็ใช้ชื่อนี้
  };
  success: boolean;
  status: number;
}

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  private readonly apiKey: string = '5fd02ffebb282f4077ae88f7c34afd8d'; // API Key ของคุณ

  constructor(private readonly httpClient: HttpClient) {}

  // 
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    
    // โค้ดเดิมที่คืนค่า response ดิบจาก HttpClient.post
    return this.httpClient.post(`https://api.imgbb.com/1/upload`, formData, {
      params: { key: this.apiKey },
    });
  }

  // สำหรับแชท
  uploadImageAndGetUrl(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);

    return this.httpClient.post<ImgBBResponse>(`https://api.imgbb.com/1/upload`, formData, {
      params: { key: this.apiKey },
    }).pipe(
      map(response => {
        // ดึงเฉพาะ URL รูปภาพ
        if (response && response.data && response.data.url) {
          console.log('Image URL from ImgBB (new method):', response.data.url);
          return response.data.url; 
        }
        else if (response && response.data && response.data.display_url) {
          console.log('Image URL (display_url from new method):', response.data.display_url);
          return response.data.display_url;
        }
        throw new Error('Image upload failed: Could not find image URL in response.');
      })
    );
  }
}


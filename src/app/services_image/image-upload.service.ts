// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import {map} from 'rxjs/operators';

// @Injectable({
//   providedIn: 'root',
// })
// export class ImageUploadService {
//   private API_URL = 'https://api.imgbb.com/1/upload';
//   private API_KEY = '2db235251384e81e5915225d0ee01e4b'; // Replace with your actual API key
//   private EXPIRATION_TIME = 600; // Set the expiration time (in seconds)

//   constructor(private http: HttpClient) {}

//   uploadImage(file: File, newName: string): Observable<any> {
//     const formData = new FormData();
//     formData.append('key', this.API_KEY);
//     formData.append('image', file);
//     formData.append('name', newName); // New name for the image
//     formData.append('expiration', this.EXPIRATION_TIME.toString()); // Set expiration time (optional)

//     return this.http.post(`${this.API_URL}?expiration=${this.EXPIRATION_TIME}&key=${this.API_KEY}`, formData);
//   }
// }

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ImageUploadResponse {
  data: {
    url: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  private readonly apiKey: string = '5fd02ffebb282f4077ae88f7c34afd8d'; // ใส่ API Key ของคุณ

  constructor(private readonly httpClient: HttpClient) {}

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
  
    return this.httpClient.post(`https://api.imgbb.com/1/upload`, formData, {
      params: { key: this.apiKey },
    });
  }
  
  

    //const apiUrl = 'https://api.imgbb.com/1/upload';

    // return this.httpClient
    //   .post<ImageUploadResponse>(apiUrl, formData, { params: { key: this.apiKey } })
    //   .pipe(
    //     map((response) => {
    //       console.log('API Response:', response); // เพิ่มการ log ข้อมูลตอบกลับจาก API
    //       if (response && response.data && response.data.url) {
    //         return response.data.url; // คืนค่า URL หากมี
    //       } else {
    //         throw new Error('No URL returned from the API');
    //       }
    //     })
    //   );
  // }
}

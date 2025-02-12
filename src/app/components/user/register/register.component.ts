import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder,Validators,FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { ReactiveFormsModule } from '@angular/forms';
import { ImageUploadService } from '../../../services_image/image-upload.service';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  fromreister: FormGroup;
  selectedFile?: File; // เก็บไฟล์รูปภาพที่เลือก
  files: { file: File; preview: string; newName?: string }[] = [];
  constructor(private Constants :Constants ,private http:HttpClient ,private fromBuilder : FormBuilder ,private router : Router,private readonly imageUploadService: ImageUploadService)
  {
    this.fromreister = this.fromBuilder.group({
      Email: ['', [Validators.required, Validators.email]],
      Password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      UserName: ['', Validators.required],
      Name: ['', Validators.required],
      LastName: ['', Validators.required],
      address: ['', Validators.required],
      Phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
  });
  
    
  }

  imagePreview: string = '/assets/images/user.png';
  

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  back(){
    this.router.navigate(['']);
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

  private generateRandomFileName(originalName: string): string {
    const extension = originalName.split('.').pop();
    return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
  }

  async register() {
    if(this.fromreister.value.Password != this.fromreister.value.confirmPassword){
      alert('ยืนยันรหัสผ่านไม่ถูกต้อง');
    }
    if(this.selectedFile){
      const randomName = this.generateRandomFileName(this.selectedFile.name);
    // อัปโหลดรูปภาพ
    const response: any = await this.imageUploadService.uploadImage(this.selectedFile).toPromise();
    const image = response.data.url;

    const url = this.Constants.API_ENDPOINT + '/register/member';
    // let image = 'https://www.hotelbooqi.com/wp-content/uploads/2021/12/128-1280406_view-user-icon-png-user-circle-icon-png.png';

    const formData = {
        email: this.fromreister.value.Email,
        password: this.fromreister.value.Password,
        username: this.fromreister.value.UserName,
        first_name: this.fromreister.value.Name,
        last_name: this.fromreister.value.LastName,
        phone: this.fromreister.value.Phone,
        image_profile :image,
        //image_profile: this.formRegister.value.image_profile || null,
        address:this.fromreister.value.address,
    };
  

    console.log(formData);

    this.http.post(url, formData).subscribe({
        next: (res) => {
            console.log(res);
            this.router.navigate(['/login']);
        },
        error: (err) => {
            console.error('Error :', err);
            //this.signerr = 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง';
            if (err.status === 409) {
              // หากสถานะตอบกลับเป็น 409
              alert('มีอีเมลนี้อยู่ในระบบแล้ว');
          } else {
              // สำหรับกรณี Error อื่น ๆ
              alert('ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง');
          }
        }
        
    });
  }
  else{
    console.log("เลือกรูป");
  }
}
}


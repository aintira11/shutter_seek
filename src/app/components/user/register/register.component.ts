import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder,Validators,FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Constants } from '../../../config/constants';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  fromreister: FormGroup;
  constructor(private Constants :Constants ,private http:HttpClient ,private fromBuilder : FormBuilder ,private router : Router)
  {
    this.fromreister = this.fromBuilder.group({
      Email: ['', [Validators.required, Validators.email]],
      Password: ['', Validators.required],
      UserName: ['', Validators.required],
      Name: ['', Validators.required],
      LastName: ['', Validators.required],
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
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string; // อัปเดตตัวแปรรูปภาพ
      };
      reader.readAsDataURL(file);
    }
  }

  register() {
    const url = this.Constants.API_ENDPOINT + '/register/member';

    if (this.fromreister.invalid) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    const formData = {
        email: this.fromreister.value.Email,
        password: this.fromreister.value.Password,
        username: this.fromreister.value.UserName,
        first_name: this.fromreister.value.Name,
        last_name: this.fromreister.value.LastName,
        phone: this.fromreister.value.Phone
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
        }
    });
}

}

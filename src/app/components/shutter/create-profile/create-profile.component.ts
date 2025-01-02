import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import { RouterModule } from '@angular/router';
import jsonData from '../../../../assets/thai_provinces.json'
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-profile',
  standalone: true,
  imports: [MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './create-profile.component.html',
  styleUrl: './create-profile.component.scss'
})
export class CreateProfileComponent {
  thaijson = jsonData
  thai : any;
  imagePreview: string = '/assets/images/user.png'; // รูปภาพเริ่มต้น

  constructor(private router : Router,){
    console.log(this.thaijson);
  }

  base_for_shutt() {
    this.router.navigate(['/base']);
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
}

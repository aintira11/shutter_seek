import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-addmin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './addmin.component.html',
  styleUrl: './addmin.component.scss'
})
export class AddminComponent {
  constructor(private router : Router){}

  goToadmin(): void {
    this.router.navigate(['/admin']);
  }
  adminData = {
    fullName: '',
    email: '',
    username: '',
    password: '',
  };

  submitForm() {
    console.log('Admin Data:', this.adminData);
    alert('ข้อมูลถูกบันทึกเรียบร้อยแล้ว');
  }

  cancel() {
    if (confirm('คุณต้องการยกเลิกหรือไม่?')) {
      this.adminData = {
        fullName: '',
        email: '',
        username: '',
        password: '',
      };
    }
  }
}


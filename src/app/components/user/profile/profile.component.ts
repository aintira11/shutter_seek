import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

  constructor(private router : Router,){}
  goToEditPro(): void {
    this.router.navigate(['/editprofile']);
  }
  goToShutter(): void {
    this.router.navigate(['']);
  }

  back(){
    this.router.navigate(['']);
  }

  cancelEdit(){
    this.router.navigate(['/profile']);
  }
}

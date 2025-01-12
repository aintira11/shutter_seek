import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent {
  constructor(private router : Router,){}

  // goToLogin(): void {
  //   this.router.navigate(['/login']);
  // }

  back(){
    this.router.navigate(['/profile']);
  }
}

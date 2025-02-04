import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.scss'
})
export class EditUserComponent {

  constructor(private router : Router,){}

  // goToLogin(): void {
  //   this.router.navigate(['/login']);
  // }

  back(){
    this.router.navigate(['/profile']);
  }
}

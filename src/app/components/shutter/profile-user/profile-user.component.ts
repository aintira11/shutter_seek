import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface UserProfile {
  username: string;
  followCount: number;
  memberSince: string;
  imageUrl: string;
}

@Component({
  selector: 'app-profile-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-user.component.html',
  styleUrl: './profile-user.component.scss'
})
export class ProfileUserComponent implements OnInit {
  userProfile!: UserProfile;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // จำลองดึงข้อมูลจาก backend
    this.userProfile = {
      username: 'mumumi',
      followCount: 4,
      memberSince: '21/07/2025',
      imageUrl: 'assets/images/profile.jpg'
    };
  }

  goBack() {
    this.router.navigate(['/mainshutter']);
  }
}

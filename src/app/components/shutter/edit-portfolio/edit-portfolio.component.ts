import { Component, ElementRef, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-portfolio.component.html',
  styleUrl: './edit-portfolio.component.scss'
})
export class EditPortfolioComponent {

  constructor(private el: ElementRef, private renderer: Renderer2, private router : Router,){}

  // ตัวแปรที่ใช้ในการควบคุมการเปิด/ปิด Sidebar
  isSidebarOpen = true;

  // ฟังก์ชันสำหรับเปิดหรือปิด Sidebar
  w3_toggle(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  goToInsertport(): void {
    this.router.navigate(['/insertport']);
  }

  goToPackagePack(): void {
    this.router.navigate(['/editpac']);
  }

  goToEditProfile(): void {
    this.router.navigate(['/editshutter']);
  }
}

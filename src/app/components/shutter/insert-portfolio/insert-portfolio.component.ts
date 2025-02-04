import { CommonModule } from '@angular/common';
import { Component , ElementRef, Renderer2} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-insert-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insert-portfolio.component.html',
  styleUrl: './insert-portfolio.component.scss'
})
export class InsertPortfolioComponent {
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

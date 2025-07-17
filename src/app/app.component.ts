import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ImageUploadService } from './services_image/image-upload.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet
            ,RouterModule
            ,HttpClientModule
            ,CommonModule
            ,MatSidenavModule
            ,FormsModule
            ,MatIconModule
             ],
  providers: [ImageUploadService], // เพิ่ม ImageUploadService
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'shutter-project';
}

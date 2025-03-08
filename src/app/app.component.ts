import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ImageUploadService } from './services_image/image-upload.service';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet
            ,RouterModule
            ,HttpClientModule
            ,CommonModule
            ,MatSidenavModule
  ],
  providers: [ImageUploadService], // เพิ่ม ImageUploadService
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'shutter-project';
}

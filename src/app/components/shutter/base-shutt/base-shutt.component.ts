import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-base-shutt',
  standalone: true,
  imports: [FormsModule,
       MatFormFieldModule,
       MatInputModule,
       MatButtonModule,
       RouterModule],
  templateUrl: './base-shutt.component.html',
  styleUrl: './base-shutt.component.scss'
})
export class BaseShuttComponent {
    constructor(private router : Router,){}
    
    next(){

    }
}

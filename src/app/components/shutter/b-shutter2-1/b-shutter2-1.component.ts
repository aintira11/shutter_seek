import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-b-shutter2-1',
  standalone: true,
  imports: [FormsModule,
         MatFormFieldModule,
         MatInputModule,
         MatButtonModule,
         RouterModule],
  templateUrl: './b-shutter2-1.component.html',
  styleUrl: './b-shutter2-1.component.scss'
})
export class BShutter21Component {
   constructor(private router : Router,){}
      
      next(){
        this.router.navigate(['/base2_2']);
      }
      back(){
        this.router.navigate(['/base']);
      }
}

import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';


@Component({
  selector: 'app-create-useracc',
  standalone: true,
  imports: [FormsModule,
     MatFormFieldModule,
     MatInputModule,
     MatButtonModule,
     RouterModule
    ],
  templateUrl: './create-useracc.component.html',
  styleUrl: './create-useracc.component.scss'
})
export class CreateUseraccComponent {
  constructor(private router : Router,){}
  
    register() {
      this.router.navigate(['/creatfro']);
      }
}

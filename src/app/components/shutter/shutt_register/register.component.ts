import { Component } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [MatButtonModule
            ,RouterModule
            
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class shutt_RegisterComponent {

}

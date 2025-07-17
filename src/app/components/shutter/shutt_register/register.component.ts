import { Component } from '@angular/core';

import {MatButtonModule} from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [MatButtonModule
            ,RouterModule
            ,MatIconModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class shutt_RegisterComponent {
  constructor(private router: Router) { }

  back(){
    this.router.navigate(['']);
  }
}

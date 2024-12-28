import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/user/register/register.component';

export const routes: Routes = [
    {path: '',component: HomeComponent},
    {path: 'login',component: LoginComponent},
    {path: 'login',component: RegisterComponent},
    // { 
    //   path: 'myprofile',
    //   component: MyprofileComponent,
    //   children: [
    //       { path: 'post', component: MyprofilePostComponent },
       
    //   //   { path: 'test/:id', component: TestComponent },
    //   ],
    // },
  ];

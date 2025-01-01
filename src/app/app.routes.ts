import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/user/register/register.component';
import { shutt_RegisterComponent } from './components/shutter/shutt_register/register.component';
import { CreateAccountComponent } from './components/shutter/create-account/create-account.component';
import { CreateProfileComponent } from './components/shutter/create-profile/create-profile.component';

export const routes: Routes = [
    {path: '',component: HomeComponent},
    {path: 'login',component: LoginComponent},
    {path: 'shutter',component: shutt_RegisterComponent},
    {path: 'createacc',component: CreateAccountComponent},
    {path: 'creatfro',component: CreateProfileComponent},
    // { 
    //   path: 'myprofile',
    //   component: MyprofileComponent,
    //   children: [
    //       { path: 'post', component: MyprofilePostComponent },
       
    //   //   { path: 'test/:id', component: TestComponent },
    //   ],
    // },
  ];

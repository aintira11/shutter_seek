import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/user/register/register.component';
import { shutt_RegisterComponent } from './components/shutter/shutt_register/register.component';
import { CreateAccountComponent } from './components/shutter/create-account/create-account.component';
import { CreateProfileComponent } from './components/shutter/create-profile/create-profile.component';
import { BaseShuttComponent } from './components/shutter/base-shutt/base-shutt.component';
import { BShutter21Component } from './components/shutter/b-shutter2-1/b-shutter2-1.component';
import { BShutter22Component } from './components/shutter/b-shutter2-2/b-shutter2-2.component';
import { BShutter23Component } from './components/shutter/b-shutter2-3/b-shutter2-3.component';
import { BShutter3Component } from './components/shutter/b-shutter3/b-shutter3.component';

export const routes: Routes = [
    {path: '',component: HomeComponent},
    {path: 'login',component: LoginComponent},
    {path: 'shutter',component: shutt_RegisterComponent},
    {path: 'createacc',component: CreateAccountComponent},
    {path: 'creatfro',component: CreateProfileComponent},
    {path: 'base',component: BaseShuttComponent},
    {path: 'base2_1',component: BShutter21Component},
    {path: 'base2_2',component: BShutter22Component},
    {path: 'base2_3',component: BShutter23Component},
    {path: 'base3',component: BShutter3Component},

    {path: 'register',component: RegisterComponent},
    // { 
    //   path: 'myprofile',
    //   component: MyprofileComponent,
    //   children: [
    //       { path: 'post', component: MyprofilePostComponent },
       
    //   //   { path: 'test/:id', component: TestComponent },
    //   ],
    // },
  ];

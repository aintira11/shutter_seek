import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { shutt_RegisterComponent } from './components/shutter/shutt_register/register.component';
import { CreateAccountComponent } from './components/shutter/create-account/create-account.component';
import { CreateProfileComponent } from './components/shutter/create-profile/create-profile.component';
import { BaseShuttComponent } from './components/shutter/base-shutt/base-shutt.component';
import { BShutter21Component } from './components/shutter/b-shutter2-1/b-shutter2-1.component';
import { BShutter22Component } from './components/shutter/b-shutter2-2/b-shutter2-2.component';
import { BShutter23Component } from './components/shutter/b-shutter2-3/b-shutter2-3.component';
import { BShutter3Component } from './components/shutter/b-shutter3/b-shutter3.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { CreateUseraccComponent } from './components/user/create-useracc/create-useracc.component';
import { EditPortfolioComponent } from './components/shutter/edit-portfolio/edit-portfolio.component';
import { EditPackageComponent } from './components/shutter/edit-package/edit-package.component';
import { EditShutterComponent } from './components/shutter/edit-shutter/edit-shutter.component';
import { EditUserComponent } from './components/user/edit-user/edit-user.component';
import { InsertPortfolioComponent } from './components/shutter/insert-portfolio/insert-portfolio.component';
import { UserFollowComponent } from './components/user/user-follow/user-follow.component';
import { HomeShutterComponent } from './components/shutter/home-shutter/home-shutter.component';
import { RegisterComponent } from './components/user/register/register.component';
import { MainShutterComponent } from './components/shutter/main-shutter/main-shutter.component';
import { ReportsComponent } from './components/user/reports/reports.component';
import { MassageRoomComponent } from './components/massage-room/massage-room.component';
import { PreShutterComponent } from './components/pre-shutter/pre-shutter.component';
import { EditSelectWorkComponent } from './components/shutter/edit-select-work/edit-select-work.component';
import { AddminComponent } from './components/admin/addmin/addmin.component';
import { ComfirmShutterComponent } from './components/admin/comfirm-shutter/comfirm-shutter.component';
import { HomeadComponent } from './components/admin/homead/homead.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { EditAdminComponent } from './components/admin/edit-admin/edit-admin.component';
import { ProfileUserComponent } from './components/shutter/profile-user/profile-user.component';
import { ApprovalComponent } from './components/admin/approval/approval.component';

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
    {path: 'profileuser',component: ProfileUserComponent},

    {path: 'createuser',component: CreateUseraccComponent},
    {path: 'profile',component: ProfileComponent}, 
    {path: 'edituser',component: EditUserComponent}, 
    {path: 'editshutter',component: EditShutterComponent},
    {path: 'editportfol',component: EditPortfolioComponent},
    {path: 'editpac',component: EditPackageComponent},
    {path: 'insertport',component: InsertPortfolioComponent},
    {path: 'tofollow',component: UserFollowComponent},
    {path: 'register',component: RegisterComponent},
    {path: 'homeshutter',component: HomeShutterComponent},
    {path: 'preshutter',component: PreShutterComponent},
    {path: 'roomchat',component:MassageRoomComponent},
    
    {path: 'mainshutter',component: MainShutterComponent},
    {path: 'reports',component: ReportsComponent},
    {path: 'editwork',component: EditSelectWorkComponent },

    {path: 'admin',component:HomeadComponent},
    {path: 'addmin',component: AddminComponent},
    {path: 'comfirm',component: ComfirmShutterComponent},
    {path: 'editadmin',component: EditAdminComponent},
    
    {path: 'forgot',component: ForgotPasswordComponent},
    {path: 'Approval',component: ApprovalComponent},

    // { 
    //   path: 'myprofile',
    //   component: MyprofileComponent,
    //   children: [
    //       { path: 'post', component: MyprofilePostComponent },
       
    //   //   { path: 'test/:id', component: TestComponent },
    //   ],
    // },
  ];

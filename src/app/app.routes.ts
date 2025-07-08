import { Routes } from '@angular/router';
import {CallbackComponent} from './components/callback/callback.component';
import {LoginComponent} from './components/login/login.component';
import {authGuard} from './security/auth.guard';
import {HomeComponent} from './components/home/home.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'callback', component: CallbackComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] }
];

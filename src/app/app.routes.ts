import { Routes } from '@angular/router';
import {CallbackComponent} from './components/callback/callback.component';
import {LoginComponent} from './components/login/login.component';
import {authGuard} from './security/auth.guard';
import {HomeComponent} from './components/home/home.component';
import {RegisterComponent} from './components/register/register.component';
import {MarkerDetailComponent} from './components/marker-detail/marker-detail.component';
import {ShellComponent} from './components/shell/shell.component';
import {ProfileComponent} from './components/profile/profile.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'callback', component: CallbackComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        component: HomeComponent,
        children: [
          { path: 'marker/:id', component: MarkerDetailComponent, outlet: 'detail' },
          { path: 'marker/new', component: MarkerDetailComponent, outlet: 'detail' }
        ]
      },
      { path: 'profile', component: ProfileComponent },
      { path: '', pathMatch: 'full', redirectTo: 'home' }
    ]
  },
  { path: '**', redirectTo: '' }
];

import { Component } from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login();
  }

  register() {
    this.router.navigate(['/register']);
  }
}

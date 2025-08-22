import {Component} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './login.component.html',
  standalone: true,
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(private auth: AuthService, private router: Router) {
  }

  login() {
    this.auth.login();
  }

  register() {
    this.router.navigate(['/register']);
  }
}

import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-callback',
  imports: [CommonModule],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css'
})
export class CallbackComponent implements OnInit{

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.auth.getAccessToken()) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/']);
    }
  }
}

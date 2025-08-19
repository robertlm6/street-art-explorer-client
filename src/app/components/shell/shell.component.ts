import {AfterViewInit, Component, inject, NgZone, PLATFORM_ID, ViewChild} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatSidenav, MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {AuthService} from '../../services/auth.service';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-shell',
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './shell.component.html',
  standalone: true,
  styleUrl: './shell.component.css'
})
export class ShellComponent implements AfterViewInit{
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);

  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }

  ngAfterViewInit(): void {
    this.sidenav.openedChange.subscribe(() => {
      this.zone.runOutsideAngular(() => {
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 200);
        }
      });
    });
  }
}

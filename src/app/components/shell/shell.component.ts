import {AfterViewInit, Component, inject, NgZone, PLATFORM_ID, ViewChild} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatSidenav, MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {AuthService} from '../../services/auth.service';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {catchError, Observable, of, shareReplay} from 'rxjs';
import {ProfileService, UserAppDto} from '../../services/profile.service';

@Component({
  selector: 'app-shell',
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './shell.component.html',
  standalone: true,
  styleUrl: './shell.component.css'
})
export class ShellComponent implements AfterViewInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  me$?: Observable<UserAppDto | null>;

  defaultAvatar = '/default-avatar.jpg';

  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);

  constructor(private authService: AuthService, private router: Router, private profile: ProfileService) {
    this.me$ = this.profile.getProfile().pipe(
      shareReplay(1),
      catchError(_ => of(null))
    );
  }

  goProfile() {
    this.router.navigate(['/profile']);
  }

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

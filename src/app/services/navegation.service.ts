import {inject, Injectable} from '@angular/core';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavegationService {
  private router = inject(Router);

  goToUserProfile(userId: number) {
    this.router.navigate(['/user', userId]);
  }

  focusMarker(markerId: number, coords?: { lat: number; lng: number }, zoom = 16) {
    const outlets = {detail: ['marker', markerId]};
    const queryParams: any = {focusMarker: markerId};

    if (coords?.lat != null && coords?.lng != null) {
      queryParams.lat = coords.lat;
      queryParams.lng = coords.lng;
      queryParams.zoom = zoom;
    }

    this.router.navigate(['/home', {outlets}], {queryParams});
  }
}

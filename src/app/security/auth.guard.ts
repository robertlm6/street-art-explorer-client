import {CanActivateFn, Router} from '@angular/router';
import {OAuthService} from 'angular-oauth2-oidc';
import {inject} from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const oauthService = inject(OAuthService);
  const router = inject(Router);

  if (oauthService.hasValidAccessToken()) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};

import { HttpInterceptorFn } from '@angular/common/http';
import {inject} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {catchError, from, switchMap, throwError} from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService = inject(OAuthService);
  const token = oauthService.getAccessToken();

  if (token && oauthService.hasValidAccessToken()) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  const refreshToken = oauthService.getRefreshToken();

  if (refreshToken) {
    return from(oauthService.refreshToken()).pipe(
      switchMap(() => {
        const newToken = oauthService.getAccessToken();
        const authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` }
        });
        return next(authReq);
      }),
      catchError((error) => {
        console.error('Refresh token failed', error);
        oauthService.logOut();
        return throwError(() => error);
      })
    );
  }

  return next(req);
};

import { Injectable } from '@angular/core';
import {AuthConfig, OAuthService} from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private oauthService: OAuthService) {
    this.configure();
  }

  private configure() {
    const authConfig: AuthConfig = {
      issuer: 'http://localhost:9000',
      redirectUri: window.location.origin + '/callback',
      clientId: 'public-client',
      dummyClientSecret: 'secret',
      responseType: 'code',
      scope: 'openid',
      showDebugInformation: true,
      disablePKCE: true
    };

    this.oauthService.configure(authConfig);
  }

  login() {
    this.oauthService.initCodeFlow();
  }

  logout() {
    this.oauthService.logOut();
  }

  get identityClaims() {
    return this.oauthService.getIdentityClaims();
  }

  get token() {
    return this.oauthService.getAccessToken();
  }

  async initAuth(): Promise<void> {
    await this.oauthService.loadDiscoveryDocument();
    await this.oauthService.tryLoginCodeFlow();
  }
}

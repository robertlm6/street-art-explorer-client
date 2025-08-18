import { Injectable } from '@angular/core';
import {AuthConfig, OAuthService} from 'angular-oauth2-oidc';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface RegisterRequest {
  username: string,
  email: string,
  password: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private issuer = environment.authIssuer;

  constructor(private oauthService: OAuthService, private httpClient: HttpClient) {
    this.configure();
  }

  private configure() {
    const authConfig: AuthConfig = {
      issuer: this.issuer,
      redirectUri: environment.authRedirectUri,
      clientId: environment.authClientId,
      dummyClientSecret: 'secret',
      responseType: 'code',
      scope: 'openid',
      showDebugInformation: true,
      disablePKCE: true
    };

    this.oauthService.configure(authConfig);
  }

  register(body: RegisterRequest): Observable<any> {
    return this.httpClient.post(`${this.issuer}/user/register`, body);
  }

  registerAndLogin(body: RegisterRequest): Observable<any> {
    return new Observable(sub => {
      this.register(body).subscribe({
        next: (res) => { sub.next(res); sub.complete(); this.login(); },
        error: (err) => sub.error(err)
      });
    });
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

  getAccessToken(): string | null {
    return this.oauthService.getAccessToken();
  }

  isAuthenticated(): boolean {
    return this.oauthService.hasValidAccessToken();
  }

  async initAuth(): Promise<void> {
    await this.oauthService.loadDiscoveryDocument();
    await this.oauthService.tryLoginCodeFlow();
  }
}

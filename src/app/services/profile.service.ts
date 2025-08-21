import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';

export interface UserAppDto {
  authServerUserId: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  bio?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAppPatchRequest {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  bio?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private base = environment.resourceApi;

  constructor(private http: HttpClient) {}

  getProfile() {
    return this.http.get<UserAppDto>(`${this.base}/profile`);
  }

  patchProfile(body: Partial<UserAppPatchRequest>): Observable<UserAppDto> {
    return this.http.patch<UserAppDto>(`${this.base}/profile`, body);
  }
}

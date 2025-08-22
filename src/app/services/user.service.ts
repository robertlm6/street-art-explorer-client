import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';

export interface PublicUserDto {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private base = environment.resourceApi + '/users';

  constructor(private http: HttpClient) {}

  getPublic(id: number) {
    return this.http.get<PublicUserDto>(`${this.base}/${id}`);
  }

  getPublicMarkers(id: number, limit = 100) {
    return this.http.get<any[]>(`${this.base}/${id}/markers`, { params: { limit } as any });
  }
}

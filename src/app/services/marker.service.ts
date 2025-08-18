import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';


export interface MarkerDto {
  id: number;
  authServerUserId: number;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  address?: string;
  avgRating?: number;
  ratingsCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MarkerService {
  private base = environment.resourceApi;

  constructor(private httpClient: HttpClient) {}

   listByBbox(swLng: number, swLat: number, neLng: number, neLat: number, limit = 500): Observable<MarkerDto[]> {
     const params = new HttpParams()
       .set('minLat', Math.min(swLat, neLat))
       .set('maxLat', Math.max(swLat, neLat))
       .set('minLng', Math.min(swLng, neLng))
       .set('maxLng', Math.max(swLng, neLng))
       .set('limit', limit);
     return this.httpClient.get<MarkerDto[]>(`${this.base}/markers`, { params });
   }
}

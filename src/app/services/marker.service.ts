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
  photos?: MarkerPhotoDto[];
  ownedByMe?: boolean;
}

export interface MarkerPhotoDto {
  id: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  position?: number;
}

export interface CreateMarkerRequest {
  title: string;
  description?: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface UpdateMarkerRequest {
  title?: string;
  description?: string;
  lat?: number;
  lng?: number;
  address?: string;
}

export interface RatingSummary {
  avgRating: number;
  ratingsCount: number;
}
export interface RateResponse {
  score: number;
}

export interface AddPhotoRequest {
  publicId: string;
  url: string;
  secureUrl?: string;
  thumbnailUrl?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  position?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MarkerService {
  private base = environment.resourceApi + environment.markersEndpoint;

  constructor(private httpClient: HttpClient) {}

   listByBbox(minLat: number, maxLat: number, minLng: number, maxLng: number, limit = 200): Observable<MarkerDto[]> {
     const params = new HttpParams()
       .set('minLat', String(minLat))
       .set('maxLat', String(maxLat))
       .set('minLng', String(minLng))
       .set('maxLng', String(maxLng))
       .set('limit', String(limit));
     return this.httpClient.get<MarkerDto[]>(`${this.base}`, { params });
   }

  get(id: number) { return this.httpClient.get<MarkerDto>(`${this.base}/${id}`); }
  create(body: CreateMarkerRequest) { return this.httpClient.post<MarkerDto>(`${this.base}/create`, body); }
  update(id: number, body: UpdateMarkerRequest) { return this.httpClient.patch<MarkerDto>(`${this.base}/${id}`, body); }
  remove(id: number) { return this.httpClient.delete<void>(`${this.base}/${id}`); }

  rate(id: number, score: number) { return this.httpClient.post<RatingSummary>(`${this.base}/${id}/ratings`, { score }); }
  myRating(id: number) { return this.httpClient.get<RateResponse>(`${this.base}/${id}/ratings/me`); }
  deleteMyRating(id: number) { return this.httpClient.delete<RatingSummary>(`${this.base}/${id}/ratings/me`); }
  ratingSummary(id: number) { return this.httpClient.get<RatingSummary>(`${this.base}/${id}/ratings/summary`); }

  addPhoto(markerId: number, req: AddPhotoRequest) {
    return this.httpClient.post<MarkerPhotoDto>(`${this.base}/${markerId}/photos`, req);
  }
  deletePhoto(markerId: number, photoId: number) {
    return this.httpClient.delete<void>(`${this.base}/${markerId}/photos/${photoId}`);
  }
}

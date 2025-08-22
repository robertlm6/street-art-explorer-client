import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, map, of} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private base = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  private token = environment.mapboxToken;

  constructor(private http: HttpClient) {}

  reverse(lng: number, lat: number) {
    const url = `${this.base}/${lng},${lat}.json`;
    const params = new HttpParams()
      .set('access_token', this.token)
      .set('language', 'es')
      .set('types', 'address,poi,place,neighborhood,locality')
      .set('limit', 1);
    return this.http.get<any>(url, { params }).pipe(
      map(res => res?.features?.[0]?.place_name as string | undefined),
      catchError(err => {
        console.error('Reverse geocoding error', err);
        return of(undefined);
      })
    );
  }

  forward(query: string, limit = 5) {
    const url = `${this.base}/${encodeURIComponent(query)}.json`;
    const params = new HttpParams()
      .set('access_token', this.token)
      .set('language', 'en')
      .set('autocomplete', true)
      .set('types', 'address,poi,place,neighborhood,locality')
      .set('limit', limit);
    return this.http.get<any>(url, { params }).pipe(
      map(res => (res?.features ?? []).map((f: any) => ({
        text: f.text,
        place_name: f.place_name,
        center: f.center as [number, number]
      }))),
      catchError(err => {
        console.error('Forward geocoding error', err);
        return of([]);
      })
    );
  }
}

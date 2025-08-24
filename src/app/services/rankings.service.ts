import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {MarkerRankingItem, Paginated, Period, UserRankingItem} from '../models/rankings.models';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RankingsService {
  private http = inject(HttpClient);
  private base = environment.resourceApi;

  getUserRanking(period: Period, limit = 20, offset = 0): Observable<Paginated<UserRankingItem>> {
    const params = new HttpParams()
      .set('period', period)
      .set('limit', limit)
      .set('offset', offset);
    return this.http.get<Paginated<UserRankingItem>>(`${this.base}/rankings/users`, {params});
  }

  getMarkerRanking(period: Period, limit = 20, offset = 0): Observable<Paginated<MarkerRankingItem>> {
    const params = new HttpParams()
      .set('period', period)
      .set('limit', limit)
      .set('offset', offset);
    return this.http.get<Paginated<MarkerRankingItem>>(`${this.base}/rankings/markers`, {params});
  }
}

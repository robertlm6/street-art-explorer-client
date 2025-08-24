import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {FeedQuery, MarkerFeedItem} from '../models/feed.models';
import {Observable} from 'rxjs';
import {Paginated} from '../models/shared.models';

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private http = inject(HttpClient);
  private base = environment.resourceApi;

  getMarkersFeed(q: FeedQuery): Observable<Paginated<MarkerFeedItem>> {
    let params = new HttpParams()
      .set('type', q.type)
      .set('limit', String(q.limit ?? 20))
      .set('offset', String(q.offset ?? 0));

    if (q.lat != null) params = params.set('lat', String(q.lat));
    if (q.lng != null) params = params.set('lng', String(q.lng));
    if (q.radiusKm != null) params = params.set('radiusKm', String(q.radiusKm));
    if (q.days != null) params = params.set('days', String(q.days));
    if (q.minVotes != null) params = params.set('minVotes', String(q.minVotes));

    return this.http.get<Paginated<MarkerFeedItem>>(`${this.base}/feed/markers`, {params});
  }
}

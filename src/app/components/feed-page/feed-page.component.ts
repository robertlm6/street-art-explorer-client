import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FeedType, MarkerFeedItem} from '../../models/feed.models';
import {Paginated} from '../../models/shared.models';
import {FeedService} from '../../services/feed.service';
import {NavegationService} from '../../services/navegation.service';
import {FormsModule} from '@angular/forms';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatButtonModule} from '@angular/material/button';

type Tab = FeedType;

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatTooltipModule],
  templateUrl: './feed-page.component.html',
  styleUrl: './feed-page.component.css'
})
export class FeedPageComponent implements OnInit {

  constructor(private api: FeedService, private nav: NavegationService) {
  }

  tab = signal<Tab>('newest');
  showDetails = signal(false);

  radiusKm = signal<number>(10);
  usedLocationNote = signal<string>('');
  private currentLatLng: { lat: number; lng: number } | null = null;

  items = signal<MarkerFeedItem[]>([]);
  next = signal<number | null>(0);
  loading = signal(false);
  error = signal<string | null>(null);

  defaultThumb = 'no-image-available.jpg';
  defaultAvatar = 'default-avatar.jpg';

  ngOnInit(): void {
    this.reload();
  }

  setTab(t: Tab) {
    if (this.tab() !== t) {
      this.tab.set(t);
      this.reload();
    }
  }

  toggleDetails() {
    this.showDetails.update(v => !v);
  }

  onRadiusChange(v: number) {
    this.radiusKm.set(+v);
    this.reload();
  }

  private reload() {
    this.items.set([]);
    this.next.set(0);
    this.error.set(null);
    this.usedLocationNote.set('');
    if (this.tab() === 'nearby') this.resolveLocation().then(() => this.loadMore());
    else this.loadMore();
  }

  loadMore() {
    const next = this.next();
    if (next === null || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    const t = this.tab();
    const q: any = {type: t, limit: 20, offset: next};

    if (t === 'nearby') {
      const c = this.currentLatLng!;
      q.lat = c.lat;
      q.lng = c.lng;
      q.radiusKm = this.radiusKm();
    } else if (t === 'trending') q.days = 14;
    else if (t === 'top') q.minVotes = 3;

    this.api.getMarkersFeed(q).subscribe({
      next: (res: Paginated<MarkerFeedItem>) => {
        this.items.update(arr => arr.concat(res.items ?? []));
        this.next.set(res.nextOffset ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error loading feed');
        this.loading.set(false);
      }
    });
  }

  async resolveLocation(): Promise<void> {
    const fromBrowser = await this.getBrowserLocation().catch(() => null);
    const fromStorage = this.getStoredCenter();
    const fallback = {lat: 40.4168, lng: -3.7038};
    const coords = fromBrowser ?? fromStorage ?? fallback;
    this.currentLatLng = coords;

    const note =
      fromBrowser ? 'Using your current location.' :
        fromStorage ? 'Using your last map center.' :
          'Using default center (Madrid).';
    this.usedLocationNote.set(note);
  }

  private getBrowserLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject('no-geolocation');
      navigator.geolocation.getCurrentPosition(
        pos => resolve({lat: pos.coords.latitude, lng: pos.coords.longitude}),
        () => reject('denied'),
        {enableHighAccuracy: false, timeout: 7000, maximumAge: 30000}
      );
    });
  }

  private getStoredCenter(): { lat: number; lng: number } | null {
    try {
      const raw = localStorage.getItem('sae:lastMapCenter');
      if (!raw) return null;
      const {lat, lng} = JSON.parse(raw);
      return (typeof lat === 'number' && typeof lng === 'number') ? {lat, lng} : null;
    } catch {
      return null;
    }
  }

  goToMarker(m: MarkerFeedItem) {
    const coords = (m.lat != null && m.lng != null) ? {lat: m.lat, lng: m.lng} : undefined;
    this.nav.focusMarker(m.markerId, coords);
  }

  goToUser(userId: number) {
    this.nav.goToUserProfile(userId);
  }

  track = (_: number, it: MarkerFeedItem) => it.markerId;
}

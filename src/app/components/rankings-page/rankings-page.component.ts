import {Component, OnInit, signal} from '@angular/core';
import {MarkerRankingItem, Period, UserRankingItem} from '../../models/rankings.models';
import {RankingsService} from '../../services/rankings.service';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {NavegationService} from '../../services/navegation.service';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatButtonModule} from '@angular/material/button';

type Tab = 'users' | 'markers';

@Component({
  selector: 'app-rankings-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule, MatIconModule, MatButtonToggleModule, MatButtonModule],
  templateUrl: './rankings-page.component.html',
  styleUrl: './rankings-page.component.css'
})
export class RankingsPageComponent implements OnInit {
  defaultAvatar = '/default-avatar.jpg';

  constructor(private api: RankingsService, private nav: NavegationService) {
  }

  tab = signal<Tab>('users');
  period = signal<Period>('month');

  users = signal<UserRankingItem[]>([]);
  usersNext = signal<number | null>(0);
  usersLoading = signal(false);
  usersError = signal<string | null>(null);

  markers = signal<MarkerRankingItem[]>([]);
  markersNext = signal<number | null>(0);
  markersLoading = signal(false);
  markersError = signal<string | null>(null);

  ngOnInit(): void {
    this.reloadUsers(this.period());
  }

  setTab(t: Tab) {
    if (this.tab() === t) return;
    this.tab.set(t);
    if (t === 'users') this.reloadUsers(this.period());
    else this.reloadMarkers(this.period());
  }

  setPeriod(p: Period) {
    if (this.period() === p) return;
    this.period.set(p);
    if (this.tab() === 'users') this.reloadUsers(p);
    else this.reloadMarkers(p);
  }

  reloadUsers(p: Period) {
    this.users.set([]);
    this.usersNext.set(0);
    this.loadMoreUsers(p);
  }

  loadMoreUsers(p: Period) {
    const next = this.usersNext();
    if (next === null || this.usersLoading()) return;
    this.usersLoading.set(true);
    this.usersError.set(null);

    this.api.getUserRanking(p, 20, next).subscribe({
      next: (res) => {
        this.users.update(arr => arr.concat(res.items ?? []));
        this.usersNext.set(res.nextOffset ?? null);
        this.usersLoading.set(false);
      },
      error: (err) => {
        this.usersError.set(err?.error?.message ?? 'Could not load users ranking');
        this.usersLoading.set(false);
      }
    });
  }

  reloadMarkers(p: Period) {
    this.markers.set([]);
    this.markersNext.set(0);
    this.loadMoreMarkers(p);
  }

  loadMoreMarkers(p: Period) {
    const next = this.markersNext();
    if (next === null || this.markersLoading()) return;
    this.markersLoading.set(true);
    this.markersError.set(null);

    this.api.getMarkerRanking(p, 20, next).subscribe({
      next: (res) => {
        this.markers.update(arr => arr.concat(res.items ?? []));
        this.markersNext.set(res.nextOffset ?? null);
        this.markersLoading.set(false);
      },
      error: (err) => {
        this.markersError.set(err?.error?.message ?? 'Could not load markers ranking');
        this.markersLoading.set(false);
      }
    });
  }

  showDetails = signal(false);

  toggleDetails() {
    this.showDetails.update(v => !v);
  }

  trackUser = (_: number, u: UserRankingItem) => u.userId;
  trackMarker = (_: number, m: any) => (m.markerId ?? m.id);

  goToUser(userId: number) {
    this.nav.goToUserProfile(userId);
  }

  goToMarker(m: { markerId: number; lat?: number; lng?: number }) {
    this.nav.focusMarker(m.markerId, (m.lat != null && m.lng != null) ? {lat: m.lat, lng: m.lng} : undefined);
  }
}

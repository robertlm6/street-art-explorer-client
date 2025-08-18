import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import mapboxgl, {Map, LngLatLike, Marker, Popup} from 'mapbox-gl';
import {MarkerDto, MarkerService} from '../../services/marker.service';
import {environment} from '../../../environments/environment';
import {debounceTime, Subject} from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy{
  private map?: Map;
  private markers: Marker[] = [];
  private move$ = new Subject<void>();

  constructor(private markersApi: MarkerService, private zone: NgZone) {}

  ngOnInit(): void {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    // Location by default: Madrid
    const center: LngLatLike = [-3.7038, 40.4168];
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 12
    });

    this.map.addControl(new mapboxgl.NavigationControl());

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const userCenter: LngLatLike = [pos.coords.longitude, pos.coords.latitude];
          this.map?.setCenter(userCenter);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    this.map.on('load', () => {
      this.loadMarkersInView();
      this.map?.on('moveend', () => this.move$.next());
    });

    this.move$.pipe(debounceTime(250)).subscribe(() => this.loadMarkersInView());
  }

  private loadMarkersInView(): void {
    if (!this.map) return;
    const b = this.map.getBounds();
    if (!b) return;

    const sw = b.getSouthWest();
    const ne = b.getNorthEast();

    this.markersApi
      .listByBbox(sw.lng, sw.lat, ne.lng, ne.lat)
      .subscribe({
        next: list => this.renderMarkers(list),
        error: err => console.error('Error loading markers (bbox)', err)
      });
  }

  private renderMarkers(list: MarkerDto[]): void {
    this.markers.forEach(m => m.remove());
    this.markers = [];

    list.forEach(m => {
      const popupHtml = `
        <div style="max-width:240px">
          <h4 style="margin:0 0 4px 0;">${escapeHtml(m.title)}</h4>
          ${m.avgRating != null ? `<div style="font-size:12px;opacity:.8">⭐ ${m.avgRating?.toFixed?.(1) ?? m.avgRating} (${m.ratingsCount ?? 0})</div>` : ''}
          ${m.description ? `<p style="margin:8px 0 0 0;">${escapeHtml(m.description)}</p>` : ''}
          ${m.address ? `<p style="margin:8px 0 0 0; font-size:12px; opacity:.8">${escapeHtml(m.address)}</p>` : ''}
        </div>
      `;
      const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker()
        .setLngLat([m.lng, m.lat])
        .setPopup(popup)
        .addTo(this.map!);

      this.markers.push(marker);
    });
  }

  ngOnDestroy(): void {
    this.markers.forEach(m => m.remove());
    this.map?.remove();
    this.move$.complete();
  }
}

function escapeHtml(s?: string): string {
  if (!s) return '';
  return s.replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as any)[c]
  );
}

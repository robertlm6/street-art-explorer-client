import {AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import mapboxgl, {Map, LngLatLike, Marker} from 'mapbox-gl';
import {MarkerDto, MarkerService} from '../../services/marker.service';
import {environment} from '../../../environments/environment';
import {debounceTime, filter, Subject} from 'rxjs';
import {MatDrawer, MatSidenavModule} from '@angular/material/sidenav';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import _MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

const MapboxGeocoder: any = (_MapboxGeocoder as any)?.default ?? _MapboxGeocoder;

@Component({
  selector: 'app-home',
  imports: [
    CommonModule, MatSidenavModule, RouterOutlet, MatIconModule, MatButtonModule
  ],
  templateUrl: './home.component.html',
  standalone: true,
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit{
  private map?: Map;
  private markers: Marker[] = [];
  private move$ = new Subject<void>();
  private geocoder: MapboxGeocoder | null = null;

  @ViewChild('detailDrawer') detailDrawer!: MatDrawer;

  constructor(private markersApi: MarkerService, private zone: NgZone, private router: Router, private route: ActivatedRoute) {}

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

      const geocoder = new MapboxGeocoder({
        accessToken: environment.mapboxToken,
        mapboxgl: mapboxgl as any,
        marker: false,
        placeholder: 'Search an address',
        countries: 'es',
        language: 'es'
      }) as any;

      this.geocoder = geocoder;
      (window as any).mapboxGeocoder = this.geocoder;

      this.map!.addControl(geocoder, 'top-left');

      geocoder.on('result', (e: any) => {
        const [lng, lat] = e.result.center;
        const place = e.result.place_name as string;
        this.zone.run(() => {
          this.router.navigate(
            [{ outlets: { detail: ['marker', 'new'] } }],
            { relativeTo: this.route, queryParams: { lat, lng, address: place } }
          );
        });
      });

      this.map!.on('contextmenu', (e: mapboxgl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        this.zone.run(() => {
          this.router.navigate(
            [{ outlets: { detail: ['marker', 'new'] } }],
            { relativeTo: this.route, queryParams: { lat, lng } }
          );
        });
      });
    });

    this.move$.pipe(debounceTime(250)).subscribe(() => this.loadMarkersInView());

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const hasDetail = this.route.children.some(c => c.outlet === 'detail');
        if (!this.detailDrawer) return;
        if (hasDetail) this.detailDrawer.open();
        else this.detailDrawer.close();
      });
  }

  private loadMarkersInView(): void {
    if (!this.map) return;
    const b = this.map.getBounds();
    if (!b) return;

    const sw = b.getSouthWest();
    const ne = b.getNorthEast();

    this.markersApi
      .listByBbox(sw.lat, ne.lat, sw.lng, ne.lng, 200)
      .subscribe({
        next: list => this.renderMarkers(list),
        error: err => console.error('Error loading markers (bbox)', err)
      });
  }

  startCreate() {
    const center = this.map?.getCenter();
    const queryParams = center ? { lat: center.lat, lng: center.lng } : {};
    this.router.navigate(
      [{ outlets: { detail: ['marker', 'new'] } }],
      { relativeTo: this.route, queryParams }
    );
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

      const popup = new mapboxgl.Popup({ offset: 24, closeButton: false }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker()
        .setLngLat([m.lng, m.lat])
        .setPopup(popup)
        .addTo(this.map!);

      const el = marker.getElement();
      let hoverTimeout: any;

      el.addEventListener('mouseenter', () => popup.addTo(this.map!));
      el.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => popup.remove(), 200);
      });

      popup.on('open', () => {
        const p = popup.getElement();
        if (!p) return;
        p.addEventListener('mouseenter', () => clearTimeout(hoverTimeout));
        p.addEventListener('mouseleave', () => popup.remove());
      });

      el.addEventListener('click', () => {
        this.zone.run(() => {
          this.router.navigate([{ outlets: { detail: ['marker', m.id] } }], { relativeTo: this.route });
        });
      });

      this.markers.push(marker);
    });
  }

  ngOnDestroy(): void {
    this.markers.forEach(m => m.remove());
    if (this.geocoder && this.map) {
      try { this.map.removeControl(this.geocoder); } catch {}
    }
    this.map?.remove();
    this.move$.complete();
  }

  ngAfterViewInit(): void {
    this.detailDrawer.openedChange.subscribe(() => {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
    });
  }

  onDrawerOpenedChange(opened: boolean) {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 200);

    if (!opened) {
      this.router.navigate(
        [{ outlets: { detail: null } }],
        { relativeTo: this.route, queryParamsHandling: 'preserve' }
      );
    }
  }
}

function escapeHtml(s?: string): string {
  if (!s) return '';
  return s.replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as any)[c]
  );
}

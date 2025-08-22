import {AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import mapboxgl, {LngLatLike, Map as MapboxMap, Marker} from 'mapbox-gl';
import {MarkerDto, MarkerService} from '../../services/marker.service';
import {environment} from '../../../environments/environment';
import {debounceTime, filter, Subject} from 'rxjs';
import {MatDrawer, MatSidenavModule} from '@angular/material/sidenav';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet, UrlTree} from '@angular/router';
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
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private map?: MapboxMap;
  private markers: Marker[] = [];
  private lastList: MarkerDto[] = [];
  private move$ = new Subject<void>();
  private geocoder: MapboxGeocoder | null = null;
  private tempMarker?: mapboxgl.Marker;
  private markersById = new Map<number, Marker>();
  private pendingCenter?: { lng: number; lat: number; z: number };
  private pendingFocusId?: number;

  defaultAvatar = '/default-avatar.jpg';

  @ViewChild('detailDrawer') detailDrawer!: MatDrawer;

  constructor(private markersApi: MarkerService, private zone: NgZone, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    this.markersApi.markerCreated$.subscribe(created => {
      this.tempMarker?.remove();
      this.tempMarker = undefined;

      this.lastList = [...this.lastList, created];
      this.renderMarkers(this.lastList);
    });

    this.markersApi.markerUpdated$.subscribe(updated => {
      this.lastList = this.lastList.map(m =>
        m.id === updated.id ? updated : m
      );
      this.renderMarkers(this.lastList);
    });

    this.markersApi.markerDeleted$.subscribe(id => {
      this.lastList = this.lastList.filter(m => m.id !== id);
      this.renderMarkers(this.lastList);
    });

    this.route.queryParamMap.subscribe(qp => {
      const latStr = qp.get('lat');
      const lngStr = qp.get('lng');
      const zStr = qp.get('z');
      const focusStr = qp.get('focus');

      if (latStr !== null && lngStr !== null && latStr !== '' && lngStr !== '') {
        const lat = Number(latStr);
        const lng = Number(lngStr);
        const z = zStr && zStr !== '' ? Number(zStr) : 15;

        if (isFinite(lat) && isFinite(lng)) {
          if (this.map && this.map.loaded()) {
            this.map.flyTo({center: [lng, lat], zoom: z});
          } else {
            this.pendingCenter = {lng, lat, z};
          }
        }
      }

      if (focusStr !== null && focusStr !== '') {
        const focus = Number(focusStr);
        if (isFinite(focus) && focus > 0) {
          this.pendingFocusId = focus;
          this.tryOpenPendingPopup();
        }
      }
    });

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
        () => {
        },
        {enableHighAccuracy: true, timeout: 5000}
      );
    }

    this.map.on('load', () => {
      this.map?.on('moveend', () => this.move$.next());

      if (this.pendingCenter) {
        const {lng, lat, z} = this.pendingCenter;
        this.map!.jumpTo({center: [lng, lat], zoom: z}); // jumpTo para que sea inmediato
        this.pendingCenter = undefined;
      }

      this.loadMarkersInView();

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

        this.showTempMarker(lng, lat);

        this.zone.run(() => {
          this.router.navigate(
            [{outlets: {detail: ['marker', 'new']}}],
            {relativeTo: this.route, queryParams: {lat, lng, address: place}}
          );
        });
      });

      this.map!.on('contextmenu', (e: mapboxgl.MapMouseEvent) => {
        const {lng, lat} = e.lngLat;
        this.showTempMarker(lng, lat);
        this.zone.run(() => {
          this.router.navigate(
            [{outlets: {detail: ['marker', 'new']}}],
            {relativeTo: this.route, queryParams: {lat, lng}}
          );
        });
      });
    });

    this.move$.pipe(debounceTime(250)).subscribe(() => this.loadMarkersInView());

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const hasDetail = this.hasDetailOutlet(this.router.routerState.root);
        if (hasDetail) {
          this.detailDrawer?.open();
        } else {
          this.detailDrawer?.close();
        }
      });
  }

  private hasDetailOutlet(route: ActivatedRoute | null): boolean {
    if (!route) return false;
    for (const child of route.children) {
      if (child.outlet === 'detail') return true;
      if (this.hasDetailOutlet(child)) return true;
    }
    return false;
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
        next: list => {
          this.lastList = list;
          this.renderMarkers(list)
        },
        error: err => console.error('Error loading markers (bbox)', err)
      });
  }

  startCreate() {
    const center = this.map?.getCenter();
    const queryParams = center ? {lat: center.lat, lng: center.lng} : {};
    this.router.navigate(
      [{outlets: {detail: ['marker', 'new']}}],
      {relativeTo: this.route, queryParams}
    );
  }

  private renderMarkers(list: MarkerDto[]): void {
    this.markers.forEach(m => m.remove());
    this.markers = [];
    this.markersById.clear();

    list.forEach(m => {
      const img = m.coverPhotoUrl
        ? `<img src="${escapeHtml(m.coverPhotoUrl)}"
           onerror="this.style.display='none'"
           style="width:100%;border-radius:8px;margin-bottom:6px">`
        : '';

      const popupHtml = `
      <div style="max-width:240px">
        ${img}
        <h4 style="margin:0 0 4px 0;">${escapeHtml(m.title)}</h4>
        ${m.owner?.username ? `<div style="font-size:12px;opacity:.85;display:flex;align-items:center;gap:6px">
          <img src="${escapeHtml(m.owner.avatarUrl || this.defaultAvatar)}" onerror="this.style.display='none'"
               style="width:16px;height:16px;border-radius:50%;object-fit:cover">
          <span>@${escapeHtml(m.owner.username)}</span>
        </div>` : ''}
        ${m.avgRating != null ? `<div style="font-size:12px;opacity:.8;margin-top:2px">⭐ ${m.avgRating?.toFixed?.(1) ?? m.avgRating} (${m.ratingsCount ?? 0})</div>` : ''}
        ${m.address ? `<p style="margin:8px 0 0 0; font-size:12px; opacity:.8">${escapeHtml(m.address)}</p>` : ''}
      </div>
    `;

      const popup = new mapboxgl.Popup({offset: 24, closeButton: false}).setHTML(popupHtml);

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
          this.router.navigate(
            [{outlets: {detail: ['marker', m.id]}}],
            {
              relativeTo: this.route,
              queryParams: {lat: null, lng: null, z: null, focus: null},
              queryParamsHandling: 'merge'
            }
          );
        });
      });

      this.markers.push(marker);
      this.markersById.set(m.id, marker);
    });

    this.tryOpenPendingPopup();
  }

  private showTempMarker(lng: number, lat: number) {
    this.tempMarker?.remove();

    const el = document.createElement('div');
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.boxShadow = '0 0 0 3px rgba(33,150,243,.25)';
    el.style.background = '#2196f3';
    el.style.opacity = '0.85';
    el.style.border = '2px solid white';

    this.tempMarker = new mapboxgl.Marker({element: el, draggable: false})
      .setLngLat([lng, lat])
      .addTo(this.map!);
  }

  ngOnDestroy(): void {
    this.markers.forEach(m => m.remove());
    if (this.geocoder && this.map) {
      try {
        this.map.removeControl(this.geocoder);
      } catch {
      }
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
      this.tempMarker?.remove();
      this.tempMarker = undefined;
      this.router.navigate(
        [{outlets: {detail: null}}],
        {
          relativeTo: this.route,
          queryParams: {lat: null, lng: null, z: null, focus: null},
          queryParamsHandling: 'merge'
        }
      );
    }
  }

  private tryOpenPendingPopup() {
    if (!this.pendingFocusId || !this.map) return;
    const mk = this.markersById.get(this.pendingFocusId);
    if (!mk) return;

    const pop = mk.getPopup?.();
    if (pop) pop.addTo(this.map!);
    this.pendingFocusId = undefined;
  }

  onDetailActivated() {
    this.detailDrawer?.open();
    setTimeout(() => window.dispatchEvent(new Event('resize')), 0);

    const tree: UrlTree = this.router.parseUrl(this.router.url);
    const detailSegs = tree.root.children['detail']?.segments.map(s => s.path).join('/') || '';
    const isNew = detailSegs === 'marker/new';

    if (!isNew) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {focus: null},
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  onDetailDeactivated() {
    this.detailDrawer?.close();
  }
}

function escapeHtml(s?: string): string {
  if (!s) return '';
  return s.replace(/[&<>"']/g, c =>
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'} as any)[c]
  );
}

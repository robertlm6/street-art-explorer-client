import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {environment} from '../../../environments/environment';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import {MatDialogModule, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-geocoder-dialog',
  imports: [CommonModule, MatDialogModule],
  templateUrl: './geocoder-dialog.component.html',
  standalone: true,
  styleUrl: './geocoder-dialog.component.css'
})
export class GeocoderDialogComponent implements OnInit, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  private geocoder?: MapboxGeocoder;

  constructor(private ref: MatDialogRef<GeocoderDialogComponent>) {}

  ngOnInit(): void {
    (mapboxgl as any).accessToken = environment.mapboxToken;

    this.geocoder = new MapboxGeocoder({
      accessToken: environment.mapboxToken,
      mapboxgl: mapboxgl as any,
      marker: false,
      placeholder: 'Search an address',
      countries: 'es',
      language: 'es'
    });

    const el = this.geocoder.onAdd(null as any);
    this.host.nativeElement.appendChild(el);

    setTimeout(() => {
      const input: HTMLInputElement | null = this.host.nativeElement.querySelector('input');
      input?.focus();
    }, 0);

    this.geocoder.on('result', (e: any) => {
      const [lng, lat] = e.result.center;
      const place = e.result.place_name as string;
      this.ref.close({ lat, lng, address: place });
    });

    this.geocoder.on('clear', () => { /* noop */ });
  }

  ngOnDestroy(): void {
    try {
      const ctrlEl = this.host.nativeElement.querySelector('.mapboxgl-ctrl-geocoder');
      ctrlEl?.parentElement?.removeChild(ctrlEl);
    } catch {}
  }
}

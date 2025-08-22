import {Component, OnDestroy, OnInit} from '@angular/core';
import {AddPhotoRequest, MarkerDto, MarkerService, UpdateMarkerRequest} from '../../services/marker.service';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {filter, Subscription, switchMap} from 'rxjs';
import {ActivatedRoute, NavigationEnd, Router, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {CommonModule, DecimalPipe} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {GeocodingService} from '../../services/geocoding.service';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {GeocoderDialogComponent} from '../geocoder-dialog/geocoder-dialog.component';
import {MatDividerModule} from '@angular/material/divider';
import {CloudinaryService} from '../../services/cloudinary.service';

@Component({
  selector: 'app-marker-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatDividerModule,
    DecimalPipe,
    RouterLink
  ],
  templateUrl: './marker-detail.component.html',
  standalone: true,
  styleUrl: './marker-detail.component.css'
})
export class MarkerDetailComponent implements OnInit, OnDestroy {
  marker?: MarkerDto;
  private original?: MarkerDto;
  form!: FormGroup;
  editing = false;
  myScore?: number;
  isNew = false;
  private sub = new Subscription();

  defaultAvatar = '/default-avatar.jpg';

  get inDrawer(): boolean {
    const tree = this.router.parseUrl(this.router.url);
    return !!tree.root.children['detail'];
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private markers: MarkerService,
    private geocode: GeocodingService,
    private cloudinary: CloudinaryService,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew = idParam === 'new';

    if (this.isNew) {
      const lat = Number(this.route.snapshot.queryParamMap.get('lat') ?? 0) || 0;
      const lng = Number(this.route.snapshot.queryParamMap.get('lng') ?? 0) || 0;
      const initialAddress = this.route.snapshot.queryParamMap.get('address') ?? '';

      this.marker = {
        id: 0 as any,
        authServerUserId: 0 as any,
        title: '',
        description: '',
        address: '',
        lat, lng,
        avgRating: 0, ratingsCount: 0,
        photos: [],
        ownedByMe: true
      };

      this.form = this.fb.group({
        title: [''],
        description: [''],
        address: [initialAddress],
        lat: [lat],
        lng: [lng],
      });

      this.editing = true;

      if (lat && lng) {
        this.geocode.reverse(lng, lat).subscribe(addr => {
          if (addr) this.form.patchValue({address: addr});
        });
      }

      let t: any;
      this.form.get('lat')!.valueChanges.subscribe(() => {
        clearTimeout(t);
        t = setTimeout(() => this.reverseNow(), 400);
      });
      this.form.get('lng')!.valueChanges.subscribe(() => {
        clearTimeout(t);
        t = setTimeout(() => this.reverseNow(), 400);
      });

      return;
    }

    this.sub.add(
      this.route.paramMap.pipe(
        switchMap(pm => this.markers.get(Number(pm.get('id'))))
      ).subscribe(m => {
        this.marker = m;
        this.original = {...m};
        this.form = this.fb.group({
          title: [m.title],
          description: [m.description],
          address: [m.address],
          lat: [m.lat],
          lng: [m.lng],
        });
      })
    );

    this.applyEditFromUrl();

    this.sub.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => this.applyEditFromUrl())
    );

    this.sub.add(
      this.route.paramMap.subscribe(pm => {
        const id = Number(pm.get('id'));
        this.markers.myRating(id).subscribe({
          next: r => this.myScore = r?.score,
          error: _ => this.myScore = undefined
        });
      })
    );
  }

  close(): void {
    if (this.inDrawer) {
      this.router.navigate([{outlets: {detail: null}}], {queryParamsHandling: 'preserve'});
    } else {
      this.router.navigate(['/home']);
    }
  }

  enableEdit(): void {
    this.editing = true;
    this.router.navigate([], {
      relativeTo: this.route.parent || this.route,
      queryParams: {edit: 'true'},
      queryParamsHandling: 'merge'
    });
  }

  disableEdit(): void {
    this.editing = false;
    this.router.navigate([], {
      relativeTo: this.route.parent || this.route,
      queryParams: {edit: null},
      queryParamsHandling: 'merge'
    });
  }

  save(): void {
    if (!this.marker) return;

    if (this.isNew) {
      const payload = {
        title: (this.form.value.title ?? '').trim(),
        description: this.form.value.description ?? '',
        address: this.form.value.address ?? '',
        lat: Number(this.form.value.lat),
        lng: Number(this.form.value.lng)
      };

      this.markers.create(payload).subscribe({
        next: created => {
          created.ownedByMe = true;
          this.marker = created;
          this.original = {...created};
          this.isNew = false;
          this.editing = false;

          this.markers.emitMarkerCreated(created);

          this.router.navigate(
            [{outlets: {detail: ['marker', created.id]}}],
            {
              relativeTo: this.route.parent || this.route,
              queryParams: {edit: null},
              queryParamsHandling: 'merge',
              replaceUrl: true
            }
          );

          this.reloadMarkerAndBroadcast(created.id);
        },
        error: _ => alert('It was not possible to create the marker (check the data)')
      });
      return;
    }

    const id = this.marker.id;
    const curr = this.form.value;
    const orig = this.original!;

    const body: UpdateMarkerRequest = {};
    const fields: (keyof UpdateMarkerRequest)[] = ['title', 'description', 'address', 'lat', 'lng'];

    for (const f of fields) {
      let v: any = (curr as any)[f];
      if (f === 'lat' || f === 'lng') v = Number(v);
      if (v !== (orig as any)[f]) {
        (body as any)[f] = v;
      }
    }

    if (Object.keys(body).length === 0) {
      this.disableEdit();
      return;
    }

    this.markers.update(id, body).subscribe({
      next: m => {
        m.ownedByMe = true;
        this.marker = m;
        this.original = {...m};
        this.disableEdit();

        this.markers.emitMarkerUpdated(m);
        this.reloadMarkerAndBroadcast(id);
      },
      error: _ => alert('It was not possible to save the marker (are you the owner?)')
    });
  }

  remove(): void {
    if (this.isNew) {
      this.close();
      return;
    }
    if (!this.marker) return;
    if (!confirm('Are you sure you want to delete this marker?')) return;
    this.markers.remove(this.marker.id).subscribe({
      next: () => {
        this.markers.emitMarkerDeleted(this.marker!.id);
        this.close()
      },
      error: _ => alert('It was not possible to delete the marker (are you the owner?)')
    });
  }

  setScore(s: number): void {
    if (!this.marker) return;
    this.markers.rate(this.marker.id, s).subscribe({
      next: sum => {
        this.marker!.avgRating = sum.avgRating;
        this.marker!.ratingsCount = sum.ratingsCount;
        this.myScore = s;

        this.markers.emitMarkerUpdated(this.marker!);
      },
      error: _ => alert('It was not possible to rate the marker (you cannot rate your own marker)')
    });
  }

  deleteMyScore(): void {
    if (!this.marker) return;
    this.markers.deleteMyRating(this.marker.id).subscribe({
      next: sum => {
        this.marker!.avgRating = sum.avgRating;
        this.marker!.ratingsCount = sum.ratingsCount;
        this.myScore = undefined;

        this.markers.emitMarkerUpdated(this.marker!);
      }
    });
  }

  addPhoto(): void {
    if (!this.marker || this.isNew) return;

    this.cloudinary.openUploadWidget(
      {folder: `markers/${this.marker.id}`, multiple: false, maxFiles: 1},
      (info) => {
        const req: AddPhotoRequest = {
          publicId: info.public_id,
          url: info.url,
          secureUrl: info.secure_url,
          thumbnailUrl: info.thumbnail_url ?? info.derived?.[0]?.secure_url,
          format: info.format,
          width: info.width,
          height: info.height,
          bytes: info.bytes,
          position: (this.marker!.photos?.length ?? 0)
        };

        this.markers.addPhoto(this.marker!.id, req).subscribe({
          next: photo => {
            this.marker!.photos = [...(this.marker!.photos ?? []), photo];
            this.markers.emitMarkerUpdated(this.marker!);
            this.reloadMarkerAndBroadcast(this.marker!.id);
          },
          error: _ => alert('It was not possible to add the photo (are you the owner?)')
        });
      }
    );
  }

  deletePhoto(photoId: number): void {
    if (!this.marker) return;
    if (!confirm('Are you sure you want to delete this photo?')) return;

    this.markers.deletePhoto(this.marker.id, photoId).subscribe({
      next: () => {
        this.marker!.photos = (this.marker!.photos ?? []).filter(p => p.id !== photoId);

        if (this.marker!.coverPhotoId === photoId) {
          this.marker!.coverPhotoId = undefined;
          this.marker!.coverPhotoUrl = undefined;
        }

        this.markers.emitMarkerUpdated(this.marker!);
        this.reloadMarkerAndBroadcast(this.marker!.id);
      },
      error: _ => alert('It was not possible to delete the photo (are you the owner?)')
    });
  }

  makeCover(photoId: number) {
    if (!this.marker) return;
    this.markers.setCover(this.marker.id, photoId).subscribe({
      next: () => {
        this.marker!.coverPhotoId = photoId;
        const ph = (this.marker!.photos || []).find(p => p.id === photoId);
        this.marker!.coverPhotoUrl = ph?.url || ph?.thumbnailUrl;
        this.markers.emitMarkerUpdated(this.marker!);
        this.reloadMarkerAndBroadcast(this.marker!.id);
      },
      error: _ => alert('Could not set cover')
    });
  }

  private reloadMarkerAndBroadcast(id: number) {
    this.markers.get(id).subscribe(full => {
      full.ownedByMe = true;
      this.marker = full;
      this.original = {...full};
      this.markers.emitMarkerUpdated(full);
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private reverseNow() {
    const lat = Number(this.form.value.lat), lng = Number(this.form.value.lng);
    if (!isFinite(lat) || !isFinite(lng)) return;
    if (this.form.dirty && this.form.get('address')?.dirty) return;
    this.geocode.reverse(lng, lat).subscribe(addr => {
      if (addr) this.form.patchValue({address: addr}, {emitEvent: false});
    });
  }

  private applyEditFromUrl(): void {
    const tree = this.router.parseUrl(this.router.url);
    this.editing = tree.queryParams['edit'] === 'true';
  }

  openGeocoder(): void {
    const ref = this.dialog.open(GeocoderDialogComponent, {
      width: '500px',
      height: '400px',
      maxHeight: '90vh',
    });

    ref.afterClosed().subscribe(res => {
      if (!res) return;
      const {lat, lng, address} = res;

      this.form.patchValue({lat, lng, address});

      if (this.isNew && this.marker) {
        this.marker.lat = lat;
        this.marker.lng = lng;
        this.marker.address = address;
      }
    });
  }
}

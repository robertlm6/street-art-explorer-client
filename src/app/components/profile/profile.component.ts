import {Component, OnInit} from '@angular/core';
import {ProfileService} from '../../services/profile.service';
import {CloudinaryService} from '../../services/cloudinary.service';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MarkerDto} from '../../services/marker.service';
import {UserService} from '../../services/user.service';
import {MatIconModule} from '@angular/material/icon';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  standalone: true,
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  me: any | undefined;
  form!: FormGroup;
  loading = false;
  saving = false;
  error = '';

  markers: MarkerDto[] = [];
  stats = {markers: 0, totalRatings: 0, weightedAvg: null as number | null};

  defaultAvatar = '/default-avatar.jpg';

  constructor(
    private fb: FormBuilder,
    private profile: ProfileService,
    private users: UserService,
    private cloudinary: CloudinaryService
  ) {
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.profile.getProfile().subscribe({
      next: u => {
        this.me = u;
        this.form = this.fb.group({
          firstName: [u.firstName || ''],
          lastName: [u.lastName || ''],
          bio: [u.bio || '']
        });

        if (u.id) {
          this.users.getPublicMarkers(u.id, 200).subscribe({
            next: list => {
              this.markers = list || [];
              this.computeStats(this.markers);
            }
          });
        }
      },
      error: _ => this.error = 'Profile could not be loaded',
      complete: () => this.loading = false
    });
  }

  save(): void {
    if (!this.me) return;

    const body: any = {};
    const v = this.form.value;

    if (v.firstName !== this.me.firstName) body.firstName = (v.firstName ?? '').trim();
    if (v.lastName !== this.me.lastName) body.lastName = (v.lastName ?? '').trim();
    if (v.bio !== this.me.bio) body.bio = (v.bio ?? '').trim();

    if (Object.keys(body).length === 0) return;

    this.saving = true;
    this.profile.patchProfile(body).subscribe({
      next: updated => {
        this.me = {...this.me, ...updated};
      },
      error: _ => alert('Could not save profile'),
      complete: () => this.saving = false
    });
  }

  changeAvatar(): void {
    this.cloudinary.openUploadWidget(
      {folder: `avatars/${this.me?.id}`, multiple: false, maxFiles: 1},
      (info) => {
        this.profile.patchProfile({avatarUrl: info.secure_url, avatarPublicId: info.public_id}).subscribe({
          next: updated => {
            if (this.me) {
              this.me.avatarUrl = updated.avatarUrl;
              this.me.avatarPublicId = updated.avatarPublicId;
            }
          },
          error: _ => alert('Could not update avatar')
        });
      }
    );
  }

  removeAvatar(): void {
    this.profile.patchProfile({avatarUrl: ''}).subscribe({
      next: updated => {
        if (this.me) {
          this.me.avatarUrl = null;
          this.me.avatarPublicId = null;
        }
      },
      error: _ => alert('Could not remove avatar')
    });
  }

  hideImg(ev: Event) {
    (ev.target as HTMLImageElement).style.display = 'none';
  }

  private computeStats(list: MarkerDto[]): void {
    const totals = list.reduce((acc, m) => {
      const r = m.ratingsCount ?? 0;
      const a = m.avgRating ?? 0;
      acc.totalRatings += r;
      acc.weightedSum += a * r;
      return acc;
    }, {totalRatings: 0, weightedSum: 0});

    const weightedAvg = totals.totalRatings > 0 ? (totals.weightedSum / totals.totalRatings) : null;

    this.stats = {
      markers: list.length,
      totalRatings: totals.totalRatings,
      weightedAvg
    };
  }
}

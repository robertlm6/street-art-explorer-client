import {Component, OnInit} from '@angular/core';
import {PublicUserDto, UserService} from '../../services/user.service';
import {MarkerDto} from '../../services/marker.service';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-user-public',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './user-public.component.html',
  styleUrl: './user-public.component.css'
})
export class UserPublicComponent implements OnInit {
  user?: PublicUserDto;
  markers: MarkerDto[] = [];
  loading = true;
  error = '';

  stats = {
    markers: 0,
    totalRatings: 0,
    weightedAvg: null as number | null,
    avgOfAvgs: null as number | null
  };

  defaultAvatar = '/default-avatar.jpg';

  constructor(private route: ActivatedRoute, private api: UserService) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      const id = Number(pm.get('id'));
      this.user = undefined;
      this.markers = [];
      this.loading = true;
      this.error = '';

      if (!id) {
        this.loading = false;
        this.error = 'Invalid user id';
        return;
      }

      this.api.getPublic(id).subscribe({
        next: u => this.user = u,
        error: _ => this.error = 'User not found',
        complete: () => this.loading = false
      });

      this.api.getPublicMarkers(id, 100).subscribe({
        next: list => {
          this.markers = list ?? [];
          this.computeStats(this.markers);
        },
        error: err => console.error('getPublicMarkers error', err)
      });
    });
  }

  private resetStats() {
    this.stats = {markers: 0, totalRatings: 0, weightedAvg: null, avgOfAvgs: null};
  }

  private computeStats(list: MarkerDto[]) {
    const markers = list.length;
    const totals = list.reduce((acc, m) => {
      const r = m.ratingsCount ?? 0;
      const a = m.avgRating ?? 0;
      acc.totalRatings += r;
      acc.weightedSum += a * r;
      acc.sumAvg += a;
      return acc;
    }, {totalRatings: 0, weightedSum: 0, sumAvg: 0});

    const weightedAvg = totals.totalRatings > 0 ? (totals.weightedSum / totals.totalRatings) : null;
    const avgOfAvgs = markers > 0 ? (totals.sumAvg / markers) : null;

    this.stats = {
      markers,
      totalRatings: totals.totalRatings,
      weightedAvg,
      avgOfAvgs
    };
  }

  onThumbError(ev: Event) {
    (ev.target as HTMLImageElement).style.display = 'none';
  }
}

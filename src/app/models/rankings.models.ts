export type Period = 'month' | 'year' | 'all';

export interface UserRankingItem {
  userId: number;
  username: string | null;
  avatarUrl?: string | null;
  authServerUserId?: string | null;
  markersCreated: number;
  ratingsGiven: number;
  score: number;
}

export interface MarkerRankingItem {
  markerId: number;
  title: string;
  lat: number;
  lng: number;
  ratingsCount: number;
  avgNorm?: number;
  wilson: number;
}

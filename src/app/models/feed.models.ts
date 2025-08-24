export type FeedType = 'newest' | 'nearby' | 'trending' | 'top';

export interface MarkerFeedItem {
  markerId: number;
  title: string;
  lat: number;
  lng: number;
  thumbnailUrl?: string | null;

  address?: string | null;
  description?: string | null;
  createdAt?: string | null;
  ratingsCount?: number | null;
  avgRating?: number | null;

  creatorUserId?: number | null;
  creatorUsername?: string | null;
  creatorAvatarUrl?: string | null;

  distanceKm?: number | null;
  recentVotes?: number | null;
  wilson?: number | null;
}

export interface FeedQuery {
  type: FeedType;
  limit?: number;
  offset?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  days?: number;
  minVotes?: number;
}

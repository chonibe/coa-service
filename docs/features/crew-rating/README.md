# Crew-Based Rating UX

## Overview

Crew-based social proof for artwork ratings: collectors see "X in your crew responded" instead of crowd-style metrics (average rating, likes). Uses taste similarity to form "crew" clusters—collectors who rate similarly across overlapping products.

## Key Concepts

- **Crew**: Taste-similar collectors (those who rate similarly on co-rated products)
- **Fellow responders**: Count of crew members who rated a given artwork
- **Earned, not instant**: Crew counts appear only after 15+ ratings; progression copy guides new users

## Implementation

### Backend

| Component | Path | Description |
|-----------|------|-------------|
| collector_ratings table | `supabase/migrations/20260226100000_collector_ratings.sql` | Stores product ratings (1-5) per collector |
| Sync API | `app/api/collector/ratings/sync/route.ts` | POST ratings from localStorage when authenticated |
| Crew count API | `app/api/crew/count/route.ts` | GET crew count per product (taste similarity) |

### Client

| Component | Path | Description |
|-----------|------|-------------|
| useRatingSync | `lib/experience/useRatingSync.ts` | Syncs localStorage ratings to backend on auth/change |
| ArtworkCard crew badge | `app/shop/experience/components/ArtworkStrip.tsx` | Displays "X in your crew" when count > 0 |
| Configurator | `app/shop/experience/components/Configurator.tsx` | Fetches crew counts, passes to ArtworkStrip |
| WishlistSwiperSheet summary | `app/shop/experience/components/WishlistSwiperSheet.tsx` | Removed avg; crew summary + progression copy |

### Constants

- `MIN_RATINGS_FOR_CREW`: 15
- `MIN_OVERLAP_FOR_CREW`: 3 (co-rated products for similarity)
- `MAX_RATING_DIFF`: 1.5 (avg absolute difference threshold)

## API Usage

### Sync ratings

```
POST /api/collector/ratings/sync
Body: { ratings: { [productId]: number } }
Returns: { synced: number }
```

### Crew count

```
GET /api/crew/count?productIds=id1,id2,...
Returns: { [productId]: number }
```

Both require authentication.

## UX Copy

- **On cards**: "X in your crew" (when > 0)
- **Summary (authenticated, < 15 ratings)**: "Rate 15+ artworks to discover your crew"
- **Summary (authenticated, crew responded)**: "X in your crew responded to this/these"
- **Summary (authenticated, no crew overlap)**: "Your crew is forming — keep rating to see overlap"
- **Summary (anonymous)**: "Sign in to find your crew"

## Data Flow

1. Collector rates artwork → localStorage (existing)
2. When authenticated → useRatingSync calls sync API
3. Crew count API computes taste similarity from collector_ratings
4. Cards/summary display crew counts

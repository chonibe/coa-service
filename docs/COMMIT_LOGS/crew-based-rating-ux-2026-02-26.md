# Crew-Based Rating UX Implementation

**Date:** 2026-02-26

## Summary

Implemented crew-based social proof for artwork ratings: collectors see "X in your crew responded" based on taste similarity instead of crowd metrics. Uses "crew" terminology throughout (not "tribe").

## Changes Checklist

- [x] Created `supabase/migrations/20260226100000_collector_ratings.sql` — collector_ratings table with RLS
- [x] Created `app/api/collector/ratings/sync/route.ts` — POST sync ratings from localStorage
- [x] Created `app/api/crew/count/route.ts` — GET crew count per product (taste similarity)
- [x] Created `lib/experience/useRatingSync.ts` — sync hook (auth + experience-ratings-change)
- [x] Modified `app/shop/experience/components/ArtworkStrip.tsx` — crew badge on cards ("X in your crew")
- [x] Modified `app/shop/experience/components/Configurator.tsx` — useRatingSync, crew fetch, crewCountMap
- [x] Modified `app/shop/experience/components/WishlistSwiperSheet.tsx` — remove avg, add crew summary, progression copy
- [x] Created `docs/features/crew-rating/README.md` — feature documentation

## Key Files

| File | Role |
|------|------|
| [lib/experience-artwork-ratings.ts](lib/experience-artwork-ratings.ts) | Existing localStorage ratings (unchanged as source) |
| [lib/experience/useRatingSync.ts](lib/experience/useRatingSync.ts) | Sync to backend when authenticated |
| [app/api/crew/count/route.ts](app/api/crew/count/route.ts) | Taste similarity → crew count |

## Constants

- MIN_RATINGS_FOR_CREW: 15
- MIN_OVERLAP_FOR_CREW: 3
- MAX_RATING_DIFF: 1.5

# Commit log: Lamp ArtworkDetail — no artist UI

**Date:** 2026-04-06  
**Commit:** `fix(experience): hide artist spotlight and vendor line in lamp ArtworkDetail`

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — For products with `productIncludes` (base lamp/bundle): empty header artist line; no artist/spotlight fetch; no `ArtistSpotlightBanner`; no artwork+artist gallery; description accordion label **Product details**.
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — Documented lamp/bundle behavior under ArtworkDetail and changelog bullets.

## Notes

- `editionArtistName` remains for edition metrics / watch hook; UI uses `detailHeaderArtistLine` (blank for lamp).

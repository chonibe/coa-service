# Commit log: bundle strip shows all spotlight items (no cap)

**Date:** 2026-04-07

## Summary

Removed the previous limit (8 items) on the featured bundle horizontal strip so every deduped spotlight product appears; the strip scrolls horizontally for long lists.

## Checklist

- [x] [`app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx`](../../app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx) — Dropped `MAX_BUNDLE_STRIP_ITEMS` and `stripProducts.slice(0, …)`; render full `stripProducts`.
- [x] [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — `bundlePreviewStripProducts` no longer uses `max` / early break; adds all `spotlightProducts` after lamp + pair (deduped).
- [x] [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — Same as v2 client.

## Testing

- [ ] Manually open shop experience with a spotlight that has many prints; confirm strip shows every item and horizontal scroll works.

## Deployment

- [x] [`app/(store)/shop/gift-cards/page.tsx`](../../app/(store)/shop/gift-cards/page.tsx) — Wrapped `useSearchParams()` usage in `<Suspense>` so `next build` prerender succeeds (required for Vercel production).
- Production: re-run `vercel --prod --yes` after the gift-cards fix is on the deployed branch.

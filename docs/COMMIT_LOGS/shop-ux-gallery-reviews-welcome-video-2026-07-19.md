# Shop UX batch (gallery / cart / reviews / welcome / video) — 2026-07-19

## Summary

Completed remaining shop UX items that prior agents left partially wired: A (eight fixes mostly already in tree), B (Yotpo review badge + welcome incentive UI), C (mobile artist video autoplay).

## Checklist

### A — Eight shop fixes
- [x] [`BestSellersScrollGallery.tsx`](../../app/(store)/shop/home-v2/components/BestSellersScrollGallery.tsx) + [`ExperienceArtworkGridCard.tsx`](../../app/(store)/shop/experience/components/ExperienceArtworkGridCard.tsx) — Gallery hover → second art image
- [x] [`experience-last-viewed-artwork.ts`](../../lib/shop/experience-last-viewed-artwork.ts) + [`ExperienceV3Client.tsx`](../../app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx) — Persist last-viewed (`?artwork=` wins)
- [x] [`ExperienceSlideoutMenu.tsx`](../../app/(store)/shop/experience-v2/ExperienceSlideoutMenu.tsx) — Hide lamp-only cart badge on mobile (`hidden md:inline-flex`)
- [x] [`LandingNav.tsx`](../../app/(store)/shop/home-v2/components/LandingNav.tsx) — Cart in home toolbar
- [x] [`LandingHero.tsx`](../../app/(store)/shop/home-v2/components/LandingHero.tsx) / testimonials / artists — Mute home videos (incl. Yaroslav)
- [x] FAQ / specs content — Lamp size **21.5×14.5×7 cm**
- [x] [`ExperienceCartChip.tsx`](../../app/(store)/shop/experience-v2/ExperienceCartChip.tsx) + [`OrderBar.tsx`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx) — Two-sided lamp cart tooltip/hint
- [x] [`stripe-line-item-description.ts`](../../lib/shop/stripe-line-item-description.ts) — No “Default Title” on Stripe subtitle

### B — Reviews + welcome
- [x] [`yotpo-store-reviews.ts`](../../lib/shop/yotpo-store-reviews.ts) + home/explore pages — Live “5.0 from N reviews” (null fallback; never invents N)
- [x] [`WelcomeIncentiveStrip.tsx`](../../components/shop/WelcomeIncentiveStrip.tsx) + [`welcome-incentive.ts`](../../lib/shop/welcome-incentive.ts) — First-visit email → code; env documented in `.env.example`

### C — Mobile artist video
- [x] [`ArtistsWall.tsx`](../../app/(store)/shop/home-v2/components/ArtistsWall.tsx) — muted + playsInline + autoplay + iOS retries

## Merchant blockers
- [ ] Yotpo: set `YOTPO_APP_KEY` (or Shopify metafield `yotpo.app_key`) so live counts populate
- [ ] Stripe: create Promotion Code matching `NEXT_PUBLIC_WELCOME_PROMO_CODE` (default `WELCOME10`)

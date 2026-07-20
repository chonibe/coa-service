# Shop: home video, landing cart, gallery prefetch (2026-07-20)

## Summary

Restore home-v2 hero and testimonial video playback with local posters, wire the landing page to the experience cart slide-over, and prefetch experience gallery neighbors at viewport width instead of full-resolution heroes.

## Checklist of Changes

- [x] **Hero video** — Autoplay recovery, fade-in, local poster (`app/(store)/shop/home-v2/components/LandingHero.tsx`, `content/home-v2-landing.ts`, `public/media/home/hero-poster.jpg`)
- [x] **Testimonials** — Optional posters; MP4 mounts in view without requiring poster (`TestimonialsSection.tsx`, `public/media/home/testimonial-*-poster.jpg`)
- [x] **Landing cart** — Experience cart provider/shell, nav chip, products-by-id API (`LandingExperienceCartProvider.tsx`, `LandingExperienceCartShell.tsx`, `LandingNav.tsx`, `landing/page.tsx`, `app/api/shop/cart/products/route.ts`, `lib/shopify/storefront-client.ts`)
- [x] **Experience gallery** — Viewport-width LCP preload and adjacent prefetch (`lib/shop/experience-gallery-images.ts`, `ExperienceV3Client.tsx`)
- [x] **Tests** — Adjacent indices and hero URL helpers (`lib/shop/experience-gallery-images.test.ts`)

## Tests

- [x] `npm test -- lib/shop/experience-gallery-images.test.ts` — 13 passed
- [x] `npm test -- lib/analytics/landing-paths.test.ts lib/shop/welcome-incentive.test.ts` — 8 passed

## Deployment

- Production via `vercel --prod --yes` after push to `main`.

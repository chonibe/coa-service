# Street Collector typography — artist-profile.html parity — 2026-04-03

## Summary

Aligned the shared **home-v2 / explore-artists / artist profile** font stack with the reference `artist-profile.html`: **Playfair Display** (400/500/700 + italic), **DM Mono** (300/400/500) for body and UI chrome, **Bebas Neue** for display numerals. Removed **Inter** from `landing-fonts.ts`. Fixed artist profile CSS that used `--font-landing-sans` for Bebas-sized roles (now `--font-landing-display`). Added `[slug]` layout wrapper so `--font-landing-*` variables resolve on artist pages. Documented Tailwind utilities `font-landing-serif|mono|display`.

## Checklist of Changes

- [x] [`app/(store)/shop/home-v2/landing-fonts.ts`](../../app/(store)/shop/home-v2/landing-fonts.ts) — drop Inter; Playfair weights; three font CSS variables
- [x] [`app/(store)/shop/home-v2/landing.module.css`](../../app/(store)/shop/home-v2/landing.module.css) — `.page` body uses DM Mono 300
- [x] [`app/(store)/shop/artists/[slug]/artist-profile.module.css`](../../app/(store)/shop/artists/[slug]/artist-profile.module.css) — root body mono; display roles use Bebas variable
- [x] [`app/(store)/shop/artists/[slug]/layout.tsx`](../../app/(store)/shop/artists/[slug]/layout.tsx) — apply `landingFontVariables`
- [x] [`tailwind.config.ts`](../../tailwind.config.ts) — `font-landing-serif`, `font-landing-mono`, `font-landing-display`
- [x] [`docs/features/street-collector/explore-artists/README.md`](../../docs/features/street-collector/explore-artists/README.md) — typography section + changelog 1.1.2

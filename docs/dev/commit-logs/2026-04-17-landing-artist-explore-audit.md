# Commit log: Landing + Explore + Artist audit & improvements (2026-04-17)

Phased, low-risk improvements across `/shop/home-v2/landing`, `/shop/explore-artists`, and `/shop/artists/[slug]`. Visual/UX, technical, SEO, and conversion were weighted equally.

## Phase 1 — Quick wins

- [x] [`app/(store)/shop/home-v2/landing/page.tsx`](../../../app/(store)/shop/home-v2/landing/page.tsx) — canonical + OG URL fixed (`/shop/home-v2` → `/shop/home-v2/landing`); `force-dynamic` replaced with `revalidate = 600`; landing JSON-LD (`WebPage`, `FAQPage`, `VideoObject`); `MobileStickyCta` mounted
- [x] [`app/(store)/shop/home-v2/page.tsx`](../../../app/(store)/shop/home-v2/page.tsx) — re-export updated from `dynamic` → `revalidate`
- [x] [`app/(store)/shop/explore-artists/page.tsx`](../../../app/(store)/shop/explore-artists/page.tsx) — `force-dynamic` replaced with `revalidate = 600`; artists passed into JSON-LD
- [x] [`app/(store)/shop/artists/[slug]/page.tsx`](../../../app/(store)/shop/artists/[slug]/page.tsx) — added `revalidate = 600`; added `generateStaticParams()` that pre-renders top ~40 featured artist slugs from `content/street-collector.ts`
- [x] [`app/(store)/shop/artists/[slug]/artist-profile.module.css`](../../../app/(store)/shop/artists/[slug]/artist-profile.module.css) — removed `saturate(0.85) brightness(0.7)` filter on hero portrait; softened overlay; bumped 13px → 14px on `.storyBody`, `.igNativeEmptyCopy`, `.ctaSub`, `.heroLead`, `.faqA`; added 1440/1100 breakpoints
- [x] [`app/(store)/shop/home-v2/landing.module.css`](../../../app/(store)/shop/home-v2/landing.module.css) — 13px → 14px on `.tImgQuote`; added 1440/1100 breakpoints
- [x] [`app/(store)/shop/explore-artists/explore-artists.module.css`](../../../app/(store)/shop/explore-artists/explore-artists.module.css) — 13px → 14px across `.lbStory`, `.heroDesc`, `.featuredBio`, `.artistCardHook`, `.finalSub`; added 1440 breakpoint; removed decorative `.mapCanvasWrap/.worldMapSvg/.mapLand/.mapDot` styles; added `.mapCityList/.mapCityChip`
- [x] [`app/(store)/shop/home-v2/components/StepsSection.tsx`](../../../app/(store)/shop/home-v2/components/StepsSection.tsx) — inline 13px → 14px
- [x] [`content/explore-artists.ts`](../../../content/explore-artists.ts) — NEW content file; fabricated quotes removed; real testimonials centralized; `rotateLabel` set to `Rotates weekly`
- [x] [`components/shop/MobileStickyCta.tsx`](../../../components/shop/MobileStickyCta.tsx) — NEW reusable mobile-only fixed CTA with safe-area-inset
- [x] Mounted `MobileStickyCta` on landing, explore, and artist profile client components

## Phase 2 — Mid-effort

- [x] [`app/(store)/shop/explore-artists/components/ExploreArtistsClient.tsx`](../../../app/(store)/shop/explore-artists/components/ExploreArtistsClient.tsx) — lightbox focus trap (`inert` background, `Esc`, Tab cycle, focus restoration); all `setLightboxSlug` consolidated into `openLightbox`/`closeLightbox`; custom cursor gated by `prefers-reduced-motion` and ≥1024px viewport; featured spotlight + cards + lightbox images migrated to `next/image`; testimonials now sourced from `content/explore-artists.ts`; world-map SVG replaced with data-driven city list + honest stats
- [x] [`app/(store)/shop/home-v2/components/TestimonialsSection.tsx`](../../../app/(store)/shop/home-v2/components/TestimonialsSection.tsx) — new `LazyTestimonialVideo` sub-component; videos lazy-mount via `IntersectionObserver`, one plays at a time; product + poster images migrated to `next/image`
- [x] [`app/(store)/shop/home-v2/components/LandingHero.tsx`](../../../app/(store)/shop/home-v2/components/LandingHero.tsx) — video now `preload="metadata"` with `poster`
- [x] [`content/home-v2-landing.ts`](../../../content/home-v2-landing.ts) — added `videoPosterUrl`
- [x] [`app/(store)/shop/home-v2/components/LandingNav.tsx`](../../../app/(store)/shop/home-v2/components/LandingNav.tsx) — scroll listener throttled via `requestAnimationFrame`
- [x] [`app/(store)/shop/home-v2/components/ArtistsWall.tsx`](../../../app/(store)/shop/home-v2/components/ArtistsWall.tsx) — `<img>` → `next/image` across all tiles
- [x] [`app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx`](../../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx) — hero portrait, works grid, and related-artist tiles migrated to `next/image`; `MobileStickyCta` mounted
- [x] [`components/seo/ExploreArtistsJsonLd.tsx`](../../../components/seo/ExploreArtistsJsonLd.tsx) — `ItemList` with `Person` entries for each artist
- [x] [`components/seo/ArtistProfileJsonLd.tsx`](../../../components/seo/ArtistProfileJsonLd.tsx) — `ItemList` of the artist's works added alongside `Person`/`FAQPage`/`BreadcrumbList`

## Phase 3 — Structural

- [x] [`app/(store)/shop/home-v2/components/RevealOnScroll.tsx`](../../../app/(store)/shop/home-v2/components/RevealOnScroll.tsx) — NEW reusable wrapper around `useLandingScrollReveal` to unify the motion primitive
- [x] Weekly deterministic spotlight rotation — ISO-week-indexed `spotlightIndex` in `ExploreArtistsClient.tsx`; label updated to `Rotates weekly`
- [x] Decorative world-map SVG replaced — honest `.mapCityList` of cities sourced from real artist data + updated stat strip (`Artists`, `Cities on record`, `With full stories`)
- [x] [`app/(store)/shop/home-v2/components/FinalCta.tsx`](../../../app/(store)/shop/home-v2/components/FinalCta.tsx) — email-capture form wired to `/api/shop/newsletter` with pending/success/error states

## Explicitly skipped (rationale in commit log)

- [ ] `#23` Global design-token consolidation — high visual-regression surface for modest payoff; variables already work per-module
- [ ] `#26` Product-specific waitlist — `/api/shop/reserve/subscribe` is a Street Reserve subscription tier, not a per-SKU waitlist; needs new schema + endpoint
- [ ] `#28` PostHog A/B on hero CTA label + layout — requires experiment definitions outside this PR's scope
- [ ] `#29` Dedupe hero video + MeetTheLamp video source — requires content owner to confirm scenes are identical

## Post-deploy verification

- [ ] Lighthouse on `/shop/home-v2/landing` (mobile) — expect LCP improvement from video poster + `next/image`
- [ ] Google Rich Results Test on `/shop/explore-artists` (`ItemList`) and a live artist URL (`Person` + `ItemList` + `FAQPage`)
- [ ] Manual keyboard-only test of explore lightbox (Tab cycle + Esc + focus restoration)
- [ ] Verify newsletter subscribe on the landing page produces a 200 and success state
- [ ] Confirm mobile sticky CTA does not overlap checkout/cart drawers

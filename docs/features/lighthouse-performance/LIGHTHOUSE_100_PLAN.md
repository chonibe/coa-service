# Lighthouse 100% Plan: Performance & Best Practices

**Audit Date:** 2026-03-10  
**Current Scores:** Performance 75 | Best Practices 77  
**Target:** 100 on both

---

## Audit Summary

### Performance (75 → 100)

| Metric | Current | Target (≈100) | Priority |
|-------|---------|---------------|----------|
| First Contentful Paint | 1.4 s | < 1.8 s | ✓ OK (97) |
| Largest Contentful Paint | 3.0 s | < 2.5 s | High |
| Speed Index | 8.3 s | < 3.4 s | Critical |
| Total Blocking Time | 430 ms | < 200 ms | High |
| Time to Interactive | 15.4 s | < 3.8 s | Critical |
| Cumulative Layout Shift | 0.056 | < 0.1 | ✓ OK (98) |

**Main drivers of poor scores:**
- Main-thread work: 9.6 s
- JavaScript execution: 3.8 s
- Render-blocking CSS: 3 files (~230 ms)
- Unused JavaScript: 488 KiB (Stripe, PostHog recorder, gtag, Next chunks)
- Network payload: 23 MB (hero video, images)
- Cache: 333 KiB savings possible

### Best Practices (77 → 100)

| Audit | Status | Fix |
|-------|--------|-----|
| Uses third-party cookies | Fail | Google Ads, Stripe |
| Inspector issues (cookie) | Fail | Same as above |

---

## Implementation Plan

### Phase 1: Best Practices → 100 (Quick Wins)

**1.1 Deploy pending fixes**
- [x] Deploy [Google Consent Mode v2](lib/google-analytics.ts) — denies ad_storage/analytics_storage by default
- [x] Deploy [Stripe prefetch=false](app/shop/street-collector/FixedCTAButton.tsx) on CTA Links

**1.2 Gate Stripe on checkout-only**
- [x] Refactor Stripe load: `PaymentStep.tsx` and `CardInputSection.tsx` — use `useStripePromise()` hook that dynamically imports `@stripe/stripe-js` only when component mounts

**1.3 Verify third-party cookie elimination**
- [ ] Re-run Lighthouse after deploy
- [ ] Confirm googleads.g.doubleclick.net and m.stripe.com no longer set cookies on landing

---

### Phase 2: Performance — Critical Path (Speed Index, TTI)

**2.1 Defer PostHog session recording**
- [x] On landing paths (`/`, `/shop/street-collector`): `disable_session_recording: true`, then `posthog.startSessionRecording()` after 8s
- [ ] Reduces ~0.7 s bootup + 50+ KiB unused JS
- **File:** [app/providers.tsx](app/providers.tsx) — add `disable_session_recording: true` for landing, or use `person_profiles` + conditional recorder load

**2.2 Eliminate render-blocking CSS**
- [ ] Inline critical above-the-fold CSS for street-collector hero
- [ ] Load non-critical CSS async: `<link rel="stylesheet" href="..." media="print" onload="this.media='all'" />`
- [ ] Or use Next.js `next/dynamic` with `ssr: false` for below-fold sections that pull in heavy CSS
- **Files:** Next.js generates `2eec5ddf…`, `68920cd6…`, `395277e4…` — consider splitting by route or using CSS modules that tree-shake

**2.3 Code-split heavy chunks**
- [x] Use `next/dynamic` for: `MeetTheStreetLamp`, `ArtistCarousel`, `TestimonialCarousel`, `StreetCollectorFAQ` (ssr: true for Server Components compatibility)
- [ ] Lazy-load GSAP: `const gsap = (await import('gsap')).default` inside the component that needs it
- **Note:** Previous attempt caused build error ("Cannot access before initialization") — fix circular deps / default exports for `dynamic()`

**2.4 Defer Google Analytics**
- [ ] GA already deferred (2.5 s); ensure Consent Mode prevents cookie until consent
- [ ] Consider not loading gtag at all on landing if analytics can wait for post-consent

---

### Phase 3: Performance — Network & Resources

**3.1 Reduce network payload**
- [x] Enable Next.js image optimization (`unoptimized: false`) + `remotePatterns` for cdn.shopify.com
- [x] Hero poster: use `next/image` with `priority` in [VideoPlayer](components/sections/VideoPlayer.tsx)
- [ ] Estimated savings: ~1.1 MB from image delivery, ~23 MB total (video is largest)
- [ ] Consider smaller hero video (e.g. 720p, lower bitrate) or poster-only until play

**3.2 Improve cache lifetimes**
- [ ] Ensure `Cache-Control` on static assets (Vercel default is usually good)
- [ ] Add long cache for proxy-video API (already done: 1 year)
- [ ] Stripe, PostHog: controlled by third parties; our proxy and static assets are the levers
- **File:** [app/api/proxy-video/route.ts](app/api/proxy-video/route.ts) — ✓ done

**3.3 Reduce unused JavaScript**
- [ ] Stripe: Gate to checkout (Phase 1.2) — removes ~144 KiB wasted
- [ ] PostHog recorder: Defer or disable on landing — removes ~50 KiB
- [ ] gtag: Consent Mode + defer — minor
- [ ] Next chunks: Code-split (Phase 2.3) reduces initial bundle

---

### Phase 4: Performance — LCP & Main Thread

**4.1 Optimize LCP (3.0 s → < 2.5 s)**
- [ ] Hero poster: Already preloaded in head; ensure `fetchpriority="high"`, explicit dimensions
- [ ] Reduce render-blocking (Phase 2.2) to shorten first paint
- [ ] Consider `loading="eager"` only for LCP image; lazy for below-fold

**4.2 Reduce forced reflow**
- [ ] Audit GSAP/ScrollTrigger: batch layout reads after writes; use `requestAnimationFrame`
- [ ] Avoid `getBoundingClientRect` / `offsetWidth` immediately after DOM mutations
- **Files:** [ArtistCarousel](components/sections/ArtistCarousel.tsx), [KineticPressQuotes](components/sections/KineticPressQuotes.tsx)

---

## Implementation Order

1. **Phase 1** — Deploy Consent Mode + prefetch; gate Stripe to checkout → Best Practices 100
2. **Phase 2.2** — Render-blocking CSS (highest impact on Speed Index)
3. **Phase 2.1** — PostHog recorder defer
4. **Phase 2.3** — Code-split (fix build first)
5. **Phase 3.1** — Images (next/image, enable optimization)
6. **Phase 4** — LCP polish, reflow batching

---

## Files to Touch

| Area | Files |
|------|-------|
| Best Practices | `lib/google-analytics.ts`, `components/google-analytics.tsx`, `FixedCTAButton.tsx`, `PaymentStep.tsx`, `CardInputSection.tsx` |
| Render-blocking | `app/layout.tsx`, `app/globals.css`, Next.js CSS strategy |
| PostHog | `app/providers.tsx` |
| Code-split | `app/shop/street-collector/page.tsx` |
| Images | `next.config.js`, `VideoPlayer.tsx`, `ArtistCarousel.tsx` |
| GSAP/reflow | `ArtistCarousel.tsx`, `KineticPressQuotes.tsx`, `lib/animations/gsap-config.ts` |

---

## Verification

```bash
npx lighthouse https://app.thestreetcollector.com/ --throttling-method=simulate --output=html
```

Target: Performance ≥ 95, Best Practices = 100

---

## Version

- **Created:** 2026-03-10
- **Ref:** [lighthouse-performance README](README.md)

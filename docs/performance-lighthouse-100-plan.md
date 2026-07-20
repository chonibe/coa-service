# Lighthouse 100 plan — Street Collector shop

**Version:** 1.1.0  
**Last updated:** 2026-07-20  
**Audit tool:** Lighthouse 13.4.0 (CLI, mobile default + desktop home)  
**Production URLs audited:** `https://app.thestreetcollector.com` (redirects to canonical `https://www.thestreetcollector.com`)

## Implementation links

| Area | Primary files |
|------|-----------------|
| Root `/` landing (home-v2) | [`app/(store)/page.tsx`](../app/(store)/page.tsx), [`app/(store)/shop/home-v2/landing/page.tsx`](../app/(store)/shop/home-v2/landing/page.tsx) |
| Hero LCP | [`app/(store)/shop/home-v2/components/LandingHero.tsx`](../app/(store)/shop/home-v2/components/LandingHero.tsx), [`content/home-v2-landing.ts`](../content/home-v2-landing.ts) |
| Testimonial / step videos | [`app/(store)/shop/home-v2/components/TestimonialsSection.tsx`](../app/(store)/shop/home-v2/components/TestimonialsSection.tsx), [`StepsSection.tsx`](../app/(store)/shop/home-v2/components/StepsSection.tsx), [`MeetTheLamp.tsx`](../app/(store)/shop/home-v2/components/MeetTheLamp.tsx) |
| Experience / Spline | [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../app/(store)/shop/experience/components/SplineFullScreen.tsx), [`ExperienceV2ClientLoader.tsx`](../app/(store)/shop/experience/components/ExperienceV2ClientLoader.tsx) |
| Analytics / third-party | [`app/providers.tsx`](../app/providers.tsx), [`components/google-analytics.tsx`](../components/google-analytics.tsx), [`components/meta-pixel.tsx`](../components/meta-pixel.tsx), [`components/tiktok-pixel.tsx`](../components/tiktok-pixel.tsx), [`lib/analytics/landing-paths.ts`](../lib/analytics/landing-paths.ts), [`app/layout.tsx`](../app/layout.tsx) |
| Redirects | [`middleware.ts`](../middleware.ts) |
| Tests (welcome incentive / shop) | [`lib/shop/welcome-incentive.test.ts`](../lib/shop/welcome-incentive.test.ts) |

## Score snapshot (2026-07-20)

| Page | Form factor | Performance | Accessibility | Best practices | SEO |
|------|-------------|-------------|---------------|----------------|-----|
| `/` (home-v2) | Mobile | **69** | 100 | 100 | 100 |
| `/` (home-v2) | Desktop | **72** | 97 | 100 | 100 |
| `/shop/experience` | Mobile | **56** | 95 | 100 | 92 |

### Core Web Vitals (lab)

| Page | Form factor | LCP | TBT | CLS | FCP | Speed Index | TTI |
|------|-------------|-----|-----|-----|-----|-------------|-----|
| `/` | Mobile | 9.9 s | 80 ms | 0 | 2.4 s | 4.8 s | 13.9 s |
| `/` | Desktop | 3.5 s | 80 ms | 0.01 | 0.8 s | 3.7 s | 3.5 s |
| `/shop/experience` | Mobile | 14.5 s | 320 ms | 0 | 2.3 s | 12.1 s | 15.0 s |

**Note:** Auditing via `app.thestreetcollector.com` adds an extra hop (~320–910 ms) before HTML. For CI and regression checks, run Lighthouse against **`https://www.thestreetcollector.com`** (canonical) unless you explicitly need to measure the app subdomain.

---

## Top 5 bottlenecks (cross-page)

1. **Canonical redirect chain (`app` → `www`)** — Lighthouse `redirects` / `document-latency-insight` ~320–910 ms wasted on every cold navigation audited from `app.*`.
2. **Home video payload (~63 MB transferred on mobile `/`)** — Dozens of Shopify MP4s (3–5 MB each) from [`content/home-v2-landing.ts`](../content/home-v2-landing.ts) testimonial reels; mobile scroll + 200px `rootMargin` loads many videos during a full-page Lighthouse pass.
3. **Unused JavaScript (~320–363 KiB)** — gtag (~90–95 KiB waste), Meta Pixel (~37–46 KiB), shared Next chunks (`00c03d9e`, `9da6db1e`, `87921` — Spline-related on experience), PostHog recorder/surveys when init falls inside the audit window.
4. **Experience main-thread / bootup** — Chunk `87921` ~1.5 s scripting on `/shop/experience`; LCP ~14.5 s driven by large hero PNGs (1800px) plus deferred Spline mount competing for bandwidth.
5. **Misaligned global LCP preload** — Root [`app/layout.tsx`](../app/layout.tsx) previously preloaded `streetCollectorContent.hero.image` while `/` renders home-v2 hero **video poster** (different CDN asset). **Quick fix applied in this pass:** preload `homeV2LandingContent.hero.videoPosterUrl` + `preconnect` to `cdn.shopify.com`.

---

## Target: category scores at 100

| Category | Current gaps | Path to 100 |
|----------|--------------|-------------|
| **Performance** | LCP + payload + JS | Phases P0–P3 below; expect **85–95** on marketing pages with pixels enabled; **100** only with deferred third-party or lab-only “performance mode”. |
| **Accessibility** | Experience: `button-name`; Desktop home: `aria-hidden-focus` | Fix labeled controls + focus trap in modals/menus (see P2). |
| **Best practices** | Already 100 | Keep consent-before-gtag pattern in [`components/google-analytics.tsx`](../components/google-analytics.tsx). |
| **SEO** | Experience audit flagged missing meta description (HTML curl shows description present — verify streamed HTML / audit URL) | Ensure `generateMetadata` output is in first HTML chunk; fix if regression. |

---

## Prioritized plan

### P0 — Infrastructure & measurement (high impact, low product risk)

| # | Action | Files | Expected impact |
|---|--------|-------|-------------------|
| P0.1 | Run Lighthouse on **`www.thestreetcollector.com`** in CI; optionally 301 `app` → `www` at DNS/CDN with same path (already in [`middleware.ts`](../middleware.ts)) and document that marketing links must use `www`. | [`middleware.ts`](../middleware.ts), Vercel domain settings | **+300–900 ms** LCP/FCP when audits stop using `app.*` |
| P0.2 | **Done (ultra-safe):** Align root LCP preload + Shopify CDN preconnect | [`app/layout.tsx`](../app/layout.tsx) | **+0.2–0.8 s** LCP on `/` (poster discovers earlier) |
| P0.3 | Add route-level `<link rel="preload" as="image">` for experience hero (already partial in [`experience/page.tsx`](../app/(store)/shop/experience/page.tsx)) — confirm URL matches first visible hero slide | [`app/(store)/shop/experience/page.tsx`](../app/(store)/shop/experience/page.tsx), [`lib/shop/experience-gallery-images.ts`](../lib/shop/experience-gallery-images.ts) | **+1–3 s** experience LCP |
| P0.4 | Baseline script: `npx lighthouse <url> --only-categories=performance,...` saved to `/tmp` + trend in PostHog or CI artifact | `docs/performance-lighthouse-100-plan.md` (this file) | Prevents regressions |

### P1 — Home `/` performance (LCP & weight)

| # | Action | Files | Expected impact |
|---|--------|-------|-------------------|
| P1.1 | **Hero:** Keep `preload="metadata"` on hero video; add explicit `poster` fetch via `next/image` priority or static `<img fetchPriority="high">` under video until `canplay` | [`LandingHero.tsx`](../app/(store)/shop/home-v2/components/LandingHero.tsx) | **+0.5–2 s** mobile LCP |
| P1.2 | **Testimonials:** Require poster URLs for every entry in `testimonials.videos`; never mount `<source>` without poster; tighten IO `rootMargin` to `0px` on mobile | [`TestimonialsSection.tsx`](../app/(store)/shop/home-v2/components/TestimonialsSection.tsx), [`content/home-v2-landing.ts`](../content/home-v2-landing.ts) | **−30–50 MB** transfer on long scroll / lab audits |
| P1.3 | **Steps / Meet the lamp:** Change `preload="auto"` → `metadata` or lazy until section in view (mirror [`LazyVideo`](../components/LazyVideo.tsx)) | [`StepsSection.tsx`](../app/(store)/shop/home-v2/components/StepsSection.tsx), [`MeetTheLamp.tsx`](../app/(store)/shop/home-v2/components/MeetTheLamp.tsx) | **−2–8 MB** initial; faster LCP |
| P1.4 | Re-encode Shopify MP4s (720p, H.264, ~1–2 Mbps) or host short loops on CDN with `Range` + cache headers | Shopify Files / content URLs in [`home-v2-landing.ts`](../content/home-v2-landing.ts) | **−50%+** video bytes per asset |
| P1.5 | Purge unused CSS (58 KiB `unused-css-rules`) — audit Tailwind content paths for home-v2 only bundle or `@layer` splits | [`landing.module.css`](../app/(store)/shop/home-v2/landing.module.css), `tailwind.config.*` | **+150–320 ms** main thread |

### P2 — `/shop/experience` performance & a11y

| # | Action | Files | Expected impact |
|---|--------|-------|-------------------|
| P2.1 | Delay Spline chunk until `requestIdleCallback` + user intent (scroll to reel / tap “rotate”) — extend facade in [`SplineFullScreen.tsx`](../app/(store)/shop/experience/components/SplineFullScreen.tsx) | Same + [`spline-3d-preview.tsx`](../app/template-preview/components/spline-3d-preview.tsx) | **−1–2 s** TBT; **+2–4 s** faster LCP |
| P2.2 | Serve hero gallery at `1000w`/`480w` via Shopify CDN params or [`getShopifyImageUrl`](../lib/shopify/image-url.ts); avoid 1800px PNG for mobile LCP | Experience reel components, [`experience/page.tsx`](../app/(store)/shop/experience/page.tsx) | **−200–400 KiB** LCP resource |
| P2.3 | Split `ExperienceV2Client` — dynamic import accordions, carousel Spline strip, checkout bars (pattern in [`experience/layout.tsx`](../app/(store)/shop/experience/layout.tsx)) | [`ExperienceV2ClientLoader.tsx`](../app/(store)/shop/experience/components/ExperienceV2ClientLoader.tsx) | **−100–200 KiB** unused JS |
| P2.4 | Fix **button-name** (icon-only controls in carousel / lamp UI) | [`ArtworkCarouselBar.tsx`](../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx), related | **Accessibility → 100** |
| P2.5 | Confirm meta description in first HTML byte stream for experience | [`lib/seo/experience-metadata.ts`](../lib/seo/experience-metadata.ts), [`experience/page.tsx`](../app/(store)/shop/experience/page.tsx) | **SEO → 100** |

### P3 — Third-party & analytics (tradeoff: marketing vs lab score)

| # | Action | Files | Expected impact |
|---|--------|-------|-------------------|
| P3.1 | Defer GA load until `requestIdleCallback` or first interaction on `LANDING_PATHS` (match PostHog 10s defer in [`app/providers.tsx`](../app/providers.tsx)) | [`components/google-analytics.tsx`](../components/google-analytics.tsx) | **−95 KiB** early JS; **+300–800 ms** unused-js savings |
| P3.2 | Load Meta / TikTok pixels after `load` or consent-only on landing | [`app/layout.tsx`](../app/layout.tsx), [`components/meta-pixel.tsx`](../components/meta-pixel.tsx) | **−60–80 KiB** |
| P3.3 | PostHog: keep `disable_session_recording: true` until idle on landing; disable `surveys.js` on `/shop/experience` | [`app/providers.tsx`](../app/providers.tsx) | **−50 KiB** + lower TBT |
| P3.4 | Optional **`?lighthouse=1`** or env flag to skip all third-party for synthetic tests only | New small helper + providers | **Performance → 95–100** in lab without affecting prod users |

### P4 — Desktop home accessibility

| # | Action | Files | Expected impact |
|---|--------|-------|-------------------|
| P4.1 | Fix `aria-hidden-focus` — modals/menus using `aria-hidden` while focusable children remain tabbable | [`LandingNav.tsx`](../app/(store)/shop/home-v2/components/LandingNav.tsx), mobile menu / slideouts | **Accessibility 97 → 100** |

---

## Suggested execution order (checklist)

- [ ] P0.1 — Canonical URL in Lighthouse CI (`www`, not `app`)
- [x] P0.2 — LCP preload + Shopify preconnect ([`app/layout.tsx`](../app/layout.tsx))
- [x] P1.1 — Hero poster priority image ([`LandingHero.tsx`](../app/(store)/shop/home-v2/components/LandingHero.tsx))
- [x] P1.2 — Testimonial video posters + lazy margin ([`TestimonialsSection.tsx`](../app/(store)/shop/home-v2/components/TestimonialsSection.tsx)) — **needs `posterUrl` per video in content**
- [x] P1.3 — Steps/MeetTheLamp lazy preload ([`StepsSection.tsx`](../app/(store)/shop/home-v2/components/StepsSection.tsx), [`MeetTheLamp.tsx`](../app/(store)/shop/home-v2/components/MeetTheLamp.tsx))
- [x] P2.1 — Spline idle defer ([`SplineFullScreen.tsx`](../app/(store)/shop/experience/components/SplineFullScreen.tsx), [`ExperienceV3SplineLampSection.tsx`](../app/(store)/shop/experience-v3/components/ExperienceV3SplineLampSection.tsx))
- [x] P2.2 — Responsive hero images on experience ([`experience-gallery-images.ts`](../lib/shop/experience-gallery-images.ts), [`ExperienceV3Client.tsx`](../app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx))
- [x] P3.1 — Defer GA on landing paths ([`google-analytics.tsx`](../components/google-analytics.tsx))
- [x] P3.2 — Defer Meta / TikTok on landing ([`meta-pixel.tsx`](../components/meta-pixel.tsx), [`tiktok-pixel.tsx`](../components/tiktok-pixel.tsx))
- [x] P2.4 / P4.1 — A11y fixes for 100 ([`ArtworkCarouselBar.tsx`](../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx), [`ExperienceV3Client.tsx`](../app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx), [`BestSellersScrollGallery.tsx`](../app/(store)/shop/home-v2/components/BestSellersScrollGallery.tsx), [`FaqSectionLanding.tsx`](../app/(store)/shop/home-v2/components/FaqSectionLanding.tsx))
- [ ] P3.4 — Optional lab-only third-party skip

---

## Realistic score targets (after P0–P2, pixels still on)

| Page | Performance | Notes |
|------|-------------|--------|
| `/` mobile | 88–94 | Dominated by testimonial video policy |
| `/` desktop | 92–98 | |
| `/shop/experience` mobile | 78–88 | Spline + gallery images |
| All pages | A11y/SEO/BP **100** | With P2.4, P4.1, metadata verification |

**Performance 100 on all shop URLs with full GA/Meta/PostHog** is unlikely without P3.4 lab mode or aggressive deferral (may affect attribution). Recommend separate **“marketing truth”** vs **“perf budget”** Lighthouse jobs.

---

## Change log

| Date | Change |
|------|--------|
| 2026-07-20 | Initial plan from production Lighthouse 13.4.0 runs; P0.2 preload/preconnect fix in [`app/layout.tsx`](../app/layout.tsx). |
| 2026-07-20 | P1–P3 code pass: hero poster `next/image`, testimonial lazy IO, Steps/MeetTheLamp in-view video, Spline visibility+idle defer, experience 480w hero + no lightbox prefetch, GA/Meta/TikTok 10s landing defer, a11y button labels. Local Lighthouse 12.8.2 mobile: `/` perf **73** (LCP 7.8s), `/shop/experience` perf **68** (LCP 11.2s), experience a11y **100**. |

---

## Verification checklist (documentation)

- [x] Implementation files referenced
- [ ] Test files linked where code changes land (add perf smoke test optional)
- [ ] Performance tracking documented (recommend CI Lighthouse on `www`)
- [x] Version and change log maintained

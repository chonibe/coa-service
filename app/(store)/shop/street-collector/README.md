# Street Collector Shop Page

## Overview

The main shop landing page inspired by [thestreetcollector.com](https://thestreetcollector.com/). This page serves as the default `/shop` route and provides a clean, conversion-focused layout.

**Access:**
- **Root:** `/` (app.thestreetcollector.com default — uses (store) layout with Footer)
- **Primary:** `/shop` (redirects here)
- **Direct:** `/shop/street-collector`

All routes use the store layout (`app/(store)/layout.tsx`) which provides Footer, Cart, and ChatIcon.

---

## Page Structure

1. **Hero** — Video background with three-line overlay: Not just a lamp. / A living art collection. / One lamp. Endless art. Swap in seconds. — plus `Start your collection` CTA to `/shop/experience` ([`VideoPlayer`](../../../components/sections/VideoPlayer.tsx) `heroSubtext`)
2. **Value Props** — Under “Bringing art into everyday life.”: numbered 1–3 with paired video + copy on mobile; stack order in [`content/street-collector.ts`](../../../content/street-collector.ts) `valueProps`: Swap it. Make it fit. → Support artists directly. → Collect original art.
3. **Testimonials** — "Join 3000+ Collectors" carousel with optional `sectionBackdropImage` (Group hero) behind the heading and carousel card ([`TestimonialCarousel.tsx`](./TestimonialCarousel.tsx), [`content/street-collector.ts`](../../../content/street-collector.ts) `testimonials.sectionBackdropImage`)
4. **Featured Artists** — Horizontal artist carousel with CTA to `/shop/experience`
5. **What Happens Next** — 3-step bridge section (choose lamp, preview/select artworks, checkout)
6. **FAQ** — Decision-focused groups: Lamp, Artworks, Shipping
7. **Top chrome** — Thin **promo strip** at the very top: dark `#0f0e0e`, subtle border, muted peach copy (`#FFBA94` ~75% opacity)—shows `meetTheLamp.trustMicroItems` joined with ` · `. On **md+**, it stacks above [`DesktopTopBar`](./DesktopTopBar.tsx) (`embedded` layout) in one fixed column. On **mobile**, the same strip is fixed under the safe area; an in-flow spacer reserves height so content does not sit under it.
8. **CTAs** — Sticky mobile bar and desktop top bar use `Start your collection` → `/shop/experience`. The Meet the Street Lamp hero does not repeat that button or the trust line (`primaryCta` and `trustMicroItems` are not passed into [`MeetTheStreetLamp`](./MeetTheStreetLamp.tsx); copy still lives in [`content/street-collector.ts`](../../../content/street-collector.ts) for the promo bar).

**Note:** The numbered 1–3 value-prop copy appears via [`ValuePropVideoCard`](./MultiColumnVideoSection.tsx) inside the featured-artists section (`leadingContent` on [`page.tsx`](./page.tsx)). A separate desktop-only image + three-column banner after the carousel was removed to avoid duplication.

---

## Key Files

| File | Purpose |
|------|---------|
| [`page.tsx`](./page.tsx) | Server component; fetches collections, renders sections |
| [`MultiColumnVideoSection.tsx`](./MultiColumnVideoSection.tsx) | Client component; value props with autoplay videos (horizontal scroll on mobile, 3-col on desktop) |
| [`TestimonialCarousel.tsx`](./TestimonialCarousel.tsx) | Client component; testimonials with media (video/image), stars, quote, author; arrows + dots |
| [`content/street-collector.ts`](../../../content/street-collector.ts) | Content config (copy, video/poster URLs, testimonials with media, collection handles) |
| [`under-the-fold-meet-lamp.ts`](../../../lib/shopify/under-the-fold-meet-lamp.ts) | Storefront: list metaobjects by definition handle (default `under-the-fold-section-gedomnm3`, env `SHOPIFY_UNDER_THE_FOLD_METAOBJECT_TYPE`) and merge file-reference videos onto Meet the Street Lamp stages by title / handle |

---

## Implementation Details

### Data Fetching

- **Artists:** First 12 from `streetCollectorContent.featuredArtists.collections`
- Shopify Storefront API via `getCollection()` from `lib/shopify/storefront-client.ts`
- **Meet the Street Lamp videos:** When the Storefront API is configured, [`page.tsx`](./page.tsx) loads metaobjects using the definition handle **`under-the-fold-section-gedomnm3`** (Settings → Custom data → Metaobjects in Shopify) in parallel with artist data. Set **`SHOPIFY_UNDER_THE_FOLD_METAOBJECT_TYPE`** if your store uses a different type handle. Each entry should include a **title** (or `heading` / `name` / `section_title` / `subtitle`) that matches a stage title from [`content/street-collector.ts`](../../../content/street-collector.ts) `meetTheLamp.stages` (e.g. “Set the light”), and a **video** file reference (also accepted: `desktop_video`, `section_video`, `file`). Optional: **`mobile_video`** / **`video_mobile`**, and poster image fields **`poster`**, `thumbnail`, `video_poster`, `image`. Entries are also keyed by the metaobject **handle** (slug) so handles like `set-the-light` can match without a separate title field. Requires Storefront scope **`unauthenticated_read_metaobjects`**. If no entry matches a stage, that stage keeps the default `meetTheLamp.desktopVideo` / `mobileVideo` from content.

### Styling

- Background: `#f5f5f5`
- Accent: `#047AFF` (primary button/CTA)
- Uses Impact design tokens (Fraunces, Barlow) from `@/components/impact`

### Accessibility & Best Practices (Lighthouse)

- **Video captions:** Hero, Meet the Street Lamp, and testimonial videos use `<track kind="captions">` with `/captions/hero-no-speech.vtt` (no-speech placeholder for decorative/background video).
- **Touch targets:** Testimonial carousel dot buttons and press-quote dot buttons use a minimum 24×24px touch target for mobile accessibility.

---

## Related

- [Shop Layout](../layout.tsx) — Header, cart drawer, footer
- [Shop Experience](/shop/experience) — Lamp configurator (Start your collection target)
- [Home v2](/shop/home-v2) — Alternative GSAP-enhanced homepage

---

## Version

- **Created:** 2026-02-27
- **Implementation:** Street Collector–inspired landing flow into `/shop/experience` with bridge + FAQ conversion layers
- **Updated:** 2026-03-21 — Hero overlay copy + `heroSubtext` in [`content/street-collector.ts`](../../../content/street-collector.ts) / [`VideoPlayer`](../../../components/sections/VideoPlayer.tsx); Meet the Street Lamp stages; value-prop tagline removal; trust bar SVGs
- **Updated:** 2026-03-22 — Removed desktop-only duplicate value-prop banner (image + numbered columns) after the artist carousel on [`page.tsx`](./page.tsx); value props remain in `leadingContent` only.
- **Updated:** 2026-03-22 — Testimonials: `sectionBackdropImage` + `backdropImageSrc` on [`TestimonialCarousel.tsx`](./TestimonialCarousel.tsx) to show the same wide hero image behind the carousel.
- **Updated:** 2026-03-28 — Removed duplicate `Start your collection` from the Meet the Street Lamp hero; CTA stays on [`DesktopTopBar`](./page.tsx) and the mobile sticky bar only.
- **Updated:** 2026-03-28 — Trust promo strip restyled to a low-contrast dark bar (not primary blue) so it reads as a quiet utility line, not a second CTA band.
- **Updated:** 2026-03-29 — Meet the Street Lamp carousel video follows the active slide: per-slide clips from Shopify metaobjects (definition handle **`under-the-fold-section-gedomnm3`**, optional env override) merged on [`page.tsx`](./page.tsx) via [`under-the-fold-meet-lamp.ts`](../../../lib/shopify/under-the-fold-meet-lamp.ts); [`MeetTheStreetLamp.tsx`](./MeetTheStreetLamp.tsx) swaps `LazyVideo` source when the stage advances.

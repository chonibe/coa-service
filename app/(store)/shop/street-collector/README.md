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
7. **CTAs** — Sticky mobile bar and desktop top bar (`DesktopTopBar`) use `Start your collection` → `/shop/experience`. The Meet the Street Lamp hero does not repeat that button (`primaryCta` omitted on [`page.tsx`](./page.tsx)); trust microcopy under the lamp remains via `trustMicroItems`.

**Note:** The numbered 1–3 value-prop copy appears via [`ValuePropVideoCard`](./MultiColumnVideoSection.tsx) inside the featured-artists section (`leadingContent` on [`page.tsx`](./page.tsx)). A separate desktop-only image + three-column banner after the carousel was removed to avoid duplication.

---

## Key Files

| File | Purpose |
|------|---------|
| [`page.tsx`](./page.tsx) | Server component; fetches collections, renders sections |
| [`MultiColumnVideoSection.tsx`](./MultiColumnVideoSection.tsx) | Client component; value props with autoplay videos (horizontal scroll on mobile, 3-col on desktop) |
| [`TestimonialCarousel.tsx`](./TestimonialCarousel.tsx) | Client component; testimonials with media (video/image), stars, quote, author; arrows + dots |
| [`content/street-collector.ts`](../../../content/street-collector.ts) | Content config (copy, video/poster URLs, testimonials with media, collection handles) |

---

## Implementation Details

### Data Fetching

- **Artists:** First 12 from `streetCollectorContent.featuredArtists.collections`
- Shopify Storefront API via `getCollection()` from `lib/shopify/storefront-client.ts`

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

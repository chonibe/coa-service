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

1. **Hero** — Video background with "Not just a lamp. A living Art Collection" and `Start your collection` CTA to `/shop/experience`
2. **Value Props** — Multi-column section with autoplay videos + copy: Inspire in an instant, Build a real collection, Support Artists directly (videos from thestreetcollector.com CDN, proxied for playback)
3. **Testimonials** — "Join 3000+ Collectors" carousel with video/image media, 5-star rating, quote text, and author (TestimonialCarousel)
4. **Featured Artists** — Horizontal artist carousel with CTA to `/shop/experience`
5. **What Happens Next** — 3-step bridge section (choose lamp, preview/select artworks, checkout)
6. **FAQ** — Decision-focused groups: Lamp, Artworks, Shipping
7. **CTAs** — Hero overlay, sticky mobile bar, and desktop top bar use `Start your collection` → `/shop/experience` (no duplicate tagline under the numbered value-prop cards)

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
- **Updated:** 2026-03-21 — Meet the Street Lamp `stages` copy and order refreshed; earlier same day: removed duplicate value-prop tagline, trust bar SVGs (`public/street-collector/trust/`), README CTAs note

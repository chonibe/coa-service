# Shop Experience Page

## Overview

The Experience page (`/shop/experience`) lets users customize a Street Lamp with artwork. It includes an intro quiz, a 3D Spline preview, an artwork strip, filters, and checkout.

**Implementation**: [`app/shop/experience/`](../../../app/shop/experience/)

## Performance Optimizations (2026-02)

### Implemented

1. **Streaming + Suspense** – Page shell renders immediately; data streams in via `loading.tsx` and Suspense fallback.
2. **Lazy Spline 3D** – `Spline3DPreview` is loaded with `next/dynamic` only when the configurator mounts.
3. **Spline scene preload** – `SplineScenePreload` in experience layout preloads `scene.splinecode` (~6.7MB) as soon as the page loads, so it's cached before the 3D preview is needed.
4. **Spline when visible** – `SplineWhenVisible` defers mounting Spline until the preview container is in the viewport (Intersection Observer).
3. **Lightweight product payload** – `getCollectionWithListProducts` uses `PRODUCT_LIST_FRAGMENT` (no description, media, full variants) for the artwork strip; full product fetched on-demand when opening ArtworkDetail.
4. **Virtualized ArtworkStrip** – `@tanstack/react-virtual` renders only visible rows (~10–15 cards instead of 100+).
5. **Reduced motion** – `whileHover` / `whileTap` removed from ArtworkCard to cut scroll-time JS work.
6. **Error boundaries** – Configurator and Spline wrapped in `ComponentErrorBoundary` for graceful degradation.
7. **Carousel image loading** – ArtworkStrip uses `getShopifyImageUrl(url, 500)` to request 500px-wide thumbnails from Shopify CDN, plus `priority` and `loading="eager"` for the first 6 cards to improve above-the-fold load time.
8. **Detail preload** – When cards enter the virtualized view, Configurator prefetches full product data (`/api/shop/products/[handle]`) into cache so the detail drawer opens instantly when the user taps.

### Spline Scene Optimization (Optional)

The `scene.splinecode` file is ~6.7MB. To reduce it in the Spline editor:

1. **Export > Play Settings > Compression** – Set Geometry Quality to "Performance"; enable image compression (can reduce textures up to 4x).
2. **Performance Panel** – Use Spline's built-in metrics to find heavy elements (polygons, materials, textures).
3. **Simplify** – Reduce subdivision levels, lower polygon counts on parametric objects, avoid excessive clones.

See [Spline optimization docs](https://docs.spline.design/doc/-/doczPMIye7Ko).

### Image Optimization (Optional)

Current config has `images: { unoptimized: true }` in [next.config.js](../../../next.config.js).

- **Re-enable optimization**: Set `unoptimized: false` and add `remotePatterns` for Shopify domains (e.g. `cdn.shopify.com`). Requires compatible image provider support.
- **Keep unoptimized**: If external CDN constraints apply, keep `unoptimized: true`. ArtworkStrip uses `lib/shopify/image-url.ts` to append `_500x` to Shopify CDN URLs for smaller, faster carousel thumbnails.

## Checkout & Payment (Stripe)

The experience checkout uses a **single-screen drawer flow** powered by Stripe Checkout Sessions API with embedded Payment Element (`ui_mode: "custom"`). All 4 payment methods (Credit Card, Google Pay, Link, PayPal) are supported within the OrderBar drawer.

### Checkout Flow

1. **Cart Review**: Items, lamp discount, gift note, totals, Address, Payment, Promo rows
2. **Address Modal**: Collect shipping address (email, name, country, address, city, state/province, postal code, phone); "Same as billing" when billing exists
3. **Payment Modal**: Stripe Payment Element (card/GPay/Link/PayPal), billing address ("Same as Address"), promo codes
4. **Place Order**: Submits Payment Element; redirects to success on completion

### Address Form Enhancements

- **Address Autocomplete**: Uses **Google Places** when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set. Selecting a suggestion auto-fills street, city, state, **ZIP/postal code**, and country. ZIP codes are explicitly fetched and displayed. Without Google keys, a plain address input is shown (no autocomplete).
- **ZIP / Postal code field**: Dedicated field with label "ZIP / Postal code"; populated from autocomplete selection; supports both US ZIP and international postal codes.
- **State/Province by Country**: US, CA, AU, MX show a dropdown of states/provinces; other countries show a free-text field.
- **Phone with Country Code Detection**: Pasting or typing a full international number (e.g. `+44 7911 123456`) auto-detects the country code, updates the country dropdown, and strips the code from the local number.

### Payment Methods

| Method | How it works | Redirect? |
|--------|-------------|-----------|
| **Credit Card** | Payment Element card form → `checkout.confirm()` | No |
| **Google Pay** | Payment Element shows GPay button | No |
| **Link** | Payment Element shows Link autofill; `setup_future_usage` saves for returns | No |
| **PayPal** | Payment Element shows PayPal option → redirect to PayPal | Yes (required) |

### Stripe Checkout Session Features

- `allow_promotion_codes: true` — Native Stripe promo codes in Payment Element
- `billing_address_collection: 'auto'` — Collect billing when needed
- `payment_intent_data.setup_future_usage: 'off_session'` — Save cards for Link and returning customers
- **Saved payment methods** — Stripe Customer ID stored in `collector_profiles`/`collectors` after checkout; returning users are passed `customer` instead of `customer_email` so they can reuse saved cards, Link, etc., without re-entering.
- Session expiry recovery — "Try again" fetches new session when expired

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ExperienceSlideoutMenu` | [`app/shop/experience/ExperienceSlideoutMenu.tsx`](../../../app/shop/experience/ExperienceSlideoutMenu.tsx) | Hamburger menu with auth slide-up |
| `AuthSlideupMenu` | [`components/shop/auth/AuthSlideupMenu.tsx`](../../../components/shop/auth/AuthSlideupMenu.tsx) | Login/signup slide-up (Email OTP, Google, Facebook) |
| `OrderBar` | [`app/shop/experience/components/OrderBar.tsx`](../../../app/shop/experience/components/OrderBar.tsx) | Drawer checkout with Address, Payment, Promo |
| `AddressModal` | [`components/shop/checkout/AddressModal.tsx`](../../../components/shop/checkout/AddressModal.tsx) | Shipping address form; "Same as billing" option |
| `PaymentMethodsModal` | [`components/shop/checkout/PaymentMethodsModal.tsx`](../../../components/shop/checkout/PaymentMethodsModal.tsx) | Payment Element + billing section |
| `PaymentStep` | [`components/shop/checkout/PaymentStep.tsx`](../../../components/shop/checkout/PaymentStep.tsx) | CheckoutProvider, Payment Element, error recovery |
| `CheckoutContext` | [`lib/shop/CheckoutContext.tsx`](../../../lib/shop/CheckoutContext.tsx) | Address, billing, sameAsShipping, promo state |

### API Endpoints (Checkout)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/checkout/create-checkout-session` | Creates Checkout Session (`ui_mode: custom`) for embedded Payment Element |
| `POST /api/checkout/create` | Checkout Session (main shop cart, credits, zero-dollar flows) |
| `POST /api/checkout/complete-order` | Legacy PaymentIntent completion (idempotent) |
| `POST /api/checkout/create-setup-intent` | SetupIntent for card + Link (legacy, main cart) |

### Stripe Configuration

- Domain `app.thestreetcollector.com` registered for Google Pay
- Payment methods enabled in Stripe Dashboard: card, link, paypal
- Environment variables: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

See [docs/COMMIT_LOGS/experience-checkout-stripe-payment-methods-2026-03-01.md](../COMMIT_LOGS/experience-checkout-stripe-payment-methods-2026-03-01.md) for earlier configuration details.

## API Endpoints (Products)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/shop/products/[handle]` | Full product for ArtworkDetail (on-demand) |
| `GET /api/shop/artists/[slug]` | Artist bio/filter when arriving from `?artist=` link |

## Data Flow

- **Initial load**: Lamp (`getProduct`), Season 1 & 2 collections (`getCollectionWithListProducts`) in parallel.
- **Detail drawer**: When user opens artwork detail, full product fetched via `/api/shop/products/[handle]` and cached in memory.

## Version

- Last updated: 2026-03-04
- Version: 1.6.0

# Shop Experience Page

## Overview

The Experience page (`/shop/experience`) lets users customize a Street Lamp with artwork. It includes an intro quiz, a 3D Spline preview, an artwork strip, filters, and checkout.

**Implementation**: [`app/shop/experience/`](../../../app/shop/experience/)

## Performance Optimizations (2026-02)

### Implemented

1. **Streaming + Suspense** – Page shell renders immediately; data streams in via `loading.tsx` and Suspense fallback.
2. **Lazy Spline 3D** – `Spline3DPreview` is loaded with `next/dynamic` only when the configurator mounts.
3. **Lightweight product payload** – `getCollectionWithListProducts` uses `PRODUCT_LIST_FRAGMENT` (no description, media, full variants) for the artwork strip; full product fetched on-demand when opening ArtworkDetail.
4. **Virtualized ArtworkStrip** – `@tanstack/react-virtual` renders only visible rows (~10–15 cards instead of 100+).
5. **Reduced motion** – `whileHover` / `whileTap` removed from ArtworkCard to cut scroll-time JS work.
6. **Error boundaries** – Configurator and Spline wrapped in `ComponentErrorBoundary` for graceful degradation.

### Image Optimization (Optional)

Current config has `images: { unoptimized: true }` in [next.config.js](../../../next.config.js).

- **Re-enable optimization**: Set `unoptimized: false` and add `remotePatterns` for Shopify domains (e.g. `cdn.shopify.com`). Requires compatible image provider support.
- **Keep unoptimized**: If external CDN constraints apply, keep `unoptimized: true` and consider Shopify URL size parameters (e.g. `_medium`, `_large`) where available to reduce transfer.

## Checkout & Payment (Stripe)

The experience checkout uses a **single-screen drawer flow** powered by Stripe Checkout Sessions API with embedded Payment Element (`ui_mode: "custom"`). All 4 payment methods (Credit Card, Google Pay, Link, PayPal) are supported within the OrderBar drawer.

### Checkout Flow

1. **Cart Review**: Items, lamp discount, gift note, totals, Address, Payment, Promo rows
2. **Address Modal**: Collect shipping address (email, name, country, address, city, state/province, postal code, phone); "Same as billing" when billing exists
3. **Payment Modal**: Stripe Payment Element (card/GPay/Link/PayPal), billing address ("Same as Address"), promo codes
4. **Place Order**: Submits Payment Element; redirects to success on completion

### Address Form Enhancements

- **Mapbox Address Autocomplete**: Street address field uses Mapbox Geocoding API to suggest addresses; selecting one auto-fills city, state, postal code, country.
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

- Last updated: 2026-03-01
- Version: 1.4.0

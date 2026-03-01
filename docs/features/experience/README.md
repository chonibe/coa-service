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

The experience checkout offers two flows:

1. **In-drawer** – Multi-step flow powered by Stripe Payment Element with PaymentIntent. All 4 payment methods (Credit Card, Google Pay, Link, PayPal) are supported within the OrderBar drawer.
2. **Full-page** – Stripe Checkout Sessions (ui_mode: custom) with Payment Element, Billing/Shipping Address Elements. Users can click "Checkout on full page" to go to `/shop/checkout`.

### Multi-Step Checkout Flow

1. **Step 1 -- Cart Review**: Items, quantities, lamp discount, gift note, totals
2. **Step 2 -- Shipping Address**: Inline address form (email, name, country, address, phone)
3. **Step 3 -- Payment & Confirm**: Stripe Payment Element (card/GPay/Link/PayPal), promo code, order summary, Place Order

### Payment Methods

| Method | How it works | Redirect? |
|--------|-------------|-----------|
| **Credit Card** | Payment Element card form → `confirmPayment` | No |
| **Google Pay** | Payment Element shows GPay button (via `card` type) | No |
| **Link** | Payment Element shows Link autofill | No |
| **PayPal** | Payment Element shows PayPal option → redirect to PayPal | Yes (required) |

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| `OrderBar` | [`app/shop/experience/components/OrderBar.tsx`](../../../app/shop/experience/components/OrderBar.tsx) | 3-step drawer checkout |
| `InlineAddressForm` | [`components/shop/checkout/InlineAddressForm.tsx`](../../../components/shop/checkout/InlineAddressForm.tsx) | Compact address form for drawer |
| `PaymentStep` | [`components/shop/checkout/PaymentStep.tsx`](../../../components/shop/checkout/PaymentStep.tsx) | Stripe Payment Element + order confirm |
| `CheckoutContext` | [`lib/shop/CheckoutContext.tsx`](../../../lib/shop/CheckoutContext.tsx) | Step state, address, payment data |

### API Endpoints (Checkout)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/checkout/create-payment-intent` | Creates PaymentIntent (card, link, paypal) for in-drawer checkout |
| `POST /api/checkout/create-checkout-session` | Creates Checkout Session (ui_mode: custom) for full-page `/shop/checkout` |
| `POST /api/checkout/complete-order` | Creates Shopify order after successful payment (idempotent) |
| `POST /api/checkout/create` | Checkout Session (main shop cart, credits, zero-dollar flows) |
| `POST /api/checkout/create-setup-intent` | SetupIntent for card + Link (legacy, used by main cart) |
| `POST /api/checkout/confirm-payment` | Confirm PaymentIntent with saved card (legacy, used by main cart) |

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

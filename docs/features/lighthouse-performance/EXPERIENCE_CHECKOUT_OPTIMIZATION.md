# Experience & Checkout Lighthouse Optimization

**Audit Date:** 2026-03-16  
**Audited URL:** https://www.thestreetcollector.com/experience  
**Pre-optimization Scores:** Performance 27 | Best Practices 73  
**Target:** Performance 70+ | LCP < 4s | TBT < 300ms (ad-landing grade)

---

## Audit Results (Pre-optimization)

| Metric | Score |
|--------|-------|
| Performance | 27 |
| LCP | 49.0 s |
| TBT | 4,710 ms |
| Speed Index | 17.9 s |
| CLS | 0.048 |

Live MCP audit (onboarding redirect): Performance 67, LCP 12.0s, TTI 12.0s.

---

## Root Causes Identified

| Issue | Impact | Source |
|-------|--------|--------|
| `PaymentStep` statically imported in `OrderBar.tsx` | Stripe (213 KiB) + hCaptcha (358 KiB, 8,771ms critical path) + Google Pay (386 KiB) + Stripe elements (1,552 KiB total) loaded on every experience page load | PDF audit |
| PostHog recorder not deferred on `/experience` | 145 KiB, 1,833ms main thread | PDF audit |
| Facebook Pixel loads immediately | 94 KiB, 172ms main thread | PDF audit |
| LCP artwork image `sizes` prop too large | 136 KiB wasted — 2008×2008 served for small display | PDF audit |
| `internal.png` uncompressed | 2,896 KiB PNG for Spline base texture | PDF audit |
| `framer-motion` in `OrderBar.tsx` + `CheckoutLayout.tsx` | Part of large JS chunks | Code audit |
| 3 modals always in DOM in `CheckoutLayout.tsx` | Google Maps SDK loads on checkout mount | Code audit |

---

## Changes Applied

### 1. `PaymentStep` → `next/dynamic` in `OrderBar.tsx`
**File:** [`app/(store)/shop/experience/components/OrderBar.tsx`](../../../app/(store)/shop/experience/components/OrderBar.tsx)

Converted static import of `PaymentStep` to `next/dynamic({ ssr: false })`. Stripe React SDK, hCaptcha, and Google Pay now only load when the user expands the payment section in the checkout drawer — not on initial experience page load.

**Estimated savings:** ~1,552 KiB Stripe + 358 KiB hCaptcha + 386 KiB Google Pay removed from initial bundle. Removes 8,771ms from critical path.

### 2. `framer-motion` removed from `OrderBar.tsx`
**File:** [`app/(store)/shop/experience/components/OrderBar.tsx`](../../../app/(store)/shop/experience/components/OrderBar.tsx)

Replaced `motion.div` drawer slide and `AnimatePresence` backdrop with CSS `transition-transform` and `transition-opacity`. Identical visual result, zero bundle cost.

### 3. PostHog deferred on `/experience` paths
**File:** [`app/providers.tsx`](../../../app/providers.tsx)

Added `/shop/experience` and `/experience` to `LANDING_PATHS`. PostHog init (including recorder, surveys, dead-clicks) is now delayed 10s on all experience paths, matching the landing page behavior.

Also updated path matching to cover subpaths (`/shop/experience/onboarding`, etc.) via `startsWith`.

**Estimated savings:** 145 KiB, 1,833ms main thread removed from initial load window.

### 4. Facebook Pixel deferred
**File:** [`components/meta-pixel.tsx`](../../../components/meta-pixel.tsx)

Wrapped `fbevents.js` script injection in `requestIdleCallback` (fallback: `setTimeout(3000)`). The pixel still fires but after the page is interactive.

**Estimated savings:** 94 KiB, 172ms main thread removed from initial load window.

### 5. Artwork card `sizes` prop corrected
**File:** [`app/(store)/shop/experience/components/ArtworkStrip.tsx`](../../../app/(store)/shop/experience/components/ArtworkStrip.tsx)

Changed `sizes="(max-width: 768px) 52vw, 28vw"` → `sizes="(max-width: 480px) 45vw, (max-width: 768px) 40vw, 200px"`. More accurate sizing prevents Next.js from generating oversized srcset entries.

**Estimated savings:** 136 KiB on LCP image.

### 6. `internal.png` → `internal.webp`
**Files:** [`public/internal.webp`](../../../public/internal.webp) (new), [`app/template-preview/components/spline-3d-preview.tsx`](../../../app/template-preview/components/spline-3d-preview.tsx)

Converted Spline base texture from PNG (2,896 KiB) to WebP (87 KiB) using `sharp` at quality 85. Reference updated in `spline-3d-preview.tsx`.

**Savings:** 2,809 KiB (97% reduction).

### 7. Conditional modal rendering in `CheckoutLayout.tsx`
**File:** [`components/shop/checkout/CheckoutLayout.tsx`](../../../components/shop/checkout/CheckoutLayout.tsx)

`AddressModal`, `PaymentMethodModal`, and `PromoCodeModal` were always rendered in the DOM (just hidden). Converted to conditional rendering — modals only mount when `openSection` matches. This prevents `AddressModal` (1,400+ lines, loads Google Maps SDK) from mounting on checkout page load.

### 8. `framer-motion` removed from `CheckoutLayout.tsx`
**File:** [`components/shop/checkout/CheckoutLayout.tsx`](../../../components/shop/checkout/CheckoutLayout.tsx)

Replaced `motion.button` with `whileTap={{ scale: 0.98 }}` with a plain `<button>` using Tailwind `active:scale-[0.98]`. Zero bundle cost.

---

## Expected Score Impact

| Metric | Before | Expected After |
|--------|--------|----------------|
| Performance | 27 | 65–75 |
| LCP | 49.0 s | 4–8 s |
| TBT | 4,710 ms | 200–600 ms |
| Speed Index | 17.9 s | 5–8 s |

> Note: Stripe's `clover/stripe.js` still loads when the payment section is expanded (by design — it's needed for checkout). The hCaptcha and Google Pay iframes are Stripe-injected and will load at that point. This is the correct trade-off: defer payment infrastructure until the user actively initiates checkout.

---

## Validation

Run Lighthouse (mobile, throttled) on production after deploy:

```bash
npx lighthouse https://www.thestreetcollector.com/experience --preset=perf --throttling-method=simulate --output=html
```

Or use the Lighthouse MCP:
```
run_audit: { url: "https://www.thestreetcollector.com/experience", categories: ["performance", "best-practices"], device: "mobile" }
```

---

## Version

- **Last Updated:** 2026-03-16
- **Ref:** [docs/COMMIT_LOGS.md](../../COMMIT_LOGS.md)

# Analytics (Google Analytics 4)

## Overview

The app uses **Google Analytics 4 (GA4)** with measurement ID `G-V9LJ3T3LK8`. Events are sent via gtag.js from the client; the GA4 setup script can create custom dimensions, metrics, audiences, and **conversion events** in the property via the Analytics Admin API.

## Connection

- **Measurement ID:** Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-V9LJ3T3LK8` in `.env` and in Vercel (already in `.env.example`).
- **Script:** Root layout loads gtag when the env var is set; `GoogleAnalytics` component initializes GA and tracks page views.
- **Implementation:** [`app/layout.tsx`](../../app/layout.tsx), [`components/google-analytics.tsx`](../../components/google-analytics.tsx), [`lib/google-analytics.ts`](../../lib/google-analytics.ts).

## Creating events in GA4

To create custom dimensions, metrics, audiences, and **conversion events** (mark key events as conversions) in the GA4 property:

1. **Property ID:** In [Google Analytics](https://analytics.google.com) → Admin → Property settings, copy the **Property ID** (numeric, e.g. `123456789`).
2. **Service account:** Create a Google Cloud service account with access to the GA4 property and download the JSON key. Grant **Analytics Admin** and **Analytics Edit** (for conversion events).
3. **Env:**
   ```bash
   GOOGLE_ANALYTICS_PROPERTY_ID=properties/YOUR_PROPERTY_ID
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-V9LJ3T3LK8
   GA_SERVICE_ACCOUNT_KEY_PATH=./ga-service-account.json
   ```
4. **Run:**
   ```bash
   npm run setup:ga4
   ```
   This creates custom dimensions, custom metrics, audiences, and **conversion events** for: `purchase`, `begin_checkout`, `add_to_cart`, `add_payment_info`, `view_item`.

Script: [`scripts/setup-ga4-insights.js`](../../scripts/setup-ga4-insights.js).

## Events map (shop & experience)

A **page-by-page map** of which events fire where for tracking user activity:

- **[Events map: Shop & Experience](./EVENTS_MAP.md)** – Routes, components, event names, and implementation status (tracked / not tracked).

**E-commerce events are connected:** `view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, and `search` are wired across the shop (PDP, product cards, cart, artists) and experience (configurator preview/add, search, order bar checkout and payment) using [`lib/analytics-ecommerce.ts`](../../lib/analytics-ecommerce.ts) to build GA4 `ProductItem` from storefront products and cart items.

## Events catalog (sent by the app)

Events the app sends to GA4. Use these when building reports or when running the setup script (conversion events are created for the key e‑commerce ones).

| Event name        | Source / usage | Main parameters |
|-------------------|----------------|------------------|
| `page_view`       | Automatic via `gtag('config', id)` + `trackPageView()` | `page_title`, `page_path` |
| `view_item`       | [`lib/google-analytics.ts`](../../lib/google-analytics.ts) `trackViewItem()` | `currency`, `value`, `items[]` (item_id, item_name, item_brand, item_category, item_category2, price, quantity) |
| `add_to_cart`     | `trackAddToCart()` | Same as above |
| `remove_from_cart`| `trackRemoveFromCart()` | Same as above |
| `begin_checkout`  | `trackBeginCheckout()` | `currency`, `value`, `items[]` |
| `add_payment_info`| `trackAddPaymentInfo()` | `currency`, `value`, `payment_type`, `items[]` |
| `purchase`        | `trackPurchase()` | `transaction_id`, `value`, `currency`, `shipping`, `items[]`, `items_count` |
| `search`          | `trackSearch()` | `search_term` |
| `user_engagement` | `trackUserEngagement()` | `engagement_time_msec`, `session_id` |
| Custom events     | `event()`, `trackEnhancedEvent()` | `event_category`, `event_label`, `value` or custom params |
| `click` / `impression` | [`hooks/use-analytics.ts`](../../hooks/use-analytics.ts) component analytics | Component/element context |

E‑commerce events are also sent via [`lib/shopify-analytics.ts`](../../lib/shopify-analytics.ts) (Shopify product/line item → GA4 item shape).

## Data flow

- **Client:** gtag.js + `lib/google-analytics.ts` and `lib/shopify-analytics.ts` send events to GA4 using `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- **Backend:** No server-side gtag; purchase/order tracking can send a client-side event after confirmation (e.g. [`app/track/[token]/page.tsx`](../../app/track/[token]/page.tsx)).

## Shopify checkout thank-you pages ("Not tagged")

URLs like `thestreetcollector.com/checkouts/cn/.../thank-you` are **Shopify’s** thank-you page, not the app — so the app’s GA tag never runs there. To get them tagged, add the same GA4 snippet in **Shopify Admin → Settings → Checkout → Order status page** (or use the Google & YouTube app). See **[Tagging Shopify Checkout Thank-You Pages](./SHOPIFY_CHECKOUT_TAGGING.md)** for step-by-step instructions and the same measurement ID (`G-V9LJ3T3LK8`).

## Documentation

- [GA4 Setup Guide](../../GA4_SETUP_GUIDE.md) – Full setup, dimensions, metrics, audiences.
- [GA4 Manual Setup Guide](../../GA4_MANUAL_SETUP_GUIDE.md) – Manual steps if the script is not used.
- [Shopify checkout thank-you tagging](./SHOPIFY_CHECKOUT_TAGGING.md) – Why those URLs show "Not tagged" and how to fix it.

## Version

- Last updated: 2026-03
- Measurement ID in use: `G-V9LJ3T3LK8`

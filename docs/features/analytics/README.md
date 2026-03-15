# Analytics (GA4 + PostHog)

## Overview

The app uses **Google Analytics 4 (GA4)** for e-commerce and marketing analytics, **PostHog** for session replay/product analytics/heatmaps, and **Meta Conversions API** for server-side ad conversion signals. GA4 events are sent via gtag.js; PostHog is initialized in the client provider and captures pageviews and autocapture events.

## Meta Conversions API (CAPI)

- **Env:** Set `META_DATASET_API_KEY`, `META_DATASET_ID` (or `META_PIXEL_ID`), and `NEXT_PUBLIC_META_PIXEL_ID` in Vercel.
- **Connected account:** Business `Street Collector` (`114285802744042`) with dataset `Website Events` (`1315234756106483`).
- **Implementation:** Client e-commerce tracking in [`lib/google-analytics.ts`](../../lib/google-analytics.ts) mirrors key events to [`/api/meta/conversions`](../../app/api/meta/conversions/route.ts), which forwards them to Meta Graph API.
- **Events wired:** `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`, `Purchase`, `Refund`, `Search`, `Lead`.
- **Server source-of-truth events:** Stripe webhook also sends `Purchase` and `Refund` directly to Meta from [`app/api/stripe/webhook/route.ts`](../../app/api/stripe/webhook/route.ts) for stronger reliability than thank-you-page-only tracking.
- **Lead events:** Newsletter signup ([`app/api/shop/newsletter/route.ts`](../../app/api/shop/newsletter/route.ts)) and experience quiz signup ([`app/api/experience/quiz-signup/route.ts`](../../app/api/experience/quiz-signup/route.ts)) fire `Lead` events to Meta CAPI with hashed email.
- **Dedup:** Browser Pixel and CAPI share the same `event_id` per event for deduplication in Meta Events Manager.
- **Match keys:** `_fbp` / `_fbc` cookies are forwarded when available; server adds `client_ip_address` and `client_user_agent`; checkout events now also pass hashed email (`em`) when available.
- **Parameter Builder Library:** Implemented Meta's Parameter Builder Library ([`lib/meta-parameter-builder.ts`](../../lib/meta-parameter-builder.ts) and [`lib/meta-parameter-builder-server.ts`](../../lib/meta-parameter-builder-server.ts)) to automatically generate and enhance fbc/fbp parameters with proper formatting and appendix fields. This improves Event Match Quality (EMQ) scores by ensuring consistent parameter coverage and quality.
- **Custom Audiences:** Buyers are automatically synced to Meta Custom Audiences via [`lib/meta-custom-audiences-server.ts`](../../lib/meta-custom-audiences-server.ts) for retargeting and lookalike audience building. Requires `META_CUSTOM_AUDIENCE_ID` env var.
- **AEM Event Priority:** Register and prioritize your 8 events in Meta Events Manager → Settings → Aggregated Event Measurement. Recommended priority order: `Purchase` > `InitiateCheckout` > `AddToCart` > `ViewContent` > `AddPaymentInfo` > `PageView` > `Search` > `Lead`. This ensures iOS 14+ users count toward conversions.
- **Testing:** Optionally set `META_TEST_EVENT_CODE` and verify in Meta Events Manager > Test Events.
- **Diagnostics:** Admin-only endpoint [`/api/meta/diagnostics`](../../app/api/meta/diagnostics/route.ts) shows Meta env readiness, recent Stripe webhook health counts, and field completeness metrics for EMQ tracking.

## PostHog (session replay, heatmaps, user journeys, funnels)

- **Env:** Set `NEXT_PUBLIC_POSTHOG_KEY` (project API key from [PostHog](https://posthog.com)) and optionally `NEXT_PUBLIC_POSTHOG_HOST` (default `https://us.i.posthog.com`) in `.env.local` and in Vercel.
- **Implementation:** [`app/providers.tsx`](../../app/providers.tsx) – `PostHogWrapper` initializes PostHog with direct API host (`us.i.posthog.com`). CSP in [`next.config.js`](../../next.config.js) allows PostHog domains. Features: **session replay**, **heatmaps**, **autocapture**, **pageleave**, **dead clicks**, **rageclick**, **session context capture**. `PostHogIdentify` identifies logged-in shop users so journeys and funnels are tied to users.
- **Session Context:** On init, `captureSessionContext()` fires `session_context` with `referrer`, `device_type`, `is_returning_user`, `screen_width`, `screen_height`, and `language`. Also sets `preferred_device` as a person property.
- **E-commerce:** All GA4 e-commerce events (`view_item`, `add_to_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`, `search`) are mirrored to PostHog from [`lib/google-analytics.ts`](../../lib/google-analytics.ts) / [`lib/posthog.ts`](../../lib/posthog.ts). `begin_checkout` fires **after** the checkout session is successfully created (not before). Each item includes **`item_list_name`** (stage: `home` | `products` | `artist` | `pdp` | `experience`).
- **Funnel events:** [`lib/posthog.ts`](../../lib/posthog.ts) defines `FunnelEvents` and `captureFunnelEvent()` for onboarding and experience. New events include step-level quiz tracking, error events wired to all error paths, claim flow events, and checkout lifecycle events.
- **Micro-interaction events:** `onboarding_step_viewed`, `onboarding_step_interaction`, `onboarding_step_abandoned`, `onboarding_field_focused`, `checkout_step_viewed` — granular step-level events for heatmap-level funnel analysis.
- **Session replay tagging:** `tagSessionForReplay(tag)` from `lib/posthog.ts` fires `session_tagged` at critical drop-off points (`checkout-error`, `payment-error`) so you can filter session replays in PostHog.
- **Feature flags:** `hooks/use-posthog-feature-flag.ts` exports `usePostHogFeatureFlag` and `usePostHogFeatureFlagEnabled` hooks. The A/B test variant is mirrored to PostHog person properties via `experience_ab_variant`.
- **User properties:** `setUserProperty(key, value)` from `lib/posthog.ts` sets person properties. Properties tracked: `preferred_device`, `experience_ab_variant`, `total_purchases`, `first_purchase_at`.
- **Event map:** [Events map: Shop & Experience](./EVENTS_MAP.md) lists all events and where they fire.
- **Usage:** Use `captureFunnelEvent(name, props)` / helpers from `lib/posthog.ts`. Use `usePostHog()` from `posthog-js/react` in client components.

### Insight setup script

To create all PostHog insights (10 funnels, 12 trends, 8 paths, 20 cohorts, 4 dashboards) run:

```bash
POSTHOG_API_KEY=phx_xxx POSTHOG_PROJECT_ID=12345 node scripts/setup-posthog-insights.js
```

Or use the npm script:

```bash
npm run setup:posthog
```

**Get your credentials:**
- Personal API key: [PostHog Settings → API Keys](https://app.posthog.com/settings/user-api-keys)
- Project ID: [PostHog Settings → Project](https://app.posthog.com/settings/project)

**Vercel deployment integration:**

The script runs automatically during Vercel production deployments via the `postbuild` hook. To enable:

1. **Set environment variables in Vercel:**
   - `POSTHOG_API_KEY` — Your PostHog Personal API key
   - `POSTHOG_PROJECT_ID` — Your PostHog Project ID
   - `POSTHOG_SETUP_ENABLED` — Set to `true` (optional, defaults to enabled if API key is set)

2. **The script will:**
   - Run automatically after each production build
   - Skip if insights already exist (idempotent)
   - Only run in production (`VERCEL_ENV=production`)
   - Log results to Vercel build logs

To disable automatic setup, set `POSTHOG_SETUP_ENABLED=false` in Vercel environment variables.

**Manual setup (one-time):**

If you prefer to run it manually once instead of on every deploy:

```bash
# Set env vars in Vercel, then run locally or via Vercel CLI:
vercel env pull .env.local
POSTHOG_API_KEY=phx_xxx POSTHOG_PROJECT_ID=12345 npm run setup:posthog
```

### Session replay configuration

Sessions at critical drop-off points are tagged using `tagSessionForReplay('checkout-error')` and `tagSessionForReplay('payment-error')` so you can filter replays in PostHog → Session Replays → filter by `session_tagged.tag`.

To configure replay masks for sensitive fields: PostHog Settings → Session Replay → Privacy → add selectors for `input[type="password"]`, `input[autocomplete="cc-number"]`.

### Heatmaps

Heatmaps are enabled via `enable_heatmaps: true` in PostHog init. To create heatmaps for specific pages: PostHog → Heatmaps → New Heatmap → enter the URL. Recommended pages:
- `/shop/experience/onboarding` (step 1, 2, 3)
- `/shop/cart`
- `/collector/welcome`

### Real-time alerts

To set up alerts: PostHog → Alerts → New Alert → select insight → configure thresholds. Recommended alerts:
- Checkout error rate > 5% (insight: "Trend · Checkout Error Rate")
- Payment error rate > 5% (insight: "Trend · Payment Error Rate")
- Daily purchases drop > 30% (insight: "Trend · Daily Purchase Volume")
- Onboarding completion rate drop > 20% (insight: "Trend · Onboarding Completion Rate")

### PostHog dashboards & insights

Four dashboards are created by the setup script. Each dashboard groups related insights:

| Dashboard | Insights included |
|-----------|------------------|
| 📊 Funnel & Onboarding Analytics | 10 funnels: purchase, quiz, collector onboarding, checkout, experience→purchase, claim, redirect, error recovery, gift vs self, A/B test |
| 📈 Conversion Optimization | 12 trends: onboarding rate, skip rate, checkout errors, payment errors, purchases, add-to-cart, collector onboarding, promo, cancellation, filter usage, device split, new vs returning |
| 🗺️ User Journey Paths | 8 paths: landing→purchase, after quiz, after error, after skip, after collector onboarding, post-purchase, claim flow, cart drop-off |
| 👥 Audience Cohorts | 20 cohorts: quiz completers, skippers, collector completers, checkout abandoners, purchasers, error users, A/B variants, mobile/desktop, gift buyers, returning users, promo users, redirect users, high-engagement, lamp owners, claim flow, onboarding skippers, repeat purchasers, first-time purchasers |

All insights use **Filter out internal and test users**. Add your email or distinct_id via code (see env vars below) or in [Project Settings → Filter out internal users](https://eu.posthog.com/project/settings).

**Filter via code** (recommended): Set `NEXT_PUBLIC_POSTHOG_FILTER_EMAILS` and/or `NEXT_PUBLIC_POSTHOG_FILTER_DISTINCT_IDS` in `.env.local` and Vercel. Events from matched users are dropped before sending. For anonymous sessions, visit your site once with `?posthog_filter_me=1` to filter this device.

**Dashboard URL (EU Cloud):** [Street Collector Analytics](https://eu.posthog.com/project/138294/dashboard/560539)

To add more insights or dashboards via MCP, use tools such as `insight-create-from-query`, `dashboard-create`, and `add-insight-to-dashboard`. Ensure the PostHog MCP is configured for EU Cloud if using `eu.posthog.com`.

### PostHog troubleshooting

1. **Get your project key:** [PostHog → Project Settings](https://app.posthog.com/project/settings) (US) or [eu.posthog.com → Project Settings](https://eu.posthog.com/project/settings) (EU Cloud) → copy the **Project API Key** (`phc_...`).
2. **Set env vars:** Add to `.env.local` and Vercel:
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```
3. **Verify events:** Use the [PostHog MCP](https://posthog.com/docs/model-context-protocol) (`event-definitions-list`, `projects-get`) to confirm events are ingested. If `ingested_event: false`, tracking is not receiving data — check the key and redeploy.
4. **Local dev:** Pull env from Vercel (`vercel env pull`) so `.env.local` matches production.

5. **config.js 404 / flags 401:** The SDK loads config from `us-assets.i.posthog.com/array/.../config` and `/flags`. If you see 404 or 401 errors, event capture or session recording can fail. The app uses `advanced_disable_flags: false` so session recording works (the `/flags` endpoint provides recording destination info). Ensure your PostHog project and token are valid.

6. **"API key invalid or expired" / "request missing data payload":** Ensure you use the **Project API Key** (starts with `phc_`, ~50 chars) from [PostHog → Project Settings](https://app.posthog.com/project/settings), not a personal API key or the placeholder `phc_your_project_api_key`. Invalid keys cause 401/404 and malformed requests. The app skips PostHog init when the key looks like a placeholder.

7. **"Uncaught SyntaxError: Invalid or unexpected token":** If the key is injected with a trailing newline or invalid character (common when pasting from Vercel/env), the inline script breaks. The layout now uses `JSON.stringify` and `.trim()` to sanitize the key. If it persists, re-paste the key in Vercel env vars (ensure no trailing spaces/newlines) and redeploy.

8. **Zero data (DAUs, pageviews, etc. all zero):** No events reaching PostHog. Checklist:
   - **Vercel env:** Ensure `NEXT_PUBLIC_POSTHOG_KEY` is set in [Vercel → Project → Settings → Environment Variables](https://vercel.com) for Production. Must be the **Project API Key** from [PostHog Project Settings](https://app.posthog.com/project/settings), not a personal API key.
   - **Region match:** If your PostHog project is **EU Cloud**, set `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`. US Cloud uses `https://us.i.posthog.com`.
   - **Redeploy:** After changing env vars, trigger a new production deployment. Build-time inlining means a fresh deploy is required.
   - **Debug:** Add `?__posthog_debug=true` to your site URL and open DevTools Console. PostHog will log init, capture, and network requests. If you see "PostHog initialized" and batch requests to `us.i.posthog.com/e/` with status 200, events are sending — wait a few minutes for dashboards to update.
   - **SyntaxError blocks init:** If the page has a SyntaxError before PostHog init, the SDK never loads. Fix the key (see #7) and redeploy.

9. **Fewer countries or live sessions than GA4:** PostHog EU Cloud has **IP capture disabled by default** (GDPR). Without IP, PostHog cannot geolocate users, so country breakdowns are missing or sparse. To fix:
   1. Go to [eu.posthog.com → Settings → Project → General](https://eu.posthog.com/project/settings)
   2. Find **IP data capture configuration**
   3. **Enable** IP capture (or turn off “Discard client IP data”)
   4. New events will include geo data; historical events stay unchanged. Country breakdowns and live session geo will appear within a few hours.

10. **Session replay not recording:** The app has `disable_session_recording: false` and `advanced_disable_flags: false` (needed so the SDK can fetch the recorder). If no recordings appear:
    - **CSP:** The session replay recorder script is loaded from PostHog; CSP must allow it. [`next.config.js`](../../next.config.js) includes `https://eu.i.posthog.com` and `https://us.i.posthog.com` in `script-src` for the recorder. If you changed CSP, ensure those hosts (and `eu-assets.i.posthog.com` / `us-assets.i.posthog.com`) remain in `script-src` and `connect-src`.
    - **Project settings:** In [PostHog → Project settings → Replay](https://eu.posthog.com/project/settings#replay) (or Environment → Replay), ensure session replay is **enabled** for the project. If “Authorized domains for replay” exists (older projects), either add your domain (e.g. `https://streetcollector.vercel.app`, `https://thestreetcollector.com`) or leave the list empty to allow all.
    - **Triggers:** If you use “Enable recordings when URL matches” or other triggers, ensure they match your site URLs so some sessions are recorded.
    - **Console:** With `?__posthog_debug=true`, check the browser console for CSP or script-load errors related to PostHog/recorder.

11. **GA tag loads but no GA4 hits (`g/collect`)**: Ensure CSP allows regional GA endpoints. The app allows both `https://www.google-analytics.com` and `https://*.google-analytics.com` in `connect-src`. If this is missing, `gtag.js` can load while event beacons are blocked.

## Google Analytics 4 (GA4)

- **Measurement ID:** Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-LLPL68MSTS` in `.env` and in Vercel.
- **Script:** Root layout loads gtag when the env var is set; `GoogleAnalytics` initializes GA and tracks page views on initial load and on client route changes by observing `history.pushState`, `history.replaceState`, and `popstate`.
- **Consent behavior:** The app sets Consent Mode default deny before loading `gtag.js`, then immediately applies `consent update` with `analytics_storage: granted` so GA4 events are not blocked.
- **Load timing:** GA script initializes immediately on client mount to reduce missed first-interaction events.
- **Event queueing:** GA events use a dataLayer-backed dispatcher, so early events queue even if `gtag.js` is still loading.
- **Proxy fallback:** GA events are mirrored to a first-party API endpoint (`/api/analytics/ga-proxy`) which forwards to GA4 `g/collect` to avoid client-side blocking edge cases.
- **Implementation:** [`app/layout.tsx`](../../app/layout.tsx), [`components/google-analytics.tsx`](../../components/google-analytics.tsx), [`lib/google-analytics.ts`](../../lib/google-analytics.ts), [`app/api/analytics/ga-proxy/route.ts`](../../app/api/analytics/ga-proxy/route.ts).

## Google Ads Enhanced Conversions

- **Env:** Set `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` (your Google Ads account ID, e.g., `AW-XXXXXXXXX`) and `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` (conversion label for Purchase event) in Vercel.
- **Implementation:** Purchase events on checkout success page ([`app/(store)/shop/checkout/success/checkout-success-content.tsx`](../../app/(store)/shop/checkout/success/checkout-success-content.tsx)) fire Google Ads conversion tags via [`lib/google-analytics.ts`](../../lib/google-analytics.ts) `trackGoogleAdsConversion()`.
- **Enhanced Conversions:** Email addresses are automatically hashed (SHA-256) and sent with conversion events for improved match quality and ROAS accuracy.
- **Events:** `Purchase` conversions are tracked with value, currency, transaction ID, and hashed email.

## TikTok Events API

- **Env:** Set `NEXT_PUBLIC_TIKTOK_PIXEL_ID` (public, for browser pixel) and `TIKTOK_EVENTS_API_TOKEN` (secret, for server Events API) in Vercel.
- **Browser Pixel:** TikTok Pixel base code is loaded via [`components/tiktok-pixel.tsx`](../../components/tiktok-pixel.tsx) in the root layout.
- **Server-Side Events:** Purchase events are sent server-side via [`lib/tiktok-events-server.ts`](../../lib/tiktok-events-server.ts) from the Stripe webhook. Lead events (`SubmitForm`) are sent from newsletter and quiz signup routes.
- **Events wired:** `Purchase` (from Stripe webhook), `SubmitForm` (from newsletter and quiz signup).
- **PII Handling:** All user data (email, phone, name, address) is hashed with SHA-256 before sending to TikTok Events API.
- **Implementation:** [`lib/tiktok-events-server.ts`](../../lib/tiktok-events-server.ts), [`components/tiktok-pixel.tsx`](../../components/tiktok-pixel.tsx), [`app/api/stripe/webhook/route.ts`](../../app/api/stripe/webhook/route.ts), [`app/api/shop/newsletter/route.ts`](../../app/api/shop/newsletter/route.ts), [`app/api/experience/quiz-signup/route.ts`](../../app/api/experience/quiz-signup/route.ts).

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

## Environment Variables Summary

| Variable | Purpose | Required |
|---------|---------|----------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID | Yes |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` | Google Ads account ID (e.g., `AW-XXXXXXXXX`) | Optional |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | Google Ads conversion label for Purchase | Optional (if using Google Ads) |
| `META_DATASET_API_KEY` | Meta Conversions API access token | Yes (if using Meta) |
| `META_DATASET_ID` | Meta dataset ID | Yes (if using Meta) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID | Yes (if using Meta) |
| `META_CUSTOM_AUDIENCE_ID` | Meta Custom Audience ID for buyer sync | Optional |
| `META_TEST_EVENT_CODE` | Meta test event code for testing | Optional |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | TikTok Pixel ID | Optional |
| `TIKTOK_EVENTS_API_TOKEN` | TikTok Events API access token | Optional (if using TikTok) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key | Optional |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog API host | Optional (defaults to `https://us.i.posthog.com`) |

## Meta AEM Event Priority Registration

To ensure iOS 14+ users count toward conversions, register and prioritize your events in Meta Events Manager:

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Select your dataset (`Website Events` / `1315234756106483`)
3. Navigate to **Settings** → **Aggregated Event Measurement**
4. Register and prioritize your 8 events in this order:
   - `Purchase` (highest priority)
   - `InitiateCheckout`
   - `AddToCart`
   - `ViewContent`
   - `AddPaymentInfo`
   - `PageView`
   - `Search`
   - `Lead` (lowest priority)

This ensures that when iOS 14+ users opt out of tracking, Meta will still count conversions using the highest-priority event available.

## Version

- Last updated: 2026-03
- Measurement ID in use: `G-V9LJ3T3LK8`

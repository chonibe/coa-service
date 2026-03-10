# Analytics (GA4 + PostHog)

## Overview

The app uses **Google Analytics 4 (GA4)** for e-commerce and marketing analytics and **PostHog** for session replay, product analytics, and heatmaps. GA4 events are sent via gtag.js; PostHog is initialized in the client provider and captures pageviews and autocapture events.

## PostHog (session replay, heatmaps, user journeys, funnels)

- **Env:** Set `NEXT_PUBLIC_POSTHOG_KEY` (project API key from [PostHog](https://posthog.com)) and optionally `NEXT_PUBLIC_POSTHOG_HOST` (default `https://us.i.posthog.com`) in `.env.local` and in Vercel.
- **Implementation:** [`app/providers.tsx`](../../app/providers.tsx) – `PostHogWrapper` initializes PostHog with direct API host (`us.i.posthog.com`). CSP in [`next.config.js`](../../next.config.js) allows PostHog domains. Features: **session replay**, **heatmaps**, **autocapture**, **pageleave**, **dead clicks**, **rageclick**. `PostHogIdentify` identifies logged-in shop users so journeys and funnels are tied to users. Root layout injects the key at runtime so tracking works even when the client bundle was built before the env was set.
- **E-commerce:** All GA4 e-commerce events (`view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`, `search`) are mirrored to PostHog from [`lib/google-analytics.ts`](../../lib/google-analytics.ts) (PostHog receives them even when GA is disabled).
- **Funnel events:** [`lib/posthog.ts`](../../lib/posthog.ts) defines `FunnelEvents` and `captureFunnelEvent()` for onboarding and experience (vendor/collector onboarding steps, experience quiz, experience started, filter applied). Use these in PostHog to build **funnels** and **paths** and find drop-off.
- **Event map:** [Events map: Shop & Experience](./EVENTS_MAP.md) lists all events and where they fire; PostHog funnel events are documented there.
- **Usage:** Use `usePostHog()` from `posthog-js/react` in client components, or `captureFunnelEvent(name, props)` / helpers from `lib/posthog.ts`.

### PostHog dashboard & MCP configuration

The **Street Collector Analytics** dashboard is configured in PostHog with the following insights (created via [PostHog MCP](https://posthog.com/docs/model-context-protocol)):

| Insight | Type | Events / metrics |
|---------|------|------------------|
| Pageviews (7 days) | Trends | `$pageview` daily total |
| Key events (7 days) | Trends | `$pageview`, `view_item`, `add_to_cart` over time |
| Experience → Purchase funnel | Funnel | experience_started → view_item → add_to_cart → begin_checkout → purchase |
| Experience quiz funnel | Funnel | experience_quiz_started → experience_quiz_completed → experience_started |
| Top pages (7 days) | Trends table | Pageviews by `$pathname` (top 10) |
| Daily active users (14 days) | Trends | Unique users (DAU) by day |
| User paths (14 days) | Paths | Pageview and custom event flows |

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

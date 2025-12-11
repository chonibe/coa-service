# Collector Dashboard

> Version: 1.0.0 · Last Updated: 2025-12-11

## Overview and Purpose
Collector-facing dashboard that lets collectors view purchased artworks, track authentication status, explore artists/series, and manage credits/subscriptions with Shopify purchasing links.

## Implementation Links
- Dashboard page: [`app/collector/dashboard/page.tsx`](../../app/collector/dashboard/page.tsx)
- Aggregation API: [`app/api/collector/dashboard/route.ts`](../../app/api/collector/dashboard/route.ts)
- Journey link-out: [`app/collector/journey/[vendorName]/page.tsx`](../../app/collector/journey/%5BvendorName%5D/page.tsx)

## Test Files
- Manual test plan: [`docs/features/collector-dashboard/tests.md`](./tests.md)

## Performance Tracking
- Dashboard uses existing logging/monitoring; see [`docs/MONITORING_STRATEGY.md`](../../docs/MONITORING_STRATEGY.md). Add page-specific metrics via frontend console logging if needed.

## Technical Implementation Details
- Data source: Shopify customer ID cookie drives order lookup (`orders` + `order_line_items_v2`).
- Series mapping: `artwork_series_members.shopify_product_id` joins to line items to label series/artist journeys.
- Credits/subscriptions: Reuses banking endpoints (`/api/banking/collector-identifier`, `/api/banking/balance`, `/api/banking/subscriptions/manage`).
- UI components: Cards for artworks, artists, series binder, authentication queue, credits panel (wrapping `BankingDashboard` + `SubscriptionManager`).
- Purchase links: Direct to Shopify product detail pages (`/products/{product_id}`).
- Collector auth options:
  - Shopify customer login via `/api/auth/shopify` (sets `shopify_customer_id`).
  - Google login via `/api/auth/collector/google/start` → `/auth/collector/callback` (maps email to orders.customer_email, sets `collector_session` + `shopify_customer_id`).
  - Vendor self-switch via `/api/auth/collector/switch` (uses vendor session + vendor email to set collector cookies).

## API Endpoints and Usage
- `GET /api/collector/dashboard`
  - Auth: Shopify customer cookie (`shopify_customer_id`).
  - Returns: orders with line items, artist aggregates, series binder entries, authentication counts, collectorIdentifier, balance/subscriptions snapshot.
- Related existing endpoints leveraged:
  - `GET /api/collector/journey/[vendorName]` (artist journey view)
  - `GET /api/banking/collector-identifier`
  - `GET /api/banking/balance`
  - `GET /api/banking/subscriptions/manage`

## Database Schema Changes
- None introduced by this feature. Uses existing `orders`, `order_line_items_v2`, `artwork_series`, `artwork_series_members`.

## UI/UX Considerations
- Mobile-friendly grid/cards with shadcn/ui.
- Authentication queue highlights NFC pending items.
- Clear CTA links: certificate view, authenticate, view on Shopify, view artist journey.
- Series binder shows progress and owned counts.
- Credits panel surfaces balance + subscriptions in one view.

## Testing Requirements
- Load `/collector/dashboard` as a Shopify-authenticated customer: verify orders, counts, and CTA links.
- Empty states: no orders, no pending authentication, no series.
- Journey links: navigate to `/collector/journey/{vendorName}`.
- Credits/subscriptions: render balance and subscription manager when `collector_identifier` is present.
- Mobile viewport smoke test (responsive cards).

## Deployment Considerations
- Requires Shopify customer cookie flow to be set in the environment.
- No new env vars introduced.
- Ensure Vercel deployment includes Supabase service key access as already configured.

## Known Limitations
- Product URL assumes `/products/{product_id}` path; adjust if storefront differs.
- Banking/subscription calls rely on same-origin fetch; cross-origin setups may need CORS allowances.
- No pagination beyond latest 50 orders.
- Google login requires email match to an existing Shopify customer email (orders.customer_email). If no match is found, user is redirected with error.

## Future Improvements
- Add pagination and filters (by artist/series/auth status).
- Inline certificate preview and NFC scan initiation.
- Performance telemetry for dashboard load and section render times.
- Personalized recommendations per collector purchase history.

## Change Log
- 1.0.0: Initial collector dashboard release with orders, series binder, artist explorer, authentication queue, and credits/subscriptions surface.


# ChinaDivision Auto-Fulfillment

## Overview
Automatically detects ChinaDivision orders that move from approving to in-transit/shipped, generates shareable tracking links, emails customers (using recipient name + ship email), and creates Shopify fulfillments with tracking numbers.

## References
- Implementation: `app/api/warehouse/orders/auto-fulfill/route.ts`
- Shopify fulfillment helper: `lib/shopify/fulfillment.ts`
- Tracking email utility: `lib/notifications/tracking-link.ts`
- Tests: `tests/chinadivision-auto-fulfillment.md`
- Performance tracking: `lib/monitoring/README.md`
- Version: 1.1.1
- Change log: Initial automation added (2025-12-11)

## Technical Implementation Details
- Polls last 30 days of ChinaDivision orders via `createChinaDivisionClient().getOrdersInfo`.
- Eligibility: tracking number present AND (`track_status` >= 101 in-transit) OR `status` === 3 shipped.
- Tracking links: reuse or insert into `shared_order_tracking_links`; title includes recipient name.
- Notification prefs: upsert `tracking_link_notification_preferences` with `ship_email`; stores `last_notified_status`.
- Email: `sendTrackingUpdateEmail` renders recipient name and `/track/{token}` link; sent via Resend.
- Shopify: Uses Fulfillment Orders API (`createFulfillmentWithTracking`) to attach tracking number/URL; `notify_customer=false` (email handled by us).
- Database updates: `orders.fulfillment_status='fulfilled'`, `order_line_items` tracking fields + status fulfilled.
- Idempotency: skips if missing order_id; reuses existing link; can be run with `dryRun=true` for no side effects.

## API Endpoints & Usage
- `POST /api/warehouse/orders/auto-fulfill?dryRun=true|false`
  - Headers: `x-cron-secret: <CRON_SECRET>`
  - Body: none
  - Response: summary `{success, eligible, linksCreated, emailsSent, fulfillmentsCreated, results[]}`
  - Dry run skips DB/email/Shopify writes.

## Database Schema Changes
- Reuses existing tables: `shared_order_tracking_links`, `tracking_link_notification_preferences`, `orders`, `order_line_items`.

## UI/UX Considerations
- Customers receive branded email with recipient name and tracking link.
- Shopify notifications remain off to avoid duplicate emails; all messaging comes from platform template.
- Tracking page `/track/[token]` already supports status/labels.

## Testing Requirements
- Dry-run invocation returns success without side effects.
- Live invocation sends one email to `ship_email`, creates Shopify fulfillment with tracking number, and updates Supabase statuses.
- Tracking link opens and shows order; notification preferences reflect last_notified_status.
- No duplicate fulfillments when rerun on already-fulfilled orders.

## Deployment Considerations
- Ensure env vars set: `CRON_SECRET`, `CHINADIVISION_API_KEY`, `SHOPIFY_ACCESS_TOKEN`, `SHOPIFY_SHOP`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.
- Add scheduled cron to hit the endpoint with the secret.
- Deploy via Vercel after changes.

## Data Fetching Logic
- ChinaDivision API: `getOrdersInfo` (last 30 days).
- Supabase: `shared_order_tracking_links`, `tracking_link_notification_preferences`, `orders`, `order_line_items`.
- Shopify: Fulfillment Orders API v2024-01.

## Known Limitations
- Assumes `order_id` maps to Shopify order id; mismatches will skip fulfillment.
- Uses first open/in_progress fulfillment order; multi-location edge cases not handled.
- Email requires Resend configured; otherwise send will fail.

## Future Improvements
- Add webhook-driven updates instead of polling.
- Handle multi-location fulfillment selection.
- Add rate-limit backoff metrics and retries for Shopify/Resend.
- Write automated integration test harness with mocked APIs.


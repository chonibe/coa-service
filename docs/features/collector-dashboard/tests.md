# Collector Dashboard Manual Tests

Related implementation:
- Dashboard page: [`app/collector/dashboard/page.tsx`](../../app/collector/dashboard/page.tsx)
- API: [`app/api/collector/dashboard/route.ts`](../../app/api/collector/dashboard/route.ts)

## Smoke Tests
- Load `/collector/dashboard` with a valid `shopify_customer_id` cookie; expect stats cards, artworks grid, artist list, series binder, authentication queue, and credits panel to render without errors.
- Empty-state check: with no orders, expect friendly cards for artworks/artists/series/auth queue.
- Shopify Google login: click “Continue with Google” (unauthenticated state) → authenticate → expect redirect to `/collector/dashboard` with orders loaded and `shopify_customer_id` + `collector_session` cookies present.

## Authentication Status
- Verify an item with `nfc_tag_id` and `nfc_claimed_at` shows “Authenticated”.
- Verify an item with `nfc_tag_id` and no `nfc_claimed_at` appears in Authentication Queue and “Pending Authentication”.

## Certificates
- For items with `certificate_url`, “View certificate” opens a new tab to the certificate.

## Shopify Links
- “View on Shopify” opens `/products/{product_id}` and does not 404.

## Artist Journeys and Series
- “View journey” button routes to `/collector/journey/{vendorName}`.
- Series binder cards open `/vendor/{vendorName}/series/{seriesId}`.

## Credits & Subscriptions
- When `collector_identifier` is present, balance and subscription manager render; creating/canceling a subscription succeeds via `/api/banking/subscriptions/*`.

## Responsiveness
- Test at mobile width (<768px): cards stack, no horizontal scroll.

## Error Handling
- Remove customer cookie: expect redirect or error message prompting login without unhandled exceptions in console.


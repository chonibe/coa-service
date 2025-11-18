# Vendor Dashboard Hardening

## Feature Overview
- Harden vendor authentication to prevent session bleed across vendors.
- Align sales, analytics, and payout reporting with canonical `order_line_items_v2` data.
- Deliver consistent GBP-denominated insights across dashboard surfaces.

## Implementation Summary
- Implementation: [`app/vendor/dashboard/page.tsx`](../../../app/vendor/dashboard/page.tsx)
- Core APIs:
  - [`app/api/auth/google/start/route.ts`](../../../app/api/auth/google/start/route.ts)
  - [`app/auth/callback/route.ts`](../../../app/auth/callback/route.ts)
  - [`app/api/auth/status/route.ts`](../../../app/api/auth/status/route.ts)
  - [`app/api/auth/impersonate/route.ts`](../../../app/api/auth/impersonate/route.ts)
  - [`app/api/vendor/stats/route.ts`](../../../app/api/vendor/stats/route.ts)
  - [`app/api/vendor/sales-analytics/route.ts`](../../../app/api/vendor/sales-analytics/route.ts)
  - [`app/api/vendors/products/route.ts`](../../../app/api/vendors/products/route.ts)
- Admin Session Utilities: [`lib/admin-session.ts`](../../../lib/admin-session.ts) (for shared OAuth callback)
- Email Overrides: [`lib/vendor-auth.ts`](../../../lib/vendor-auth.ts) (`EMAIL_VENDOR_OVERRIDES`)
- Session Utility: [`lib/vendor-session.ts`](../../../lib/vendor-session.ts)
- Auth Helpers: [`lib/vendor-auth.ts`](../../../lib/vendor-auth.ts)
- Tests:
  - [`tests/vendor-session.test.ts`](../../../tests/vendor-session.test.ts)
  - [`tests/vendor-auth.test.ts`](../../../tests/vendor-auth.test.ts)
- Performance Tracking: [`docs/performance/optimization.md`](../../performance/optimization.md)
- Related Components:
  - [`app/vendor/dashboard/components/vendor-sales-chart.tsx`](../../../app/vendor/dashboard/components/vendor-sales-chart.tsx)
  - [`app/vendor/dashboard/payouts/page.tsx`](../../../app/vendor/dashboard/payouts/page.tsx)
  - [`hooks/use-vendor-data.ts`](../../../hooks/use-vendor-data.ts)

## Technical Implementation Details
### Session Security
- Signed vendor session cookie (`vendor_session`) generated with `HMAC-SHA256`.
- Requires `VENDOR_SESSION_SECRET`; missing secret blocks login with explicit error.
- Middleware + APIs derive vendor identity via `getVendorFromCookieStore`.
- Admin sign-ins set parallel `admin_session` cookies to guard admin portal access while clearing them for non-admin vendors.
- Explicit vendor overrides (e.g., Street Collector mapping) allow manual linkage before fallback vendor creation.

### Data Fetching Logic
- Supabase: `order_line_items_v2`, `product_vendor_payouts`, and `vendors` tables queried via service client.
- Shopify: GraphQL fallbacks (`fetchProductsByVendor`, `fetchVendorOrdersFromShopify`) supply product catalogs and historical orders when Supabase is empty.
- Aggregations performed server-side to maintain authoritative totals (sales, revenue, vendor share).

### Analytics Normalisation
- Daily stats aggregated for dashboard overview charts (last 30 days).
- Monthly analytics returned with `period` + `month` labels for analytics tab visualisations.
- `salesByProduct` includes payout metadata (`payoutType`, `payoutAmount`) for UI transparency.

## API Endpoints & Usage
| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/auth/google/start` | GET | Initiate Supabase Google OAuth and stash post-login redirect. | Public |
| `/auth/callback` | GET | Exchange Supabase code, link vendor, set `vendor_session`. | Supabase OAuth redirect |
| `/api/auth/status` | GET | Report Supabase session, admin flag, vendor context. | Signed Supabase session |
| `/api/auth/impersonate` | POST | Allow admins to assume a vendor session. | Admin Supabase session |
| `/api/vendor/logout` | POST | Sign out of Supabase and clear vendor cookies. | Supabase session |
| `/api/vendor/stats` | GET | Totals, recent activity, 30-day chart. | Signed vendor session |
| `/api/vendor/sales-analytics` | GET | Monthly analytics, product rollups, sales history. | Signed vendor session |
| `/api/vendors/products` | GET | Vendor products + payout settings with Shopify fallback. | Signed vendor session |

**Notes**
- All vendor endpoints require a valid signed `vendor_session` cookie (issued by `/auth/callback` or `/api/auth/impersonate`).
- Responses include a `currency` field to standardise client formatting (currently `GBP`).

## Database Schema Changes
- [`supabase/migrations/20251110160000_add_auth_id_to_vendors.sql`](../../../supabase/migrations/20251110160000_add_auth_id_to_vendors.sql) adds `auth_id UUID` with a partial unique index so each Supabase user maps to at most one vendor.
- Relies on existing:
  - `order_line_items_v2` for sales history.
  - `product_vendor_payouts` for vendor share configuration.
  - `vendors` for onboarding status and profile data.

## UI/UX Considerations
- Overview cards reflect server-computed totals and GBP formatting.
- Charts auto-adjust to signed data and share currency format with tooltips.
- Payouts table and analytics modals highlight vendor share instead of gross revenue.
- Login page offers Google OAuth entrypoint; admin impersonation controls now live inside the admin portal vendor switcher.
- Onboarding flow triggers automatically for newly created vendors with pending Supabase accounts.
- Admin users are redirected directly to the admin dashboard; vendor impersonation now lives in the admin portal vendor switcher modal.

## Testing Requirements
- Automated: `npm run test -- vendor-session vendor-auth`
- Manual smoke tests:
  1. Sign in with Google as an existing vendor; confirm dashboard metrics match Supabase rows.
  2. Complete onboarding for a new Google account and verify the vendor record is created with `auth_id`.
  3. Attempt to tamper with `vendor_session` cookie → expect redirect to `/vendor/login`.
  4. Validate analytics tab renders monthly bars/lines with GBP currency and payout percentages.
  5. Use admin account to impersonate a vendor and confirm subsequent requests honour the selected vendor.
  6. Logout clears Supabase session and removes all vendor cookies before redirecting.

## Deployment Considerations
- Add `VENDOR_SESSION_SECRET` to all environments (minimum 32 bytes recommended).
- Rotate secrets requires invalidating existing cookies (force re-login).
- Shopify API credentials must remain valid for fallback fetches.
- Supabase service role and Google client credentials (`SUPABASE_GOOGLE_CLIENT_ID/SECRET`) must be populated.
- Run `npm run supabase:enable-google` after updating redirect URLs to sync Supabase Auth configuration.

## Known Limitations
- Shopify fallback limited to 50 recent orders; consider pagination for high-volume vendors.
- Currency hard-coded to GBP; multi-currency vendors need future enhancements.
- Google OAuth is the only provider; future work may extend to additional IdPs.

## Future Improvements
- Add caching layer for expensive Shopify GraphQL calls.
- Introduce per-vendor currency support and localisation.
- Extend analytics to include refunds/chargebacks and payout schedules.
- Build E2E tests covering login/session flows.

## Version & Change Log
- **Version**: 1.4.0
- **Last Updated**: 2025-11-11
- **Change Log**:
  - 2025-11-11: Added email override linking for Street Collector, aligned admin redirect to portal, and documented shared admin sessions.
  - 2025-11-10: Migrated vendor auth to Supabase Google OAuth, added admin impersonation, and linked vendors to Supabase user IDs.

## Verification Checklist
- [x] Implementation file referenced
- [x] Test files linked
- [x] Performance tracking documented
- [x] Related components listed
- [x] Version information included
- [x] Change log updated


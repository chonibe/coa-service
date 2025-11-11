# Vendor Dashboard Hardening

## Feature Overview
- Harden vendor authentication to prevent session bleed across vendors.
- Align sales, analytics, and payout reporting with canonical `order_line_items_v2` data.
- Deliver consistent GBP-denominated insights across dashboard surfaces.

## Implementation Summary
- Implementation: [`app/vendor/dashboard/page.tsx`](../../../app/vendor/dashboard/page.tsx)
- Landing Selector: [`app/page.tsx`](../../../app/page.tsx)
- Login Experience: [`app/vendor/login/page.tsx`](../../../app/vendor/login/page.tsx)
- Admin Switcher: [`app/admin/components/vendor-switcher.tsx`](../../../app/admin/components/vendor-switcher.tsx)
- Core APIs:
  - [`app/api/auth/google/start/route.ts`](../../../app/api/auth/google/start/route.ts)
  - [`app/auth/callback/route.ts`](../../../app/auth/callback/route.ts)
  - [`app/api/auth/status/route.ts`](../../../app/api/auth/status/route.ts)
  - [`app/api/auth/impersonate/route.ts`](../../../app/api/auth/impersonate/route.ts)
  - [`app/api/vendor/stats/route.ts`](../../../app/api/vendor/stats/route.ts)
  - [`app/api/vendor/sales-analytics/route.ts`](../../../app/api/vendor/sales-analytics/route.ts)
  - [`app/api/vendors/products/route.ts`](../../../app/api/vendors/products/route.ts)
- Session Utility: [`lib/vendor-session.ts`](../../../lib/vendor-session.ts)
- Auth Helpers: [`lib/vendor-auth.ts`](../../../lib/vendor-auth.ts)
- Signup Experience: [`app/vendor/signup/page.tsx`](../../../app/vendor/signup/page.tsx)
- Admin Tools:
  - [`app/api/admin/vendors/pending/route.ts`](../../../app/api/admin/vendors/pending/route.ts)
  - [`app/api/admin/vendors/link-auth/route.ts`](../../../app/api/admin/vendors/link-auth/route.ts)
- Shared Auth Layout: [`components/vendor/AuthShell.tsx`](../../../components/vendor/AuthShell.tsx)
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
| `/api/vendor/signup` | POST | Create a new vendor profile or submit an invite claim. | Signed Supabase session |
| `/api/vendor/logout` | POST | Sign out of Supabase and clear vendor cookies. | Supabase session |
| `/api/vendor/stats` | GET | Totals, recent activity, 30-day chart. | Signed vendor session |
| `/api/vendor/sales-analytics` | GET | Monthly analytics, product rollups, sales history. | Signed vendor session |
| `/api/vendors/products` | GET | Vendor products + payout settings with Shopify fallback. | Signed vendor session |
| `/api/admin/vendors/pending` | GET | List vendor records waiting for approval/pairing. | Admin Supabase session |
| `/api/admin/vendors/link-auth` | POST | Pair a pending signup to a Google email/user. | Admin Supabase session |

**Notes**
- All vendor endpoints require a valid signed `vendor_session` cookie (issued by `/auth/callback` or `/api/auth/impersonate`).
- Responses include a `currency` field to standardise client formatting (currently `GBP`).

## Database Schema Changes
- [`supabase/migrations/20251110160000_add_auth_id_to_vendors.sql`](../../../supabase/migrations/20251110160000_add_auth_id_to_vendors.sql) adds `auth_id UUID` with a partial unique index so each Supabase user maps to at most one vendor.
- [`supabase/migrations/20251110180000_vendor_signup_fields.sql`](../../../supabase/migrations/20251110180000_vendor_signup_fields.sql) adds onboarding fields: `signup_status`, `auth_pending_email`, and `invite_code`.
- Relies on existing:
  - `order_line_items_v2` for sales history.
  - `product_vendor_payouts` for vendor share configuration.
  - `vendors` for onboarding status and profile data.

## UI/UX Considerations
- Overview cards reflect server-computed totals and GBP formatting.
- Charts auto-adjust to signed data and share currency format with tooltips.
- Payouts table and analytics modals highlight vendor share instead of gross revenue.
- Auth screens share a unified split-layout shell with branding via `AuthShell`.
- Landing portal offers explicit “Admin” vs “Vendor” entry points, both funnelling through Google SSO.
- Login page presents a single Google CTA with mode-aware messaging (admin vs vendor) and surfaces state-specific notices (`admin`, `pending`, `unlinked`, `forbidden`).
- `/vendor/signup` allows newly authenticated emails to:
  - Create a fresh vendor profile (linked immediately with `signup_status = approved`; onboarding completion promotes to `completed`).
  - Submit an invite code to claim an existing vendor; admins finish the pairing.
- Signup page distinguishes between pending approvals and unlinked emails, guiding users to the correct next action.
- Admin vendors page surfaces pending signups, pre-fills pending emails, and provides a one-click “Link email” workflow.
- Admin header now includes a vendor switcher enabling quick jumps into vendor dashboards via `/api/auth/impersonate`.
- When impersonating, admins see a banner with a one-click “Return to admin” action that calls `/api/auth/impersonate/exit`.

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
- **Version**: 1.8.0
- **Last Updated**: 2025-11-10
- **Change Log**:
  - 2025-11-10: Split `/admin/login` from vendor login, enforced state-based redirects (`pending`, `unlinked`), and added impersonation banner with exit control.
  - 2025-11-10: Added landing selector, mode-aware login messaging, auth state flags (`admin`, `pending`, `unlinked`), and guarded vendor switcher rendering.
  - 2025-11-10: Streamlined `/vendor/login` into a single Google CTA, defaulted admins to `/admin/dashboard`, added admin vendor switcher, and removed sidebar from auth routes.
  - 2025-11-10: Introduced `AuthShell`, refreshed `/vendor/login` and `/vendor/signup` UX with tabbed vendor/admin flow and sanitized redirects.
  - 2025-11-10: Added self-serve `/vendor/signup`, admin pending-signup management UI, and Supabase pairing endpoints.

## Verification Checklist
- [x] Implementation file referenced
- [x] Test files linked
- [x] Performance tracking documented
- [x] Related components listed
- [x] Version information included
- [x] Change log updated


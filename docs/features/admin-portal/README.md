# Admin Portal Access Control

## Feature Overview
- Harden administrator authentication with signed session cookies bound to approved Google accounts.
- **Primary**: Admin View Mode - Admins view and manage vendor data within the admin UI with clear audit trails.
- **Secondary**: Impersonation - Available for testing/support scenarios, clearly marked with confirmation dialogs.
- Guard all `/admin` UI surfaces and associated APIs against unauthorized access.

## Implementation Summary
- Implementation: [`app/admin/layout.tsx`](../../../app/admin/layout.tsx), [`app/admin/admin-shell.tsx`](../../../app/admin/admin-shell.tsx)
- Vendor Explorer & Toggle: [`app/admin/admin-shell.tsx`](../../../app/admin/admin-shell.tsx)
- Admin Session Utilities: [`lib/admin-session.ts`](../../../lib/admin-session.ts)
- OAuth Callback Logic: [`app/auth/callback/route.ts`](../../../app/auth/callback/route.ts)
- Admin Login Endpoint: [`app/api/admin/login/route.ts`](../../../app/api/admin/login/route.ts)
- Guarded Admin APIs:
  - [`app/api/admin/orders/route.ts`](../../../app/api/admin/orders/route.ts)
  - [`app/api/admin/orders/[orderId]/route.ts`](../../../app/api/admin/orders/%5BorderId%5D/route.ts)
  - [`app/api/get-all-products/route.ts`](../../../app/api/get-all-products/route.ts)
  - [`app/api/admin/backup/*`](../../../app/api/admin/backup)
  - [`app/api/admin/run-cron/route.ts`](../../../app/api/admin/run-cron/route.ts)
  - [`app/api/vendors/names/route.ts`](../../../app/api/vendors/names/route.ts)
  - [`app/api/admin/vendors/list/route.ts`](../../../app/api/admin/vendors/list/route.ts)
- Impersonation Audit Trail: [`supabase/migrations/20251112093000_impersonation_logs.sql`](../../../supabase/migrations/20251112093000_impersonation_logs.sql), [`app/api/auth/impersonate/route.ts`](../../../app/api/auth/impersonate/route.ts)
- Impersonation Exit Endpoint: [`app/api/auth/impersonate/end/route.ts`](../../../app/api/auth/impersonate/end/route.ts)
- Failed Login Logging: [`supabase/migrations/20251112094500_failed_login_attempts.sql`](../../../supabase/migrations/20251112094500_failed_login_attempts.sql), [`lib/audit-logger.ts`](../../../lib/audit-logger.ts)
- Audit API: [`app/api/admin/audit/logins/route.ts`](../../../app/api/admin/audit/logins/route.ts)
- Tests: [`tests/vendor-auth.test.ts`](../../../tests/vendor-auth.test.ts)
- Performance Tracking: [`docs/performance/optimization.md`](../../performance/optimization.md)

## Technical Implementation Details
### Session Security
- `ADMIN_SESSION_SECRET` powers HMAC-signed `admin_session` cookies created via `buildAdminSessionCookie`.
- `verifyAdminSessionToken` validates cookies for all admin layouts and API routes.
- Supabase Google OAuth callback sets admin cookies for whitelisted emails and clears them for non-admin vendors.
- Vendor overrides (e.g., `kinggeorgelamp@gmail.com → street-collector`) are applied before fallbacks during Supabase linkage.

### Data Fetching & Integrations
- Supabase: Admin APIs continue to use the service role client for orders, backups, and vendor metadata.
- Shopify: Product synchronization endpoint (`/api/get-all-products`) now requires valid admin sessions before proxying to Shopify REST API.

### UI Architecture
- Server-side admin layout (`app/admin/layout.tsx`) enforces authentication, then renders the client `AdminShell`.
- Header toggle switches between core admin view and the full vendor explorer table.
- **Vendor Explorer**: Lists status, last login, contact email (with inline edit). Primary action is "View Details" (opens admin vendor detail page). Secondary action is "View as Vendor" (impersonation for testing).
- **Admin Vendor Detail Page** (`/admin/vendors/[vendorId]`): Comprehensive vendor view with dashboard stats, orders, and settings - all within admin UI.
- **Impersonation**: Requires confirmation dialog explaining it's for testing/support. Actions logged to `impersonation_logs` and `admin_actions` tables.
- Vendor layout surfaces an impersonation banner showing admin email and vendor name, with "Switch to Admin View" button.
- All admin actions on vendor data are logged to `admin_actions` table with action type and details.
- Failed password/OAuth attempts are recorded in `failed_login_attempts`; admins can review them through `/api/admin/audit/logins`.
- Logout clears both `admin_session` and `vendor_session` cookies to prevent leaked context.

## API Endpoints & Usage
| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/admin/login` | POST | Validates Supabase session, provisions `admin_session` cookie. | Whitelisted Supabase Google session |
| `/auth/callback` | GET | Adds admin and vendor cookies post-OAuth. | Supabase OAuth redirect |
| `/api/get-all-products` | GET | Shopify product listing restricted to admins. | Signed `admin_session` |
| `/api/admin/orders` | GET | Orders overview (Supabase). | Signed `admin_session` |
| `/api/admin/orders/[orderId]` | GET | Order detail with line items. | Signed `admin_session` |
| `/api/admin/backup/*` | GET/POST/DELETE | Backup settings & triggers. | Signed `admin_session` |
| `/api/admin/run-cron` | GET | Direct cron execution for admins. | Signed `admin_session` + `CRON_SECRET` |
| `/api/admin/vendors/list` | GET | Vendor directory for admin explorer. | Signed `admin_session` |
| `/api/admin/vendors/[vendorId]/dashboard` | GET | Vendor dashboard stats/analytics (admin view). | Signed `admin_session` |
| `/api/admin/vendors/[vendorId]/orders` | GET | Vendor orders (admin view). | Signed `admin_session` |
| `/api/admin/vendors/[vendorId]/settings` | GET/PATCH | Vendor settings (admin view/update). | Signed `admin_session` |
| `/api/admin/vendors/update-email` | POST | Update vendor contact email (logs admin action). | Signed `admin_session` |
| `/api/auth/impersonate` | POST | Impersonate vendor context (for testing/support). | Signed `admin_session` + Supabase admin session |
| `/api/auth/impersonate/end` | POST | Exit impersonation and return to admin dashboard. | Signed `admin_session` |

## Database Schema Changes
- **New Table**: `admin_actions` - Logs all admin actions on vendor data with action type, vendor ID, and details.
- **Existing Tables**: `vendors`, `orders`, `backup_settings`, `backups`, `impersonation_logs`, `failed_login_attempts` are reused with stricter guards.

## UI/UX Considerations
- Vendor switcher exposed as side-menu entry and header action inside admin portal.
- Dialog-based vendor selection includes search, loading states, and impersonation feedback via toast.
- Admin login page now directs users to Google sign-in; password prompt removed.
- Unauthorized users hitting admin routes are redirected to `/admin/login`.

## Testing Requirements
- Automated: `npm run test -- vendor-auth` verifies admin overrides and redirect sanitization.
- Manual smoke tests:
  1. Attempt to open `/admin` without cookies → expect redirect to `/admin/login`.
  2. Sign in as whitelisted admin via Google → confirm redirect to `/admin/dashboard` and vendor switcher availability.
  3. Use vendor switcher to impersonate "Street Collector" → expect toast confirmation and vendor dashboard load.
  4. Sign in as non-admin vendor → confirm direct access to vendor dashboard, no admin UI exposure.
  5. Hit `/api/get-all-products` without admin cookie → expect `401 Unauthorized`.
  6. Logout from admin portal → ensure both admin and vendor sessions are cleared.

## Deployment Considerations
- Set `ADMIN_SESSION_SECRET` (32+ random bytes) in all environments before rollout.
- Confirm Supabase Google OAuth redirect whitelist includes `/auth/callback`.
- Ensure Vercel/hosting environment redeploys so middleware and layout changes apply.
- Optional: rotate legacy manual admin sessions to enforce new cookie format.

## Known Limitations
- Admin session TTL defaults to 1 hour; renewal requires re-authentication.
- Vendor override table is currently hard-coded; future iterations may move to database configuration.
- Vendor switcher fetches full vendor list; long lists may need pagination.

## Future Improvements
- Add admin session refresh endpoint to extend active sessions without full OAuth loop.
- Persist recent vendor impersonations for quicker access.
- Surface current impersonated vendor context within admin UI.
- Migrate vendor override mapping to Supabase configuration table with UI management.

## Version & Change Log
- **Version**: 2.0.0
- **Last Updated**: 2025-11-17
- **Change Log**:
  - 2025-11-17: **Major Refactor** - Switched from impersonation-first to admin-view-first approach.
    - Added `/admin/vendors/[vendorId]` page for comprehensive vendor management within admin UI.
    - Created admin vendor data APIs (`/api/admin/vendors/[vendorId]/*`) for dashboard, orders, and settings.
    - Updated Vendor Explorer: "View Details" (primary) and "View as Vendor" (secondary, with confirmation).
    - Added `admin_actions` table and `logAdminAction()` function for comprehensive audit trails.
    - Enhanced impersonation banner with admin email display and "Switch to Admin View" button.
    - All admin actions on vendor data now logged with clear attribution.
  - 2025-11-11: Introduced HMAC admin sessions, secured admin APIs, and embedded vendor switcher modal.
  - 2025-11-11: Added global middleware guard for admin routes.
  - 2025-11-11: Added vendor explorer toggle, admin-side vendor directory API, and impersonation auditing via Supabase logs.
  - 2025-11-11: Added impersonation banner in vendor layout and `/api/auth/impersonate/end` endpoint for exiting vendor context.
  - 2025-11-11: Logged failed login attempts, exposed audit endpoints, and documented `failed_login_attempts` table.

## Verification Checklist
- [x] Implementation files referenced
- [x] Test files linked
- [x] Performance tracking documented
- [x] Related components listed
- [x] Version information included
- [x] Change log updated


# Vendor Login Funnel

## Feature Overview & Purpose
- Provide a single entry point that routes admins and vendors to their respective dashboards based on Supabase-authenticated email.
- Enforce vendor-only access via signed `vendor_session` cookies while blocking unregistered accounts.
- Allow admins to retain direct admin access and impersonate vendors without split login screens.

## Technical Implementation Details
- Implementation:
  - [`app/login/page.tsx`](../../../app/login/page.tsx)
  - [`app/login/login-client.tsx`](../../../app/login/login-client.tsx)
  - [`app/api/auth/email-login/route.ts`](../../../app/api/auth/email-login/route.ts)
  - [`app/api/auth/google/start/route.ts`](../../../app/api/auth/google/start/route.ts)
  - [`app/auth/callback/route.ts`](../../../app/auth/callback/route.ts)
- Session Utilities & Overrides:
  - [`lib/vendor-auth.ts`](../../../lib/vendor-auth.ts)
  - [`lib/vendor-session.ts`](../../../lib/vendor-session.ts)
  - [`lib/admin-session.ts`](../../../lib/admin-session.ts)
- Tests: [`tests/vendor-auth.test.ts`](../../../tests/vendor-auth.test.ts)
- Performance Tracking: [`docs/performance/optimization.md`](../../performance/optimization.md)
- Related Components:
  - [`app/admin/admin-shell.tsx`](../../../app/admin/admin-shell.tsx)
  - [`hooks/use-vendor-data.ts`](../../../hooks/use-vendor-data.ts)

### Flow Summary
1. Users initiate Google OAuth (`/api/auth/google/start`) or email/password login (`/api/auth/email-login`).
2. OAuth callback exchanges the Supabase code, links the user to a vendor via `vendor_users`, issues `vendor_session` (and optionally `admin_session`) cookies, and redirects to the appropriate dashboard.
3. Email/password login leverages Supabase password auth, applies the same vendor linking, and responds with a redirect target consumed by the login client.
4. Vendor identity in protected routes derives from `vendor_session`; admins retain impersonation via `/api/auth/impersonate` while keeping their own admin session.

### Role Resolution & Linking
- Admin whitelist: `['choni@thestreetlamp.com', 'chonibe@gmail.com']` → admin session only, no vendor linkage.
- Vendor overrides: `kinggeorgelamp@gmail.com` binds to “Street Collector” vendor, synchronising `vendor_users` and `vendors.contact_email`.
- Vendor lookup order: `vendor_users.auth_id` → `vendor_users.email` → `vendors.contact_email` → email override mapping.
- Automatically marks vendors `active` and stamps `onboarded_at`/`last_login_at` when linkage succeeds.
- `allowCreate` flag prevents accidental vendor creation during login; onboarding flows handle manual creation explicitly.

## API Endpoints & Usage
| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/auth/google/start` | GET | Begin Google OAuth and save post-login redirect. | Public |
| `/auth/callback` | GET | Exchange Supabase code, link vendor, set cookies, redirect. | Supabase OAuth redirect |
| `/api/auth/email-login` | POST | Authenticate email/password users, link vendor/admin, return redirect JSON. | Public |
| `/api/auth/status` | GET | Report Supabase session, admin flag, and vendor linkage. | Supabase session |
| `/api/vendor/logout` | POST | Clear Supabase session, `vendor_session`, and `admin_session`. | Signed vendor/admin session |

## Database Schema Changes
- [`supabase/migrations/20251111120000_marketplace_roles.sql`](../../../supabase/migrations/20251111120000_marketplace_roles.sql)
  - Adds `vendor_status` enum and status timestamps to `vendors`.
  - Introduces `vendor_users` mapping table and `admin_accounts` registry.
  - Seeds admin emails and Street Collector override entry.

## UI/UX Considerations
- Single login card presents Google and email/password options with clear messaging.
- Automatic redirects suppress the former “choose vendor/admin” portal; admins land in `/admin/dashboard`.
- Error states: non-registered users receive `support@thestreetlamp.com` contact guidance; loading spinners communicate OAuth progress.
- Admin portal contains vendor switcher dialog instead of separate login tab.
- Login card now includes explanatory copy, Google/email sections, and explicit help links for pending vendors.
- Added dedicated “Request Access” button linking to pre-filled support email with onboarding prompts.
- Global middleware (`middleware.ts`) now enforces vendor session checks for all `/vendor` routes, replacing legacy per-folder middleware.
- Introduced `ImpersonationBanner` in vendor layout so admins see an active impersonation warning with quick exit controls.
- Added dedicated `/vendor/access-pending` and `/vendor/access-denied` pages for status-based redirects.
- Failed login attempts (email + OAuth) are now tracked in Supabase for support review.
- Admins can manually assign vendor emails via the vendor explorer to wire up authentication overrides.

## Data Fetching Logic
- Supabase: `vendor_users`, `vendors`, and `admin_accounts` accessed via service-role client during login resolution.
- Supabase Auth REST: email/password login and OAuth code exchange.
- Shopify is **not** queried during login; vendor dashboards fetch Shopify data post-authentication.

## Testing Requirements
### Automated
- `npm run test -- vendor-auth`
  - Verifies admin override, Street Collector mapping, contact email linkage, and vendor status activation logic.

### Manual QA Checklist
1. **Admin OAuth**: Sign in with `chonibe@gmail.com` via Google → expect redirect to `/admin/dashboard`, `vendor_session` cleared, `admin_session` present.
2. **Vendor OAuth**: Sign in with `kinggeorgelamp@gmail.com` via Google → expect redirect to `/vendor/dashboard`, `vendor_session` holds “Street Collector”.
3. **Email/Password Vendor**: Use valid vendor credentials → observe JSON redirect to `/vendor/dashboard` and cookie issuance.
4. **Unregistered Email**: Attempt login with unknown email → receive destructive alert on `/login` referencing support address; cookies cleared.
5. **Need Access CTA**: On login screen, click “Request Access” → opens mail client with prefilled onboarding template.
6. **Vendor status gating**: Mark a vendor as `pending` or `disabled` in Supabase, sign in, and confirm redirects to `/vendor/access-pending` or `/vendor/access-denied` respectively.
7. **Legacy routes**: Visiting `/admin/login` or `/vendor/login` redirects to `/login` funnel.
8. **Impersonation loop**: Admin toggles vendors via switcher; `vendor_session` changes; logout clears both cookies.
9. **Protected admin API**: `GET /api/get-all-products` with no admin cookie returns 401.
10. **Audit trail**: After impersonation, verify a row exists in `impersonation_logs` with the admin email and selected vendor.
11. **Impersonation banner**: While impersonating, confirm banner appears on vendor dashboard and “Exit Impersonation” returns to admin without logging out.

## Deployment Considerations
- Configure environment variables: `SUPABASE_GOOGLE_CLIENT_ID`, `SUPABASE_GOOGLE_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `VENDOR_SESSION_SECRET`, `ADMIN_SESSION_SECRET`.
- Ensure Supabase permitted redirect URLs include `/auth/callback` for each environment (local, staging, production).
- Run pending Supabase migrations before deploying (`supabase db push` or CI workflow) to provide `vendor_users` table.
- Rotating session secrets invalidates existing cookies; communicate downtime to vendors/admins.

## Known Limitations
- Email/password login depends on Supabase-managed credentials; there is no self-serve vendor signup.
- Vendor overrides currently require code changes; future work should expose admin UI for manual mapping.
- Login page does not yet surface pending/denied vendor status messaging beyond blocking access.

## Future Improvements
- Add “Request Access” workflow for unregistered vendors, writing to CRM/Support queue.
- Expand login analytics/telemetry to capture success/failure rates and impersonation events.
- Support passwordless email magic links via Supabase to reduce credential friction.
- Surface vendor status (pending/disabled) messaging directly on the login screen.

## Version & Change Log
- **Version**: 1.1.0
- **Last Updated**: 2025-11-11
- **Change Log**:
  - 2025-11-11: Documented enhanced login UI, access request CTA, status-based redirects, centralized vendor middleware enforcement, vendor impersonation banner, and dedicated pending/denied pages.

## Verification Checklist
- [x] Implementation file referenced
- [x] Test files linked
- [x] Performance tracking documented
- [x] Related components listed
- [x] Version information included
- [x] Change log updated

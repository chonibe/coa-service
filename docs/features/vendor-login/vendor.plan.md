# Vendor & Admin Login Flow

## 🌐 Landing Funnel
### Inputs
- Routes: `app/page.tsx` (root), `app/login/page.tsx`
- Legacy entries: `/admin/login`, `/vendor/login` → redirect handlers
- Session status API: `/api/auth/status`

### Process
1. Root server component wraps `LoginClient` in `Suspense`.
2. Client performs session probe via `/api/auth/status` to fast-path already signed-in users (admin → `/admin/dashboard`, vendor → `/vendor/dashboard`).
3. Presents single card with CTA buttons:
   - **Continue with Google** → `/api/auth/google/start`
   - **Email/password form** → POST `/api/auth/email-login`
4. Accepts optional `redirect` query param which seeds `vendor_post_login_redirect` cookie (relative path enforced by `sanitizeRedirectTarget`).

### Outputs
- Unified entry with dual auth methods, eliminating prior admin/vendor tab UI.
- Redirect loop prevention thanks to session pre-check.
- Legacy URLs reuse same funnel via `redirect("/login")` route handlers.

## 🔑 OAuth Initiation
### Inputs
- Endpoint: `app/api/auth/google/start/route.ts`
- Cookies: `vendor_post_login_redirect` (optional)
- Supabase config: Google provider enabled, redirect whitelisted to `/auth/callback`

### Process
1. Accepts optional `redirect` query string; sanitises and stores in cookie (1 minute max-age).
2. Calls Supabase Auth API to generate Google OAuth URL.
3. Returns 302 redirect to Supabase consent screen; failure returns 500 JSON.

### Outputs
- User lands on Google consent with state managed by Supabase.
- Post-login redirect target preserved securely via HTTP-only cookie.

## 🔁 Callback Processing
### Inputs
- Route: `app/auth/callback/route.ts`
- Query: `code` (Supabase authorisation code)
- Cookies: `vendor_post_login_redirect`, `vendor_session`, `admin_session`
- Helpers: `linkSupabaseUserToVendor`, `buildVendorSessionCookie`, `buildAdminSessionCookie`

### Process
1. Exchange code for Supabase session; on failure clear auth cookies and redirect back to `/login?error=oauth_exchange_failed`.
2. Resolve actor:
   - Admin whitelist (`isAdminEmail`)
   - Vendor override mapping (e.g. Street Collector)
   - Existing `vendor_users` record (auth_id → email → contact_email)
3. Cookie behaviour:
   - Admins: set `admin_session`, clear `vendor_session` unless impersonating vendor.
   - Vendors: set `vendor_session` (`vendor_name` payload) and mark status `active`.
   - Unregistered email: sign out, clear cookies, redirect to `/login?error=not_registered`.
4. Redirect order of precedence: `vendor_post_login_redirect` → role-based fallback (`/admin/dashboard` or `/vendor/dashboard`).
5. Pending vendors are blocked (no auto-creation) unless `allowCreate` flag is explicitly set elsewhere (onboarding flow).

### Outputs
- Authenticated users materialise with appropriate session cookies.
- Admins retain portal control; vendors receive impersonation-ready sessions.
- Support messaging shown to unknown emails.

## 🧭 Admin Impersonation & Context Switching
### Inputs
- UI: `app/admin/admin-shell.tsx` (vendor switcher button + dialog)
- APIs: `GET /api/vendors/names`, `POST /api/auth/impersonate`
- Cookies: `admin_session` (required), `vendor_session`

### Process
1. Admin shell loads vendor list lazily when switcher opens (debounced search, loading states).
2. Selecting a vendor posts to `/api/auth/impersonate` with vendor ID or name.
3. API validates `admin_session` (HMAC) + Supabase admin session, then issues new `vendor_session` cookie.
4. Client shows toast feedback and redirects to `/vendor/dashboard` in impersonated context.

### Outputs
- Impersonation provides full vendor experience without logging admin out.
- `vendor_session` overwrites previous vendor, enabling seamless toggling.
- Audit trail planned for future (currently TODO in admin epic).

## 🚪 Logout Paths
### Inputs
- Vendor: `POST /api/vendor/logout`
- Admin: `POST /api/admin/logout`
- Cookies: `vendor_session`, `admin_session`, `vendor_post_login_redirect`, `pending_vendor_email`

### Process
- **Vendor logout**: Signs out Supabase session, clears both admin and vendor cookies to avoid stale impersonation.
- **Admin logout**: Clears admin session and any impersonated vendor cookie; client redirects to `/login`.

### Outputs
- Clean termination of sessions to prevent cross-role leakage.
- Ensures next login requires full Supabase authentication.

## 📚 Implementation References
- Funnel landing UI: [`app/page.tsx`](../../../app/page.tsx)
- Login client: [`app/login/page.tsx`](../../../app/login/page.tsx), [`app/login/login-client.tsx`](../../../app/login/login-client.tsx)
- Legacy redirects: [`app/admin/login/route.ts`](../../../app/admin/login/route.ts), [`app/vendor/login/route.ts`](../../../app/vendor/login/route.ts)
- Email sign-in API: [`app/api/auth/email-login/route.ts`](../../../app/api/auth/email-login/route.ts)
- OAuth bootstrap: [`app/api/auth/google/start/route.ts`](../../../app/api/auth/google/start/route.ts)
- OAuth callback: [`app/auth/callback/route.ts`](../../../app/auth/callback/route.ts)
- Session helpers: [`lib/vendor-auth.ts`](../../../lib/vendor-auth.ts), [`lib/vendor-session.ts`](../../../lib/vendor-session.ts), [`lib/admin-session.ts`](../../../lib/admin-session.ts)
- Admin shell & switcher: [`app/admin/admin-shell.tsx`](../../../app/admin/admin-shell.tsx)
- Status endpoint: [`app/api/auth/status/route.ts`](../../../app/api/auth/status/route.ts)
- Impersonation API: [`app/api/auth/impersonate/route.ts`](../../../app/api/auth/impersonate/route.ts)
- Logout handlers: [`app/api/vendor/logout/route.ts`](../../../app/api/vendor/logout/route.ts), [`app/api/admin/logout/route.ts`](../../../app/api/admin/logout/route.ts)
- Performance guidance: [`docs/performance/optimization.md`](../../performance/optimization.md)

## ✅ Acceptance Criteria & QA Checklist
1. **Admin OAuth happy path**: Google sign-in with `chonibe@gmail.com` → redirected to `/admin/dashboard`, `admin_session` set, `vendor_session` cleared.
2. **Vendor OAuth (Street Collector)**: Google sign-in with `kinggeorgelamp@gmail.com` → redirected to `/vendor/dashboard`, `vendor_session` payload `Street Collector`.
3. **Email/password admin**: POST `/api/auth/email-login` (valid admin creds) → JSON `{ redirect: "/admin/dashboard" }`, cookies set accordingly.
4. **Email/password vendor**: Same call with valid vendor creds → `{ redirect: "/vendor/dashboard" }`, vendor cookie issued.
5. **Unregistered email**: Either auth path returns error message, clears cookies, prompts contact support.
6. **Legacy routes**: Visiting `/admin/login` or `/vendor/login` redirects to `/login` funnel.
7. **Impersonation loop**: Admin toggles vendors via switcher; `vendor_session` changes; logout clears both cookies.
8. **Protected admin API**: `GET /api/get-all-products` with no admin cookie returns 401.

## 🔭 Known Gaps & Future Enhancements
- Pending/disabled vendor messaging on login still basic; UI banner recommended.
- Session refresh for admins currently requires full OAuth cycle.
- Vendor list unpaginated; performance considerations for large datasets.
- Automated E2E coverage for impersonation and login planned.

## 🧾 Version & Change Log
- **Version**: 1.3.0
- **Last Updated**: 2025-11-11
- **Change Log**:
  - 2025-11-11: Restructured plan into funnel → OAuth → callback → impersonation → logout sections; expanded acceptance criteria and technical detail.
  - 2025-11-11: Added email/password login option, blocked unregistered vendors with support messaging, redirected legacy login URLs to funnel entry.
  - 2025-11-11: Initial consolidation of vendor/admin login flow documentation post Supabase + admin session rollout.

## Verification Checklist
- [x] Implementation files referenced
- [x] Test files linked
- [x] Performance tracking documented
- [x] Related components listed
- [x] Version information included
- [x] Change log updated


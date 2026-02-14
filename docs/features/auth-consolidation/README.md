# Auth Consolidation (Track A)

## Feature Overview

Auth Consolidation unifies the fragmented session management system into a single, role-based access control (RBAC) approach. Previously, three independent HMAC-signed cookie systems (`vendor_session`, `collector_session`, `admin_session`) handled authentication. This feature introduces a unified session utility that resolves user identity from either the Supabase JWT (RBAC) or legacy cookies, with a feature flag for safe rollout.

**Version:** 1.0.0  
**Last Updated:** 2026-02-14  
**Status:** Implemented (behind feature flag)

## Technical Implementation

### Stream A1 — Unified Session Utility

**File:** [`lib/auth/unified-session.ts`](../../../lib/auth/unified-session.ts)

The core of auth consolidation. A single `getUnifiedSession()` function that:

1. **Primary path:** Tries Supabase JWT session via `getUserContext()` from RBAC
2. **Fallback path:** Falls back to legacy HMAC cookies if no JWT session exists
3. **Returns:** Normalized `UnifiedSession` shape with roles, permissions, vendor/collector IDs
4. **Feature flagged:** `UNIFIED_AUTH_ENABLED` env var controls layout behavior

```typescript
interface UnifiedSession {
  userId: string | null
  email: string
  roles: Role[]
  activeRole: Role | null
  vendorName?: string
  vendorId?: number
  collectorId?: string
  permissions: Permission[]
  source: 'rbac' | 'legacy'
}
```

**Helpers exported:**
- `isUnifiedAuthEnabled()` — checks `UNIFIED_AUTH_ENABLED` env var
- `sessionHasRole(session, role)` — role check on UnifiedSession
- `sessionHasAnyRole(session, roles)` — multi-role check
- `requireSessionRole(session, role)` — throws if role missing

### Stream A2 — Layout Guard Migration

**Modified files:**
- [`app/vendor/layout.tsx`](../../../app/vendor/layout.tsx) — Vendor layout
- [`app/collector/layout.tsx`](../../../app/collector/layout.tsx) — Collector layout
- [`app/admin/layout.tsx`](../../../app/admin/layout.tsx) — Admin layout

Each layout now has two paths:
1. **Unified Auth Path** (`UNIFIED_AUTH_ENABLED=true`): Uses `getUnifiedSession()` + role checks
2. **Legacy Path** (default): Original cookie-based authentication unchanged

All vendor status checks (pending/disabled/suspended) remain unchanged in both paths.

### Stream A3 — Auth Callback + Role Switcher

**Modified:** [`app/auth/callback/route.ts`](../../../app/auth/callback/route.ts)

Changes to `processUserLogin()`:
- Sets `active_role` cookie (lightweight, non-auth, client-readable) based on target dashboard
- Syncs all known roles to `user_roles` table on every login (idempotent upsert)
- Sets `active_role` for new collector signups too
- Legacy cookies still set during transition period

**New API:** [`app/api/auth/roles/route.ts`](../../../app/api/auth/roles/route.ts)

- `GET /api/auth/roles` — Returns current user's roles, active role, and role details
- Used by `RoleSwitcher` component

**New Component:** [`components/RoleSwitcher.tsx`](../../../components/RoleSwitcher.tsx)

- Client component, two variants: `compact` (sidebar) and `full` (header)
- Fetches roles from `/api/auth/roles`
- Only renders when user has 2+ roles
- Sets `active_role` cookie on selection and redirects to appropriate dashboard

**Mounted in:**
- [`app/vendor/components/vendor-sidebar.tsx`](../../../app/vendor/components/vendor-sidebar.tsx) — compact variant, sidebar bottom
- [`app/admin/admin-shell.tsx`](../../../app/admin/admin-shell.tsx) — full variant, header
- [`app/collector/components/role-switcher-wrapper.tsx`](../../../app/collector/components/role-switcher-wrapper.tsx) — full variant, fixed top-right

## API Endpoints

### GET /api/auth/roles

Returns the current user's available roles from the RBAC system.

**Authentication:** Requires valid Supabase session

**Response:**
```json
{
  "roles": ["vendor", "collector"],
  "activeRole": "vendor",
  "email": "user@example.com",
  "roleDetails": [
    {
      "role": "vendor",
      "label": "Vendor",
      "dashboard": "/vendor/dashboard",
      "isActive": true
    },
    {
      "role": "collector",
      "label": "Collector",
      "dashboard": "/collector/dashboard",
      "isActive": false
    }
  ]
}
```

## Database Schema

No new tables. Uses existing:
- `user_roles` — RBAC role assignments (user_id, role, is_active, metadata)
- Supabase JWT claims (app_metadata.user_roles, app_metadata.vendor_id)

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UNIFIED_AUTH_ENABLED` | No | `false` | Enable unified session in layouts. Set to `true` or `1` to activate. |

### Feature Flag Rollout

1. **Phase 1 (current):** Flag off. All layouts use legacy cookies. Unified session utility exists but only consumed by flag-on path.
2. **Phase 2:** Set `UNIFIED_AUTH_ENABLED=true` in staging, test both paths.
3. **Phase 3:** Enable in production. Monitor for issues.
4. **Phase 4 (Stream A4, 30+ days):** Remove legacy fallback, delete old session modules, remove feature flag.

## Risk Mitigation

- **Zero risk on deploy:** Feature flag defaults to off. Legacy behavior unchanged.
- **Rollback:** Flip `UNIFIED_AUTH_ENABLED` back to false.
- **Legacy cookies continue working:** The unified session falls back to legacy cookies even when the flag is on.
- **No breaking changes:** All existing API routes still consume legacy session modules directly.

## Testing Requirements

- [ ] Verify vendor login with flag OFF works as before
- [ ] Verify collector login with flag OFF works as before
- [ ] Verify admin login with flag OFF works as before
- [ ] Set `UNIFIED_AUTH_ENABLED=true` and verify vendor layout access
- [ ] Set `UNIFIED_AUTH_ENABLED=true` and verify collector layout access
- [ ] Set `UNIFIED_AUTH_ENABLED=true` and verify admin layout access
- [ ] Verify `active_role` cookie is set after OAuth callback
- [ ] Verify RoleSwitcher appears for multi-role users
- [ ] Verify RoleSwitcher hides for single-role users
- [ ] Verify role switching redirects to correct dashboard
- [ ] Verify `/api/auth/roles` returns correct role data

## Known Limitations

- Legacy session modules (`lib/vendor-session.ts`, `lib/collector-session.ts`, `lib/admin-session.ts`) still exist and are used by many API routes
- The RoleSwitcher depends on the `/api/auth/roles` endpoint which requires a Supabase session
- Vendor name resolution still relies on the `vendor_session` cookie for vendor DB lookups

## Future Improvements (Stream A4)

Scheduled 30+ days after A3 goes live:
- Delete `lib/vendor-session.ts`, `lib/collector-session.ts`, `lib/admin-session.ts`
- Remove fallback paths in `lib/auth/unified-session.ts`
- Remove legacy cookie writes in `app/auth/callback/route.ts`
- Switch all API routes to RBAC middleware
- Remove `UNIFIED_AUTH_ENABLED` feature flag

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-14 | 1.0.0 | Initial implementation: A1 (unified session), A2 (layout guards), A3 (callback + role switcher) |

# Deprecated Authentication Libraries

**⚠️ These libraries are deprecated and will be removed in a future release.**

The RBAC v2 system has been implemented. Please migrate to the new unified authentication system.

## Deprecated Files

### Session Management (Replaced by lib/rbac/session.ts)

- `lib/admin-session.ts` ❌
- `lib/vendor-session.ts` ❌
- `lib/collector-session.ts` ❌

**Migration:** Use Supabase JWT sessions with role claims instead of custom cookies.

```typescript
// OLD
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-session"
const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
const payload = verifyAdminSessionToken(adminToken)

// NEW
import { getUserContext } from "@/lib/rbac"
import { createClient } from "@/lib/supabase-server"
const user = await getUserContext(supabase)
```

### Auth Guards (Replaced by lib/rbac/middleware.ts)

- `lib/auth-guards.ts` ❌
  - `guardAdminRequest()` ❌
  - `guardVendorRequest()` ❌

**Migration:** Use the new middleware functions.

```typescript
// OLD
import { guardAdminRequest } from "@/lib/auth-guards"
export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") return auth.response
  // ...
}

// NEW
import { withAdmin } from "@/lib/rbac/middleware"
export const GET = withAdmin(async (request, { user }) => {
  // user context automatically available
})
```

### Vendor Auth (Partially Deprecated)

- `lib/vendor-auth.ts`
  - `ADMIN_EMAILS` constant ❌ (replaced by database-driven roles)
  - `isAdminEmail()` function ❌ (replaced by role checks)

**Migration:** Admin status is now determined by the `user_roles` table, not hardcoded emails.

```typescript
// OLD
import { isAdminEmail } from "@/lib/vendor-auth"
if (isAdminEmail(user.email)) {
  // admin logic
}

// NEW
import { hasRole } from "@/lib/rbac"
if (hasRole(user, 'admin')) {
  // admin logic
}
```

### OAuth Callbacks (Consolidated)

- `app/auth/collector/callback/route.ts` ❌ (merged into main callback)
- `app/auth/admin/callback/route.ts` ❌ (merged into main callback)
- `app/api/auth/shopify/google/callback/route.ts` ❌ (merged into main callback)

**Migration:** All OAuth flows now use `/app/auth/callback/route-new.ts`

## Migration Timeline

| Phase | Status | Target Date |
|-------|--------|-------------|
| Phase 1: New system available | ✅ Complete | 2026-01-26 |
| Phase 2: Update API routes | 🔄 In Progress | 2026-02-01 |
| Phase 3: Update layouts/components | ⏳ Pending | 2026-02-07 |
| Phase 4: Deprecation warnings | ⏳ Pending | 2026-02-14 |
| Phase 5: Remove old code | ⏳ Pending | 2026-03-01 |

## How to Migrate

See the comprehensive migration guide:
- [docs/RBAC_MIGRATION_GUIDE.md](../docs/RBAC_MIGRATION_GUIDE.md)

## Quick Reference

### Role Checks

```typescript
// Import
import { getUserContext, hasRole, requireRole } from "@/lib/rbac"

// Check roles
if (hasRole(user, 'admin')) { }
if (hasAnyRole(user, ['admin', 'vendor'])) { }

// Require roles (throws if missing)
requireRole(user, 'admin')
requireAnyRole(user, ['vendor', 'admin'])
```

### Permission Checks

```typescript
// Import
import { hasPermission, requirePermission } from "@/lib/rbac"

// Check permissions
if (hasPermission(user, 'products:edit')) { }
if (hasAnyPermission(user, ['products:edit', 'products:delete'])) { }

// Require permissions (throws if missing)
requirePermission(user, 'products:edit')
```

### Middleware

```typescript
// Import
import { withAuth, withAdmin, withVendor, withCollector } from "@/lib/rbac/middleware"

// Admin-only
export const GET = withAdmin(async (request, { user }) => {
  // handler
})

// Vendor-only
export const GET = withVendor(async (request, { user }) => {
  // user.vendorId available
})

// Custom requirements
export const GET = withAuth(
  async (request, { user }) => {
    // handler
  },
  { 
    roles: ['admin', 'vendor'],
    permissions: ['products:edit']
  }
)
```

### Server Components

```typescript
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"
import { getUserContext, hasRole } from "@/lib/rbac"
import { redirect } from "next/navigation"

export default async function MyPage() {
  const supabase = createClient(cookies())
  const user = await getUserContext(supabase)
  
  if (!user || !hasRole(user, 'admin')) {
    redirect("/login")
  }
  
  // Component with user context
}
```

## Support

If you need help migrating:
1. Review the examples in `/app/api/admin/vendors/list-new/route.ts`
2. Check the migration guide: [docs/RBAC_MIGRATION_GUIDE.md](../docs/RBAC_MIGRATION_GUIDE.md)
3. Test your changes thoroughly before deploying

## Removal Schedule

The deprecated files will be removed on **March 1, 2026** (30 days after deprecation).

Ensure all code is migrated before this date to avoid breaking changes.

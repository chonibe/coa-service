# RBAC System Migration Guide

## Overview

This guide explains how to migrate from the old fragmented authentication system to the new unified RBAC (Role-Based Access Control) system.

## What Changed

### Before (Old System)

```typescript
// Multiple session cookies
import { guardAdminRequest } from "@/lib/auth-guards"
import { guardVendorRequest } from "@/lib/auth-guards"
import { getCollectorSession } from "@/lib/collector-session"

// Hardcoded admin emails
const ADMIN_EMAILS = ["choni@thestreetlamp.com", "chonibe@gmail.com"]

// Fragmented role tables
admin_accounts
vendor_users
collector_profiles

// Multiple callback routes
/auth/callback
/auth/collector/callback
/auth/admin/callback
/api/auth/shopify/google/callback
```

### After (New System)

```typescript
// Single JWT-based session with role claims
import { withAuth, withAdmin, withVendor } from "@/lib/rbac/middleware"
import { getUserContext, hasRole, hasPermission } from "@/lib/rbac"

// Database-driven roles
user_roles table (single source of truth)

// Unified callback
/auth/callback (handles all OAuth flows)
```

## Migration Steps

### 1. Database Migration

Run the migrations in order:

```bash
# 1. Create new RBAC tables
supabase/migrations/20260126000000_rbac_unified_roles.sql

# 2. Set up JWT custom access token hook
supabase/migrations/20260126000001_rbac_jwt_hook.sql

# 3. Migrate existing data
supabase/migrations/20260126000002_rbac_data_migration.sql

# 4. Update RLS policies
supabase/migrations/20260126000003_rbac_update_rls_policies.sql
```

### 2. Update Supabase Config

The JWT hook is already configured in `supabase/config.toml`:

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token"
```

### 3. Update API Routes

**Old Way:**

```typescript
// app/api/admin/vendors/route.ts
import { guardAdminRequest } from "@/lib/auth-guards"

export async function GET(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") return auth.response
  
  // Admin logic
}
```

**New Way:**

```typescript
// app/api/admin/vendors/route.ts
import { withAdmin } from "@/lib/rbac/middleware"

export const GET = withAdmin(async (request, { user }) => {
  // Admin logic with guaranteed user context
  // user.roles, user.permissions, user.userId available
  
  return NextResponse.json({ data: "..." })
})
```

### 4. Update Server Components

**Old Way:**

```typescript
// app/admin/page.tsx
import { cookies } from "next/headers"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { isAdminEmail } from "@/lib/vendor-auth"

export default function AdminPage() {
  const cookieStore = cookies()
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const payload = verifyAdminSessionToken(adminToken)
  
  if (!payload?.email || !isAdminEmail(payload.email)) {
    redirect("/login?admin=true")
  }
  
  // Component logic
}
```

**New Way:**

```typescript
// app/admin/page.tsx
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"
import { getUserContext, requireRole } from "@/lib/rbac"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const user = await getUserContext(supabase)
  
  if (!user || !hasRole(user, 'admin')) {
    redirect("/login")
  }
  
  // Component logic with user context
}
```

### 5. Update Client Components

**Old Way:**

```typescript
// Check session via API
const response = await fetch("/api/auth/status")
const { isAdmin, hasVendorAccess } = await response.json()
```

**New Way:**

```typescript
// Session data in JWT is automatically available
import { useAuth } from "@/hooks/use-auth" // You'll need to create this

function MyComponent() {
  const { user, isLoading } = useAuth()
  
  const isAdmin = user?.roles.includes('admin')
  const isVendor = user?.roles.includes('vendor')
  
  // Component logic
}
```

### 6. Create useAuth Hook (Optional but Recommended)

Create `hooks/use-auth.ts`:

```typescript
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserContext, type UserContext } from "@/lib/rbac"

export function useAuth() {
  const [user, setUser] = useState<UserContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const supabase = createClient()
    
    getUserContext(supabase).then(ctx => {
      setUser(ctx)
      setIsLoading(false)
    })
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUserContext(supabase).then(setUser)
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  return { user, isLoading }
}
```

## Role Management

### Adding Roles to Users

```sql
-- Grant admin role
INSERT INTO user_roles (user_id, role, granted_by)
VALUES (
  'user-uuid-here',
  'admin',
  auth.uid() -- Who is granting the role
);

-- Grant vendor role with vendor association
INSERT INTO user_roles (user_id, role, resource_id, granted_by)
VALUES (
  'user-uuid-here',
  'vendor',
  vendor_id_number,
  auth.uid()
);

-- Grant collector role
INSERT INTO user_roles (user_id, role, granted_by)
VALUES (
  'user-uuid-here',
  'collector',
  auth.uid()
);
```

### Revoking Roles

```sql
-- Soft delete (recommended)
UPDATE user_roles
SET is_active = false
WHERE user_id = 'user-uuid-here'
  AND role = 'vendor';

-- Hard delete
DELETE FROM user_roles
WHERE user_id = 'user-uuid-here'
  AND role = 'vendor';
```

### Checking Roles (SQL)

```sql
-- Get all roles for a user
SELECT role, resource_id, is_active
FROM user_roles
WHERE user_id = 'user-uuid-here'
  AND is_active = true;

-- Check if user has specific role
SELECT public.user_has_role('user-uuid-here', 'admin');

-- Get all permissions for a user
SELECT * FROM public.get_user_permissions('user-uuid-here');
```

## Permission System

### Default Permissions

See `supabase/migrations/20260126000000_rbac_unified_roles.sql` for the complete list.

**Admin permissions:**
- `admin:all` - Full system access
- `vendors:manage` - Manage all vendors
- `collectors:manage` - Manage all collectors
- `orders:manage` - Manage all orders
- `payouts:manage` - Manage all payouts
- `users:manage` - Manage user roles and permissions
- And more...

**Vendor permissions:**
- `vendor:dashboard` - Access vendor dashboard
- `products:create`, `products:edit`, `products:delete`
- `series:manage` - Manage artwork series
- `orders:view`, `payouts:view`
- And more...

**Collector permissions:**
- `collector:dashboard` - Access collector dashboard
- `artwork:view`, `artwork:authenticate`
- `series:view`, `profile:manage`
- And more...

### Using Permissions

```typescript
import { hasPermission, requirePermission } from "@/lib/rbac"

// Check permission
if (hasPermission(user, 'products:edit')) {
  // Allow editing
}

// Require permission (throws if missing)
requirePermission(user, 'products:edit')

// Check multiple permissions (any)
if (hasAnyPermission(user, ['products:edit', 'products:delete'])) {
  // User has at least one
}

// Middleware with permissions
export const POST = withAuth(
  async (request, { user }) => {
    // Handler logic
  },
  { permissions: ['products:create'] }
)
```

## Testing

### Test the Migration

```bash
# 1. Check that users were migrated
psql $DATABASE_URL -c "SELECT role, COUNT(*) FROM user_roles GROUP BY role;"

# 2. Check JWT claims are working
# Login and decode your JWT at jwt.io
# Should see: user_roles, vendor_id, user_permissions

# 3. Test API endpoints
curl -H "Authorization: Bearer $JWT_TOKEN" \
  https://your-app.com/api/admin/vendors

# 4. Test role-based redirects
# Login as each role type and verify correct dashboard redirect
```

### Common Issues

**Issue: User has no roles after migration**

```sql
-- Check if user exists in old tables
SELECT * FROM admin_accounts WHERE email = 'user@example.com';
SELECT * FROM vendor_users WHERE email = 'user@example.com';
SELECT * FROM collector_profiles WHERE email = 'user@example.com';

-- Manually add role if needed
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid', 'admin');
```

**Issue: JWT doesn't contain role claims**

- Restart Supabase: `supabase stop && supabase start`
- Check config.toml has the JWT hook enabled
- Verify custom_access_token function exists: `SELECT * FROM pg_proc WHERE proname = 'custom_access_token';`

**Issue: RLS policies blocking access**

```sql
-- Test RLS function
SELECT auth.has_role('admin'); -- Should return true for admin

-- Check user's JWT claims
SELECT current_setting('request.jwt.claims', true)::jsonb;
```

## Rollback Plan

If you need to rollback:

1. Keep old session cookies working during transition
2. Old callback routes at `/auth/callback/route-old.ts`
3. Database tables (`admin_accounts`, `vendor_users`, `collector_profiles`) are NOT deleted

To fully rollback:

```sql
-- Disable JWT hook
-- In config.toml, set enabled = false

-- Revert RLS policies
-- Re-run old RLS policy migrations

-- Continue using old auth-guards.ts
```

## Best Practices

1. **Don't delete old tables immediately** - Keep for 30 days as backup
2. **Monitor audit logs** - Check `user_role_audit_log` for suspicious activity
3. **Use permissions over roles** - More flexible for future features
4. **Test in staging first** - Verify migration before production
5. **Gradual rollout** - Update one API route at a time

## Support

For issues or questions:
1. Check the audit logs: `SELECT * FROM user_role_audit_log ORDER BY performed_at DESC LIMIT 100;`
2. Review JWT claims in browser DevTools
3. Check Supabase logs for hook errors
4. Verify RLS policies are working as expected

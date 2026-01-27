# RBAC Login Flow Fix - Prevent Wrong Dashboard Redirects

**Date**: January 26, 2026  
**Issue**: Users with multiple roles (e.g., vendor + collector, admin + collector) were being redirected to the wrong dashboard based on role priority instead of login intent.

## Problem Summary

The authentication system was using legacy role detection logic that:
1. Checked roles in a fixed priority order (admin > vendor > collector)
2. Did not respect which login button the user clicked
3. Did not use the new RBAC `user_roles` table for role detection
4. Could redirect a vendor to collector dashboard or vice versa

### Example Issues
- A user with both vendor and collector roles clicking "Vendor Login" would be redirected to collector dashboard
- An admin with collector access would always go to admin dashboard even if they wanted collector access
- The system didn't track login intent from the OAuth flow

## Solution Implemented

### 1. Created RBAC Role Helper Functions
**File**: `lib/rbac/role-helpers.ts`

New functions to query the `user_roles` table:
- `getUserActiveRoles(userId)` - Get all active roles from RBAC system
- `userHasRole(userId, role)` - Check if user has specific role
- `getUserVendorId(userId)` - Get vendor ID from user_roles
- `getPreferredDashboard(roles, loginIntent)` - Determine correct dashboard based on roles and intent
- `isMultiRoleUser(roles)` - Check if user has multiple roles

### 2. Added Login Intent Tracking
**Files**: `lib/vendor-auth.ts`, OAuth start routes

- Added `LOGIN_INTENT_COOKIE` constant
- Set cookie during OAuth start based on redirect parameter or endpoint
- Cookie tracks whether user wants 'admin', 'vendor', or 'collector' access
- Cookie expires after 5 minutes (same as OAuth flow)

### 3. Updated OAuth Start Routes

#### `app/api/auth/google/start/route.ts`
- Detects login intent from redirect parameter
- Sets `LOGIN_INTENT_COOKIE` with appropriate value
- Default intent is 'collector' if not specified

#### `app/api/auth/collector/google/start/route.ts`
- Always sets `LOGIN_INTENT_COOKIE` to 'collector'
- Ensures collector-specific OAuth endpoint respects intent

### 4. Updated Authentication Callback
**File**: `app/auth/callback/route.ts`

Complete rewrite of `processUserLogin()` function:
- **Before**: Checked legacy tables (admin_accounts, vendor_users, orders, collector_profiles)
- **After**: Queries `user_roles` table using RBAC helpers
- Reads `LOGIN_INTENT_COOKIE` to determine user's intended role
- Uses `getPreferredDashboard()` to respect login intent
- Falls back to role priority (admin > vendor > collector) if no intent specified
- Sets appropriate session cookies based on target dashboard

### 5. Updated Auth Status API
**File**: `app/api/auth/status/route.ts`

- Queries `user_roles` table instead of individual legacy tables
- Returns `roles` array with all active roles
- Includes `hasVendorRole` and `hasCollectorRole` flags
- Uses RBAC helpers for vendor ID lookup
- Maintains backwards compatibility with legacy session cookies

## Technical Details

### Role Priority Logic

**With Login Intent** (user clicked specific login button):
1. If user has the intended role, redirect there
2. Otherwise, fall back to default priority

**Without Login Intent** (legacy flow or direct callback):
1. Admin > Vendor > Collector (fixed priority)
2. First matching role wins

### Session Cookie Management

The system sets role-specific cookies based on destination:

| Dashboard | Cookies Set | Cookies Cleared |
|-----------|-------------|-----------------|
| `/admin/dashboard` | `admin_session` | `vendor_session`, `login_intent` |
| `/vendor/dashboard` | `vendor_session` | `admin_session`, `login_intent` |
| `/collector/dashboard` | `collector_session` | `login_intent` |

### RBAC Table Integration

The fix fully integrates with the RBAC migration:
- Queries `user_roles` table for active roles
- Respects `is_active` flag and `expires_at` timestamp
- Uses `resource_id` for vendor associations
- Logs all role changes to `user_role_audit_log`

## Testing Scenarios

### Scenario 1: Admin with Collector Role
- **Login Intent**: Collector
- **Expected**: Redirect to `/collector/dashboard`
- **Cookies**: `collector_session` set, `admin_session` cleared

### Scenario 2: Vendor with Collector Role  
- **Login Intent**: Vendor
- **Expected**: Redirect to `/vendor/dashboard`
- **Cookies**: `vendor_session` set

### Scenario 3: Multi-Role User, No Intent
- **Roles**: admin, vendor, collector
- **Login Intent**: None
- **Expected**: Redirect to `/admin/dashboard` (highest priority)

### Scenario 4: Single-Role Vendor
- **Roles**: vendor
- **Login Intent**: Any
- **Expected**: Redirect to `/vendor/dashboard`

### Scenario 5: User with No Roles
- **Roles**: []
- **Expected**: Redirect to `/login?error=not_registered`
- **Action**: Sign out and show error

## Migration Requirements

### Database
The RBAC migration script must be applied first:
```bash
# Run in Supabase SQL Editor
scripts/apply-rbac-migrations-fixed.sql
```

This creates:
- `user_roles` table with active roles
- `role_permissions` table with permission mappings
- JWT hook functions for role injection
- RLS policies for security

### Data Migration
The migration script automatically migrates existing users:
- `admin_accounts` → `user_roles` (role='admin')
- `vendor_users` → `user_roles` (role='vendor', resource_id=vendor_id)
- `collector_profiles` + `orders` → `user_roles` (role='collector')

## Backwards Compatibility

The implementation maintains compatibility with:
- Legacy session cookies (admin_session, vendor_session, collector_session)
- Legacy admin email check via `isAdminEmail()`
- Legacy vendor linking via `linkSupabaseUserToVendor()` (kept for vendor status checks)
- Existing middleware and route protection

## Security Considerations

1. **Login Intent Cookie**: 
   - HttpOnly, SameSite=lax, secure in production
   - Short expiration (5 minutes)
   - Cannot be used to escalate privileges (roles still checked)

2. **RBAC Roles**:
   - All role queries check `is_active = true`
   - Expired roles are filtered out (`expires_at > now()`)
   - RLS policies protect user_roles table

3. **Session Cookies**:
   - Each role has separate session cookie
   - Cookies cleared when switching roles
   - JWT still contains all roles for API access

## Files Modified

1. ✅ `lib/rbac/role-helpers.ts` - New file with RBAC helper functions
2. ✅ `lib/vendor-auth.ts` - Added LOGIN_INTENT_COOKIE constant
3. ✅ `app/api/auth/google/start/route.ts` - Set login intent cookie
4. ✅ `app/api/auth/collector/google/start/route.ts` - Set collector intent
5. ✅ `app/auth/callback/route.ts` - Complete rewrite using RBAC
6. ✅ `app/api/auth/status/route.ts` - Use RBAC for role detection

## Deployment Checklist

- [ ] Apply RBAC migration script in production Supabase
- [ ] Verify `user_roles` table is populated with existing users
- [ ] Deploy code changes to production
- [ ] Test admin login
- [ ] Test vendor login (single role)
- [ ] Test collector login (single role)
- [ ] Test multi-role vendor+collector login (both buttons)
- [ ] Test multi-role admin+collector login
- [ ] Monitor logs for RBAC-related errors
- [ ] Verify JWT tokens contain `user_roles` claim

## Success Criteria

✅ Users with multiple roles can choose which dashboard to access  
✅ Login intent is respected throughout the OAuth flow  
✅ RBAC `user_roles` table is the source of truth for roles  
✅ Legacy session cookies still work for backwards compatibility  
✅ No linter errors in modified files  
✅ All role checks query the database, not hardcoded lists  

## Future Improvements

1. **Role Selection Page**: Create `/auth/select-role` page for users with multiple roles to choose explicitly
2. **JWT Claims**: Update all API routes to use JWT claims instead of session cookies
3. **Legacy Cleanup**: Remove legacy admin_accounts, vendor_users tables once RBAC is stable
4. **Audit Logging**: Log login intent and role selection for security audit
5. **Session Switching**: Allow users to switch roles without re-authenticating

## Related Documentation

- [RBAC Migration Guide](./RBAC_MIGRATION_GUIDE.md)
- [RBAC Architecture](./RBAC_ARCHITECTURE.md)
- [Apply RBAC Migrations Script](../scripts/apply-rbac-migrations-fixed.sql)
- [RBAC Index](../lib/rbac/index.ts)

## Questions or Issues?

Contact: support@thestreetcollector.com

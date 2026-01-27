# RBAC Migration - Deployment Checklist

Use this checklist to track your progress through the RBAC migration.

---

## ✅ Pre-Migration Setup

- [ ] Docker Desktop is installed and running
- [ ] Supabase CLI is installed (`supabase --version`)
- [ ] Project is set up with Supabase (`supabase status` works)
- [ ] Have access to Supabase Studio (http://localhost:54323)
- [ ] Backup current database (optional but recommended)
  ```powershell
  supabase db dump -f backup-before-rbac.sql
  ```

---

## ✅ Apply the Migration

Choose ONE method:

### Method 1: PowerShell Script (Recommended)
- [ ] Open PowerShell in project directory
- [ ] Run: `.\scripts\run-rbac-migration.ps1`
- [ ] Review output for errors
- [ ] Verify success message appears

### Method 2: Supabase Dashboard
- [ ] Start Supabase: `supabase start`
- [ ] Open http://localhost:54323
- [ ] Navigate to SQL Editor
- [ ] Open `scripts/apply-rbac-migrations-fixed.sql`
- [ ] Copy entire contents
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Check for success notice

### Method 3: CLI
- [ ] Open PowerShell in project directory
- [ ] Run: `Get-Content scripts/apply-rbac-migrations-fixed.sql | supabase db execute`
- [ ] Review output for errors

---

## ✅ Verification Steps

### 1. Check Tables Created

- [ ] Run in SQL Editor:
  ```sql
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('user_roles', 'role_permissions', 'user_permission_overrides', 'user_role_audit_log')
  ORDER BY table_name;
  ```
- [ ] Confirm all 4 tables exist

### 2. Check Roles Migrated

- [ ] Run in SQL Editor:
  ```sql
  SELECT role, COUNT(*) as count
  FROM public.user_roles
  WHERE is_active = true
  GROUP BY role
  ORDER BY role;
  ```
- [ ] Confirm you see counts for: admin, vendor, collector
- [ ] Record the counts:
  - Admin: _____
  - Vendor: _____
  - Collector: _____

### 3. Check Functions Created

- [ ] Run in SQL Editor:
  ```sql
  SELECT proname as function_name, pronargs as num_args
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname IN ('has_role', 'has_permission', 'jwt_vendor_id', 'custom_access_token')
  ORDER BY proname;
  ```
- [ ] Confirm all 4 functions exist

### 4. Check Your Personal Roles

- [ ] Run in SQL Editor (replace with your email):
  ```sql
  SELECT 
    u.email,
    ur.role,
    ur.resource_id,
    ur.is_active,
    ur.granted_at
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE u.email = 'YOUR-EMAIL-HERE';
  ```
- [ ] Confirm your user has at least one role
- [ ] Record your roles: _____________________

### 5. Test JWT Hook

- [ ] Run in SQL Editor:
  ```sql
  SELECT public.custom_access_token(
    jsonb_build_object(
      'user_id', 'test-id',
      'email', 'test@test.com',
      'claims', '{}'::jsonb
    )
  );
  ```
- [ ] Confirm it returns a JSON object without errors

---

## ✅ Configuration Verification

### 1. Check Supabase Config

- [ ] Open `supabase/config.toml`
- [ ] Find the `[auth.hook.custom_access_token]` section
- [ ] Confirm it looks like this:
  ```toml
  [auth.hook.custom_access_token]
  enabled = true
  uri = "pg-functions://postgres/public/custom_access_token"
  ```
- [ ] If different, update it and restart Supabase

### 2. Restart Supabase (if config changed)

- [ ] Run: `supabase stop`
- [ ] Run: `supabase start`
- [ ] Wait for services to start

---

## ✅ Functional Testing

### 1. Test Login

- [ ] Start your Next.js app: `npm run dev`
- [ ] Navigate to login page
- [ ] Login with admin account
- [ ] Login successful (no errors)

### 2. Verify JWT Contains Roles

- [ ] After logging in, open browser DevTools
- [ ] Go to Application/Storage > Cookies
- [ ] Find Supabase auth cookie
- [ ] Copy the access_token value
- [ ] Go to https://jwt.io
- [ ] Paste the token
- [ ] In the payload, verify you see:
  - [ ] `user_roles`: array with your roles
  - [ ] `user_permissions`: array with permissions
  - [ ] `rbac_version`: "2.0"
  - [ ] `vendor_id`: number (if you're a vendor)

### 3. Test Admin Access

- [ ] Navigate to `/admin`
- [ ] Page loads successfully
- [ ] Can see vendor list (if implemented)
- [ ] Can see user management (if implemented)
- [ ] No permission errors in console

### 4. Test Vendor Access (if applicable)

- [ ] Login as vendor account
- [ ] Navigate to vendor dashboard
- [ ] Can see own products
- [ ] Can see own orders
- [ ] Cannot see other vendors' data
- [ ] No permission errors

### 5. Test Collector Access (if applicable)

- [ ] Login as collector account
- [ ] Navigate to collector dashboard
- [ ] Can see own artwork
- [ ] Can see own profile
- [ ] Cannot access admin or vendor areas
- [ ] No permission errors

---

## ✅ RLS Policy Testing

### 1. Test Vendor RLS

- [ ] Login as vendor
- [ ] Open SQL Editor
- [ ] Run (replace with your vendor_id):
  ```sql
  -- Should return true if you're a vendor
  SELECT public.has_role('vendor');
  
  -- Should return your vendor_id
  SELECT public.jwt_vendor_id();
  
  -- Should return your vendor data
  SELECT * FROM public.vendors WHERE id = public.jwt_vendor_id();
  ```
- [ ] Confirm queries work as expected

### 2. Test Admin RLS

- [ ] Login as admin
- [ ] Open SQL Editor
- [ ] Run:
  ```sql
  -- Should return true
  SELECT public.has_role('admin');
  
  -- Should return all vendors
  SELECT COUNT(*) FROM public.vendors;
  ```
- [ ] Confirm admin can see all data

### 3. Test Collector RLS

- [ ] Login as collector
- [ ] Open SQL Editor
- [ ] Run:
  ```sql
  -- Should return true
  SELECT public.has_role('collector');
  
  -- Should return only your items
  SELECT COUNT(*) FROM public.order_line_items_v2
  WHERE owner_id = auth.uid();
  ```
- [ ] Confirm collector sees only their data

---

## ✅ Code Migration (Progressive)

### 1. Update API Routes - Phase 1 (Admin Routes)

- [ ] Create `lib/rbac/middleware.ts` (if not exists)
- [ ] Implement `withAdmin()` function
- [ ] Update `/api/admin/vendors/route.ts`
  - [ ] Replace `guardAdminRequest()` with `withAdmin()`
  - [ ] Test endpoint works
- [ ] Update other admin routes one by one
- [ ] Test each route after update

### 2. Update API Routes - Phase 2 (Vendor Routes)

- [ ] Implement `withVendor()` function
- [ ] Update `/api/vendor/*` routes
- [ ] Test vendor endpoints
- [ ] Verify vendors can only access their data

### 3. Update API Routes - Phase 3 (Collector Routes)

- [ ] Implement `withCollector()` function
- [ ] Update `/api/collector/*` routes
- [ ] Test collector endpoints
- [ ] Verify collectors can only access their data

### 4. Update Server Components

- [ ] Create helper: `lib/rbac/index.ts`
- [ ] Implement `getUserContext()` function
- [ ] Update `app/admin/page.tsx`
  - [ ] Replace cookie checks with `getUserContext()`
  - [ ] Test page loads correctly
- [ ] Update other server components
- [ ] Test navigation and access control

### 5. Update Client Components

- [ ] Create `hooks/use-auth.ts`
- [ ] Implement `useAuth()` hook
- [ ] Update client components to use hook
- [ ] Test role-based UI rendering
- [ ] Verify permission checks work

---

## ✅ Monitoring and Validation

### 1. Check Audit Logs

- [ ] Run daily for first week:
  ```sql
  SELECT 
    u.email,
    ral.role,
    ral.action,
    ral.performed_at,
    ral.reason
  FROM public.user_role_audit_log ral
  LEFT JOIN auth.users u ON u.id = ral.user_id
  ORDER BY ral.performed_at DESC
  LIMIT 50;
  ```
- [ ] Review for unexpected role changes
- [ ] Investigate any suspicious activity

### 2. Monitor Error Logs

- [ ] Check Supabase logs: `supabase logs`
- [ ] Check app logs for permission errors
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor for JWT-related errors

### 3. Performance Monitoring

- [ ] Monitor RLS policy performance
- [ ] Check for slow queries
- [ ] Optimize if needed (add indexes)
- [ ] Monitor JWT token size (should be reasonable)

---

## ✅ Documentation Updates

### 1. Update Project Documentation

- [ ] Update README.md with RBAC info
- [ ] Document new role system
- [ ] Add links to RBAC guides
- [ ] Update API documentation

### 2. Update Team Knowledge

- [ ] Share RBAC migration guide with team
- [ ] Document new middleware usage
- [ ] Create examples for common patterns
- [ ] Update onboarding docs

### 3. Create Runbooks

- [ ] How to add new role
- [ ] How to grant permissions
- [ ] How to revoke access
- [ ] Troubleshooting guide

---

## ✅ Production Deployment (30 Days After Testing)

### 1. Pre-Production Checks

- [ ] All tests passing
- [ ] No errors in logs for 30 days
- [ ] Team comfortable with new system
- [ ] Documentation complete
- [ ] Rollback plan prepared

### 2. Production Migration

- [ ] Schedule maintenance window
- [ ] Backup production database
- [ ] Run migration in production
- [ ] Verify migration success
- [ ] Test critical flows
- [ ] Monitor for issues

### 3. Post-Deployment

- [ ] Monitor logs for 24 hours
- [ ] Check user reports
- [ ] Verify all features working
- [ ] Document any issues
- [ ] Communicate status to team

---

## ✅ Cleanup (After Successful Validation)

### 1. Remove Old Code

- [ ] Mark old session files as deprecated:
  - [ ] `lib/admin-session.ts`
  - [ ] `lib/vendor-session.ts`
  - [ ] `lib/collector-session.ts`
- [ ] Remove old auth guards:
  - [ ] `lib/auth-guards.ts` (old implementations)
- [ ] Remove hardcoded email lists:
  - [ ] `lib/vendor-auth.ts` ADMIN_EMAILS

### 2. Remove Old Routes

- [ ] Archive old callback routes:
  - [ ] `app/auth/collector/callback/route.ts`
  - [ ] `app/auth/admin/callback/route.ts`
- [ ] Redirect old routes to new unified callback
- [ ] Update OAuth redirect URIs

### 3. Database Cleanup

- [ ] Keep old tables for reference (DO NOT DELETE):
  - `admin_accounts`
  - `vendor_users`
  - `collector_profiles`
- [ ] Add note to schema docs about deprecation
- [ ] Set up archival process (optional)

---

## ✅ Success Criteria

All of the following should be true:

- [ ] Migration applied without errors
- [ ] All 4 RBAC tables created
- [ ] Roles migrated from old tables
- [ ] Functions created in `public` schema
- [ ] JWT hook active and working
- [ ] Login produces JWT with `user_roles`
- [ ] RLS policies enforced correctly
- [ ] Admin can access all areas
- [ ] Vendors limited to their data
- [ ] Collectors limited to their data
- [ ] No permission errors in logs
- [ ] Audit trail capturing changes
- [ ] Team trained on new system
- [ ] Documentation complete

---

## 📊 Migration Status

**Started:** ___/___/___  
**Migration Applied:** ___/___/___  
**Testing Complete:** ___/___/___  
**Production Deployed:** ___/___/___  
**Cleanup Complete:** ___/___/___  

---

## 🆘 If You Need Help

1. **Check the docs:**
   - Quick fix: `docs/RBAC_QUICK_FIX.md`
   - Detailed guide: `docs/RBAC_MIGRATION_FIX.md`
   - Architecture: `docs/RBAC_ARCHITECTURE.md`

2. **Check logs:**
   ```powershell
   supabase logs
   supabase db logs
   ```

3. **Verify migration:**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations
   WHERE version LIKE '20260126%'
   ORDER BY version;
   ```

4. **Rollback if needed:**
   - Restore from backup
   - Re-enable old auth code
   - Investigate issues before retry

---

**Remember:** This is a progressive migration. Take your time, test thoroughly, and validate each step before moving to the next.

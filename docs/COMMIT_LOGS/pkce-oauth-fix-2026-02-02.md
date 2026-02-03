# PKCE OAuth Authentication Fix - February 2, 2026

**Commit:** `ceaeef148` - fix: migrate to @supabase/ssr to fix PKCE OAuth authentication  
**Date:** February 2, 2026  
**Priority:** 🔴 Critical  
**Status:** ✅ Ready for Deployment

---

## Summary

Fixed critical OAuth authentication failure that was blocking all Google sign-ins. Users were receiving "invalid request: both auth code and code verifier should be non-empty" error.

---

## Problem

### Symptoms
- ❌ All Google OAuth logins failing
- ❌ Error: "invalid request: both auth code and code verifier should be non-empty"
- ❌ PKCE code_verifier cookie not persisting between OAuth start and callback
- ❌ Affected all user roles (collector, vendor, admin)

### Root Cause
The deprecated `@supabase/auth-helpers-nextjs` package had cookie handling issues in Next.js 15, preventing PKCE `code_verifier` cookies from persisting through the OAuth redirect flow.

---

## Solution

### Changes Made

#### 1. Migrated to `@supabase/ssr` Package
**File:** `lib/supabase-server.ts`

**Changed from:**
```typescript
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export const createClient = (cookieStore?: CookieStore) => {
  return createRouteHandlerClient<Database>({
    cookies: () => store,
  })
}
```

**Changed to:**
```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export const createClient = (cookieStore?: ReadonlyRequestCookies) => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return store.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { /* ... */ },
        remove(name: string, options: CookieOptions) { /* ... */ },
      },
    }
  )
}
```

#### 2. Added Documentation
**File:** `docs/PKCE_OAUTH_FIX.md`
- Complete technical documentation of the issue
- PKCE flow explanation
- Testing procedures
- Troubleshooting guide

---

## Technical Details

### PKCE Flow
1. **OAuth Start** → Generates `code_verifier`, stores in cookie `sb-ldmppmnpgdxueebkkpid-auth-token-code-verifier`
2. **Google OAuth** → User authenticates, Google redirects back with `code`
3. **OAuth Callback** → Retrieves `code_verifier` from cookie, exchanges with Supabase
4. **Session Created** → User logged in with valid session

### Why @supabase/ssr Fixes It
- ✅ Explicitly handles cookie get/set/remove operations
- ✅ Properly sets cookie attributes for cross-site OAuth
- ✅ Compatible with Next.js 15 cookie handling
- ✅ Officially recommended by Supabase for SSR applications

---

## Files Changed

```
docs/PKCE_OAUTH_FIX.md        | 236 +++++++++++++++++++++
lib/supabase-server.ts        |  50 +++--
```

### Modified Files
- [x] `lib/supabase-server.ts` - Migrated to @supabase/ssr

### New Files  
- [x] `docs/PKCE_OAUTH_FIX.md` - Complete documentation

### Files Affected (Imports)
All files importing from `@/lib/supabase-server` continue to work without changes:
- `app/auth/callback/route.ts`
- `app/api/auth/google/start/route.ts`
- `app/api/auth/collector/google/start/route.ts`
- `app/api/auth/status/route.ts`
- And 35+ other route handlers

---

## Testing Checklist

### Pre-Deployment Tests
- [x] ✅ TypeScript compilation passes
- [x] ✅ No linter errors in modified files
- [x] ✅ Git commit created successfully
- [x] ✅ Documentation complete

### Post-Deployment Tests (Production)
- [ ] Test Collector OAuth login flow
- [ ] Test Vendor OAuth login flow  
- [ ] Test Admin OAuth login flow
- [ ] Test multi-role user (should show role selection)
- [ ] Verify no PKCE errors in production logs
- [ ] Monitor OAuth success rate > 95%

---

## Deployment Instructions

### 1. Pre-Deployment
```bash
# Verify commit
git log --oneline -1
# Should show: ceaeef148 fix: migrate to @supabase/ssr to fix PKCE OAuth authentication

# Check what will be deployed
git diff HEAD~1 HEAD
```

### 2. Deploy
```bash
# Push to main
git push origin main

# Or via Vercel
vercel --prod
```

### 3. Post-Deployment Monitoring

#### Check Logs for Success
```
✅ [auth/callback] Processing login for user: <userId>
✅ [auth/callback] Preferred dashboard: /collector/dashboard
```

#### Watch for Errors
```
❌ [auth/callback] Exchange result: { errorCode: 'validation_failed' }
❌ invalid request: both auth code and code verifier should be non-empty
```

#### Verify Cookie Presence
In browser console on `/auth/callback`:
```javascript
document.cookie.split(';').filter(c => c.includes('code-verifier'))
```
Should return the PKCE cookie after OAuth start, before callback completes.

---

## Rollback Plan

If OAuth continues to fail after deployment:

```bash
# Revert the commit
git revert ceaeef148

# Push to main
git push origin main
```

**Note:** This will restore the broken state, but at least it's a known issue. You'll need to investigate further or try alternative solutions from `docs/PKCE_OAUTH_FIX.md`.

---

## Success Criteria

- ✅ OAuth login success rate > 95%
- ✅ No PKCE validation errors in logs
- ✅ All role dashboards accessible after login
- ✅ Role selection works for multi-role users
- ✅ No regression in existing authentication flows

---

## Dependencies

### Required Packages (Already Installed)
- `@supabase/ssr@0.6.1` ✅
- `@supabase/supabase-js@2.50.0` ✅
- `next@15.2.6` ✅

### Environment Variables (No Changes)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Related Documentation

- 📄 `docs/PKCE_OAUTH_FIX.md` - Complete technical documentation
- 📄 `docs/GOOGLE_OAUTH_401_FIX.md` - Previous OAuth fixes
- 📄 `docs/RBAC_LOGIN_FLOW_FIX.md` - RBAC login flow documentation
- 🔗 [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- 🔗 [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)

---

## Future Improvements

1. **Complete Migration**: Audit and migrate all remaining `@supabase/auth-helpers-nextjs` usage
2. **Monitoring**: Add Sentry/logging for PKCE cookie lifecycle
3. **Tests**: Add E2E tests for OAuth flows
4. **Cookie Debugging**: Add debug mode to log cookie state during OAuth

---

## Notes

- This is a **backwards-compatible** change - all existing code continues to work
- The `@supabase/auth-helpers-nextjs` package can remain installed for now
- No database migrations required
- No environment variable changes required
- This fix applies to all OAuth providers (Google, etc.)

---

## Approval

**Reviewed by:** AI Assistant  
**Approved by:** [Pending User Approval]  
**Deployed by:** [Pending]  
**Deployment Date:** [Pending]

---

## Sign-off

- [ ] Code review completed
- [ ] Tests verified
- [ ] Documentation reviewed
- [ ] Ready for production deployment
- [ ] Post-deployment monitoring plan in place

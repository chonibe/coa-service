# Security Issue: Email Addresses in URLs

**Date**: January 26, 2026  
**Severity**: Medium - Privacy/Security Issue  
**Status**: ⚠️ Fix Required

---

## Problem

Collector profile URLs currently use email addresses as identifiers when `shopify_customer_id` and `user_id` are NULL:

```
https://app.thestreetcollector.com/admin/collectors/cedric_dawance@hotmail.com
```

**Security/Privacy Issues**:
1. **PII Exposure**: Email addresses are exposed in URLs, browser history, logs
2. **Enumeration Risk**: Attackers can guess valid email addresses
3. **GDPR/Privacy**: Email in URL may violate privacy regulations
4. **URL Sharing**: URLs with emails can't be safely shared

## Current Implementation

From `app/admin/collectors/page.tsx` (line 104):

```typescript
href={`/admin/collectors/${collector.shopify_customer_id || collector.user_id || collector.user_email}`}
```

**Fallback Priority**:
1. `shopify_customer_id` (preferred, but may be NULL)
2. `user_id` (UUID, but may be NULL for guest collectors)
3. `user_email` (⚠️ **SECURITY ISSUE** - exposes PII)

## Root Cause

The collector in question (`cedric_dawance@hotmail.com`) has:
- `user_id`: NULL (no auth.users account)
- `shopify_customer_id`: Missing from view
- Result: Falls back to email

## Solution Strategy

### Option 1: Generate Stable Collector IDs (Recommended)

Create a deterministic, non-reversible ID from email:

```sql
-- Add computed column to collector_profile_comprehensive view
public_id = encode(digest(user_email, 'sha256'), 'hex')::text
```

**Advantages**:
- Non-reversible (can't get email from ID)
- Stable (same email always generates same ID)
- No database changes needed
- Works for all collectors

### Option 2: Use Shopify Customer ID from Warehouse

Add `shopify_customer_id` lookup from warehouse or Shopify data:

```sql
-- In collector_profile_comprehensive view
COALESCE(
  cp.shopify_customer_id,
  (SELECT customer_id FROM orders WHERE LOWER(customer_email) = cb.email LIMIT 1),
  encode(digest(cb.email, 'sha256'), 'hex')::text
) as public_id
```

### Option 3: Create UUID Mapping Table

Create a persistent mapping table:

```sql
CREATE TABLE collector_public_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Disadvantages**:
- Adds complexity
- Requires migration
- Need to populate existing collectors

## Recommended Implementation

**Use Option 1** - Add a `public_id` field to the `collector_profile_comprehensive` view using SHA-256 hash.

### Migration Required

```sql
-- Update collector_profile_comprehensive view
DROP VIEW IF EXISTS collector_profile_comprehensive CASCADE;
CREATE VIEW collector_profile_comprehensive AS
WITH contact_base AS (
  -- ... existing CTE ...
)
SELECT
  -- ... existing fields ...
  
  -- Add secure public ID
  encode(digest(cb.email, 'sha256'), 'hex')::text as public_id,
  
  -- ... rest of fields ...
FROM contact_base cb
-- ... rest of view ...
```

### Frontend Updates Required

1. **Update Link** (`app/admin/collectors/page.tsx`):
   ```typescript
   href={`/admin/collectors/${collector.public_id}`}
   ```

2. **Update API Route** (`app/api/admin/collectors/[id]/activity/route.ts`):
   ```typescript
   // Add hash-based lookup
   const isHash = identifier.match(/^[0-9a-f]{64}$/);
   if (isHash) {
     // Find by hashed email
     const { data: profiles } = await supabase
       .from('collector_profile_comprehensive')
       .select('*')
       .eq('public_id', identifier);
   }
   ```

3. **Update getCollectorProfile** (`lib/collectors.ts`):
   ```typescript
   export async function getCollectorProfile(identifier: string): Promise<CollectorProfile | null> {
     const supabase = createClient();
     
     // Check if it's a hash (64 hex characters)
     const isHash = /^[0-9a-f]{64}$/.test(identifier);
     
     const query = supabase
       .from('collector_profile_comprehensive')
       .select('*');
   
     if (isHash) {
       query.eq('public_id', identifier);
     } else if (identifier.includes('@')) {
       query.eq('user_email', identifier.toLowerCase().trim());
     } else if (identifier.match(/^[0-9]+$/)) {
       query.eq('shopify_customer_id', identifier);
     } else {
       query.eq('user_id', identifier);
     }
   
     const { data, error } = await query.maybeSingle();
     return data as CollectorProfile;
   }
   ```

## Implementation Steps

### Phase 1: Update View (5 minutes)

1. Create migration: `supabase/migrations/[timestamp]_add_public_id_to_collector_view.sql`
2. Add `public_id` field to view
3. Run migration

### Phase 2: Update API (10 minutes)

1. Update `lib/collectors.ts` to handle hash lookups
2. Update `/api/admin/collectors/[id]/activity/route.ts`
3. Update `/api/admin/collectors/[id]/route.ts`

### Phase 3: Update Frontend (5 minutes)

1. Update `app/admin/collectors/page.tsx` to use `public_id`
2. Update any other components that link to collector profiles
3. Test that URLs no longer expose emails

### Phase 4: Testing (10 minutes)

1. Verify hash-based URLs work
2. Verify backward compatibility (email still works for API)
3. Check all collector profile links
4. Test navigation

## Migration Script

Ready to use - see: `supabase/migrations/[next]_add_public_id_to_collector_view.sql`

## Files to Update

| File | Change |
|------|--------|
| `supabase/migrations/[new]_add_public_id_to_collector_view.sql` | Add `public_id` field |
| `lib/collectors.ts` | Add hash-based lookup |
| `app/api/admin/collectors/[id]/activity/route.ts` | Support hash identifier |
| `app/api/admin/collectors/[id]/route.ts` | Support hash identifier |
| `app/admin/collectors/page.tsx` | Use `public_id` in links |

## Testing Checklist

- [ ] Hash-based URLs work (e.g., `/admin/collectors/abc123...`)
- [ ] Email-based lookups still work (API backward compatibility)
- [ ] UUID-based lookups still work
- [ ] Shopify ID lookups still work
- [ ] No emails visible in browser URL bar
- [ ] Browser history doesn't contain emails
- [ ] All collector profile links work

## Verification Query

After migration:

```sql
-- Verify public_id is populated
SELECT 
  user_email,
  public_id,
  LENGTH(public_id) as id_length
FROM collector_profile_comprehensive 
LIMIT 5;

-- Should return 64-character hashes
```

---

**Priority**: High  
**Estimated Time**: 30 minutes  
**Complexity**: Low

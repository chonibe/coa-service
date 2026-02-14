# Track C: Post-Purchase + Credits Implementation Log

**Date:** 2026-02-14  
**Commit:** `feat: implement Track C — Post-Purchase Bridge, Server-Synced Wishlist, Credits Economy`  
**Plan Reference:** `platform_integration_streams_48a1af4f.plan.md` — Track C (Streams C1, C2, C3)

## Changes Made

### Stream C1 — Post-Purchase Bridge

- [x] Modified `app/api/stripe/webhook/route.ts` — Added `bridgePostPurchase()` function
  - Creates stub `collector_profiles` for guest purchasers (user_id: null)
  - Creates `collector_accounts` via existing banking system
  - Deposits credits immediately (10 per $1, idempotent)
  - Sends claim email via Resend with HMAC-signed token link
- [x] Created `lib/auth/claim-token.ts` — HMAC-signed claim token system
  - `generateClaimToken()`, `verifyClaimToken()`, `buildClaimUrl()`
  - 7-day TTL, timing-safe comparison, reuses existing session secrets
- [x] Modified `app/shop/checkout/success/checkout-success-content.tsx`
  - Added credits earned banner (amber card with coin icon)
  - Added "Claim Your Collection" CTA for guest users
  - Auth-aware: shows "View My Collection" for authenticated users
- [x] Modified `app/collector/welcome/page.tsx`
  - Now accepts `?email={email}&token={token}` query params
  - Verifies claim token and triggers `signInWithOtp` for account creation
  - Falls through to standard auth check for invalid/expired tokens
- [x] Modified `app/collector/welcome/welcome-client.tsx`
  - Added claim-specific UI with magic link instructions
  - Added Google sign-in alternative button
  - Shows profile status indicator

### Stream C2 — Server-Synced Wishlist

- [x] Created `supabase/migrations/20260214100000_collector_wishlist_items.sql`
  - Full schema with RLS policies, indexes, soft-delete support
  - Unique constraint on (user_id, product_id) for active items
  - Auto-update trigger for `updated_at`
- [x] Created `app/api/collector/wishlist/route.ts`
  - GET: List active items, ordered by added_at desc
  - POST: Add item with dedup check
  - DELETE: Soft-delete via `removed_at` (by productId)
  - PATCH: Update notification preferences (notify_restock, notify_price_drop)
- [x] Modified `lib/shop/WishlistContext.tsx`
  - Added server sync for authenticated users (fetch on mount, merge local)
  - localStorage remains offline cache
  - First-login merge: local items uploaded to server if not already there
  - Add/remove operations sync to server in background

### Stream C3 — Credits Economy Expansion

- [x] Modified `components/shop/CreditBalanceWidget.tsx`
  - Shows for all authenticated users (removed `!user?.isMember` gate)
  - Hides if balance is 0 and not a member
  - Added tier badge next to balance for members
- [x] Modified `app/shop/cart/page.tsx`
  - Credit slider available for any user with credits (removed member-only check)
  - Added "Use X credits to save $Y" suggestion when slider at 0
  - Added "Earn X credits from this order" promo for users with no credits
- [x] Created `components/shop/ProductCreditsCallout.tsx`
  - Reusable component for product pages
  - Shows "Earn X credits" or "Use X credits to save $Y"
  - Amber-themed, compact design
- [x] Modified `app/shop/[handle]/page.tsx`
  - Mounted ProductCreditsCallout above Add to Cart button
  - Shows based on selected variant price
- [x] Modified `lib/banking/types.ts`
  - Added: `early_access`, `exclusive_content`, `membership_upgrade`, `referral_bonus`
- [x] Modified `lib/series/completion-calculator.ts`
  - `checkAndCompleteSeries()` now awards 1000 credits to all unique buyers
  - Queries series members → finds fulfilled order emails → rewards each
  - Non-critical: errors logged but don't block series completion

### Documentation

- [x] Created `docs/features/post-purchase-credits/README.md`
  - Full feature documentation covering all three streams
  - API endpoints, database schema, configuration, risk mitigation
  - Testing requirements checklist
  - Known limitations and future improvements

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `app/api/stripe/webhook/route.ts` | Modified | Post-purchase bridge (profiles, credits, claim email) |
| `lib/auth/claim-token.ts` | Created | HMAC-signed claim token utility |
| `app/shop/checkout/success/checkout-success-content.tsx` | Modified | Credits earned + claim CTA |
| `app/collector/welcome/page.tsx` | Modified | Token-based claim flow |
| `app/collector/welcome/welcome-client.tsx` | Modified | Claim UI + magic link instructions |
| `supabase/migrations/20260214100000_collector_wishlist_items.sql` | Created | Wishlist DB table + RLS |
| `app/api/collector/wishlist/route.ts` | Created | Wishlist API (CRUD) |
| `lib/shop/WishlistContext.tsx` | Modified | Server sync + merge |
| `components/shop/CreditBalanceWidget.tsx` | Modified | Show for all auth users |
| `app/shop/cart/page.tsx` | Modified | Enhanced credit UX |
| `components/shop/ProductCreditsCallout.tsx` | Created | Product page credits callout |
| `app/shop/[handle]/page.tsx` | Modified | Mount credits callout |
| `lib/banking/types.ts` | Modified | New transaction types |
| `lib/series/completion-calculator.ts` | Modified | Series completion rewards |
| `docs/features/post-purchase-credits/README.md` | Created | Feature documentation |

## Dependencies

- No new npm packages added
- Uses existing: Resend email, Supabase, Stripe, crypto (Node built-in)

## Deployment Notes

- Migration `20260214100000_collector_wishlist_items.sql` must be run against Supabase
- No new environment variables required
- Feature is immediately active (no feature flag for Track C)

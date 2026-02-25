# Track C: Post-Purchase + Credits

**Version:** 1.0.0  
**Last Updated:** 2026-02-14  
**Status:** Implemented  
**Plan Reference:** `platform_integration_streams_48a1af4f.plan.md` — Track C

## Feature Overview

Track C bridges the gap between purchase and collector identity, syncs wishlists to the server, and expands the credits economy. It consists of three streams:

| Stream | Name | Purpose | Est. Days |
|--------|------|---------|-----------|
| C1 | Post-Purchase Bridge | Every purchase creates/links a collector identity | 3-4 |
| C2 | Server-Synced Wishlist | Persist wishlists server-side for cross-device sync | 2-3 |
| C3 | Credits Economy Expansion | Make credits visible and spendable throughout the shop | 3-4 |

---

## Stream C1: Post-Purchase Bridge

### Problem
`handleCheckoutCompleted()` in the Stripe webhook did NOT create collector profiles for guest checkouts. Guest purchasers had no collector identity, no credits, and no way to claim their collection.

### Solution

#### 1. Webhook Enhancement
**File:** [`app/api/stripe/webhook/route.ts`](../../../app/api/stripe/webhook/route.ts)

After creating the Shopify draft order and recording the purchase, a new `bridgePostPurchase()` function:

1. **Creates stub `collector_profiles`** if none exists for the purchaser email (with `user_id: null`)
2. **Creates `collector_accounts`** via `getOrCreateCollectorAccount()` for the banking system
3. **Deposits credits immediately** based on purchase total (10 credits per $1)
4. **Sends a claim email** via Resend for guest purchasers (no linked Supabase account)

All operations are idempotent (duplicate-safe) and non-critical (failures are logged but don't fail the webhook).

#### 2. Claim Token System
**File:** [`lib/auth/claim-token.ts`](../../../lib/auth/claim-token.ts)

HMAC-signed tokens for email-based collection claims:
- **Format:** `base64url(payload).base64url(signature)`
- **Payload:** `{ email, purchaseId, issuedAt, expiresAt }`
- **TTL:** 7 days
- **Secret:** Reuses `COLLECTOR_SESSION_SECRET` or `VENDOR_SESSION_SECRET`

Functions:
- `generateClaimToken(email, purchaseId)` — Create token
- `verifyClaimToken(token)` — Verify and decode
- `buildClaimUrl(email, purchaseId)` — Full claim URL for emails

#### 3. Checkout Success Page
**File:** [`app/shop/checkout/success/checkout-success-content.tsx`](../../../app/shop/checkout/success/checkout-success-content.tsx)

Enhanced with:
- **Credits earned banner** showing credits earned from the purchase
- **Claim CTA** for guest users (not authenticated): "Claim Your Collection" with sign-up link
- **View Collection** for authenticated users

#### 4. Welcome / Claim Page
**Files:**
- [`app/collector/welcome/page.tsx`](../../../app/collector/welcome/page.tsx)
- [`app/collector/welcome/welcome-client.tsx`](../../../app/collector/welcome/welcome-client.tsx)

Two entry paths:
1. **Standard:** Authenticated user → onboarding wizard (unchanged)
2. **Token claim:** `?email={email}&token={token}` from purchase email
   - Verifies claim token
   - Sends magic link via `signInWithOtp`
   - Shows claim-specific UI with instructions
   - Auto-links purchases after sign-in

---

## Stream C2: Server-Synced Wishlist

### Problem
Wishlists were localStorage-only — no cross-device sync, no persistence across browsers.

### Solution

#### 1. Database Table
**Migration:** [`supabase/migrations/20260214100000_collector_wishlist_items.sql`](../../../supabase/migrations/20260214100000_collector_wishlist_items.sql)

Schema:
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| collector_identifier | TEXT | Email or user ID |
| product_id | TEXT | Shopify product ID |
| variant_id | TEXT | Shopify variant ID |
| handle | TEXT | Product handle |
| title | TEXT | Product title |
| price | NUMERIC | Price in USD |
| image | TEXT | Product image URL |
| artist_name | TEXT | Artist name |
| notify_restock | BOOLEAN | Restock notification pref |
| notify_price_drop | BOOLEAN | Price drop notification pref |
| added_at | TIMESTAMPTZ | When added |
| removed_at | TIMESTAMPTZ | Soft delete (null = active) |

RLS enabled with per-user policies.

#### 2. API Route
**File:** [`app/api/collector/wishlist/route.ts`](../../../app/api/collector/wishlist/route.ts)

| Method | Description |
|--------|-------------|
| GET | List active wishlist items |
| POST | Add item to wishlist (dedup by product_id) |
| DELETE | Soft-delete item (sets removed_at) |
| PATCH | Update notification preferences |

All endpoints require authentication.

#### 3. Context Enhancement
**File:** [`lib/shop/WishlistContext.tsx`](../../../lib/shop/WishlistContext.tsx)

Behavior:
- **Guest users:** localStorage-only (unchanged behavior)
- **Authenticated users:** Server sync with localStorage as offline cache
- **First login merge:** localStorage items merged into server (dedup by product_id, newest wins)
- Server sync is fire-and-forget (failures logged, don't block UI)

---

## Stream C3: Credits Economy Expansion

### Problem
Credits were only visible to members, not shown on product pages, and series completion didn't reward credits.

### Solution

#### 1. CreditBalanceWidget for All Users
**File:** [`components/shop/CreditBalanceWidget.tsx`](../../../components/shop/CreditBalanceWidget.tsx)

- Now shows for **all authenticated users**, not just members
- Shows if balance > 0 (hides for authenticated users with 0 balance who aren't members)
- Added tier badge next to balance for members

#### 2. Cart Credits Enhancement
**File:** [`app/shop/cart/page.tsx`](../../../app/shop/cart/page.tsx)

- Credit slider now available for **any authenticated user with credits** (not just members)
- Added "Use X credits to save $Y" suggestion when slider is at 0
- Added "Earn X credits from this order" promo for users with no credits

#### 3. Product Page Credits Callout
**Files:**
- [`components/shop/ProductCreditsCallout.tsx`](../../../components/shop/ProductCreditsCallout.tsx) (new)
- [`app/shop/[handle]/page.tsx`](../../../app/shop/%5Bhandle%5D/page.tsx) (modified)

Shows on every product page:
- "Earn X credits with this purchase" for users without credits
- "Use X credits to save $Y" for users with available credits

#### 4. New Transaction Types
**File:** [`lib/banking/types.ts`](../../../lib/banking/types.ts)

Added:
- `early_access` — Credits spent for early access
- `exclusive_content` — Credits spent for exclusive content
- `membership_upgrade` — Credits spent for tier upgrade
- `referral_bonus` — Credits earned from referrals

#### 5. Series Completion Bonus
**File:** [`lib/series/completion-calculator.ts`](../../../lib/series/completion-calculator.ts)

When a series is auto-completed via `checkAndCompleteSeries()`:
- Queries all unique buyers who purchased fulfilled items in the series
- Awards 1,000 credits to each via `rewardCreditsForSeriesCompletion()`
- Uses existing idempotency checks (no double rewards)
- Non-critical: failures don't prevent series completion

---

## Configuration

### Environment Variables
No new environment variables required. Uses existing:
- `COLLECTOR_SESSION_SECRET` / `VENDOR_SESSION_SECRET` — For claim tokens
- `RESEND_API_KEY` — For claim emails
- `NEXT_PUBLIC_APP_URL` — For claim URL base

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Stripe webhook failure | `bridgePostPurchase()` is non-critical; failures logged but don't fail the webhook |
| Duplicate credit deposits | Idempotency via `order_id` check in ledger entries |
| Wishlist sync failures | localStorage remains source of truth; server sync is additive |
| Claim token abuse | HMAC-signed, time-limited (7 days), timing-safe comparison |
| Series reward duplication | `rewardCreditsForSeriesCompletion` checks for existing rewards |

---

## Testing Requirements

### C1: Post-Purchase Bridge
- [ ] Guest checkout creates stub collector profile
- [ ] Credits deposited correctly (10 per $1)
- [ ] Claim email sent with valid link
- [ ] Claim token expires after 7 days
- [ ] Duplicate purchases don't create duplicate profiles/credits
- [ ] Authenticated checkout doesn't send claim email

### C2: Server-Synced Wishlist
- [ ] Guest can add/remove wishlist items (localStorage)
- [ ] Authenticated user's wishlist syncs to server
- [ ] First login merges localStorage items into server
- [ ] Cross-device: items appear on second device after login
- [ ] Notification preferences persist

### C3: Credits Economy
- [ ] CreditBalanceWidget shows for non-member with credits
- [ ] Credit slider works for non-member with credits
- [ ] Product page shows credits callout
- [ ] Series completion awards 1000 credits to buyers
- [ ] No duplicate series completion rewards

---

## Known Limitations

1. **Claim token single-use:** Tokens can be used multiple times within the 7-day window (idempotent)
2. **Wishlist merge conflicts:** Resolved by dedup (keep both, newest-wins for conflicts)
3. **Credits not real-time on product pages:** Balance fetched on component mount, not live-updated
4. **Referral credits:** Data model added (`referral_bonus` type) but implementation deferred

---

## Future Improvements

- **Referral credits implementation** — Award credits when referred users make purchases
- **Wishlist notification triggers** — Send emails on restock/price drop based on preferences
- **Real-time credit balance** — WebSocket or polling for live credit balance updates
- **Credit spending for early access** — Let collectors use credits to unlock early access
- **Phase 6: Unified Notifications** — Build on event emitters from C1/C2/C3

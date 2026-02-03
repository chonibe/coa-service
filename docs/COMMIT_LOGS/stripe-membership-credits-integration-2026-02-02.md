# Stripe Membership & Credits Integration

**Date**: 2026-02-02  
**Type**: Feature Implementation  
**Status**: Implementation Complete (Pending Stripe Dashboard Setup)

## Summary

Implemented a comprehensive membership and credits system with Stripe subscriptions, RBAC integration, and an MCP server for AI agent interaction.

## Changes Made

### 1. RBAC Integration

- [x] Updated `lib/rbac/index.ts` - Added 8 new membership permissions
  - `membership:view`, `membership:subscribe`, `membership:manage`
  - `credits:view`, `credits:redeem`, `checkout:member`
  - `membership:admin`, `credits:admin`

### 2. Database Migration

- [x] Created `supabase/migrations/20260202100000_membership_stripe_fields.sql`
  - Added Stripe fields to `collector_credit_subscriptions` table
  - Added `stripe_customer_id` to `collectors` table
  - Added `appreciation` to `collector_transaction_type` enum
  - Created `checkout_sessions` table for idempotency
  - Created `webhook_events` table for webhook idempotency
  - Created `membership_analytics` table for metrics
  - Added `credit_source` column to `collector_ledger_entries`
  - Inserted membership permissions into `role_permissions`

### 3. Membership Configuration

- [x] Created `lib/membership/tiers.ts`
  - 3 tiers: Collector ($10/mo, 100 credits), Curator ($22/mo, 280 credits), Founding ($50/mo, 750 credits)
  - Appreciation schedule: 5% at 3mo, 10% at 6mo, 15% at 12mo, 20% at 24mo
  - Helper functions for tier comparisons and credit calculations

### 4. Shop Auth System

- [x] Created `lib/shop/useShopAuth.ts` - RBAC-integrated auth hook
- [x] Created `lib/shop/ShopAuthContext.tsx` - React context provider
- [x] Created `lib/shop/CartContext.tsx` - Shopping cart state with localStorage persistence
- [x] Updated `app/shop/layout.tsx` - Wrapped with ShopAuthProvider and CartProvider

### 5. Membership API Routes

- [x] `app/api/membership/subscribe/route.ts` - Create Stripe checkout session for subscription
- [x] `app/api/membership/status/route.ts` - Get membership status, credits, transactions
- [x] `app/api/membership/cancel/route.ts` - Cancel or reactivate subscription
- [x] `app/api/membership/change-tier/route.ts` - Upgrade/downgrade subscription tier

### 6. Hybrid Checkout System

- [x] `app/api/checkout/create/route.ts` - Create checkout supporting:
  - Full Stripe payment
  - Partial credit + Stripe payment
  - Full credit-only payment
- [x] `app/api/checkout/complete/route.ts` - Complete credit-only purchases

### 7. Stripe Webhook Expansion

- [x] Updated `app/api/stripe/webhook/route.ts`
  - Added webhook idempotency tracking
  - Added `invoice.payment_succeeded` - Deposit monthly credits
  - Added `invoice.payment_failed` - Mark subscription as past_due
  - Added `customer.subscription.created` - Create/update subscription record
  - Added `customer.subscription.updated` - Handle tier changes, cancellation scheduling
  - Added `customer.subscription.deleted` - Handle cancellation

### 8. Credit Appreciation Cron

- [x] Created `app/api/cron/credit-appreciation/route.ts`
  - Monthly job to apply appreciation bonuses
  - Tracks which deposits have been appreciated at each milestone
  - Updates membership analytics

### 9. MCP Server

- [x] Created `mcp-servers/membership/` directory with:
  - `index.ts` - Full MCP server implementation
  - `package.json` - Dependencies
  - `tsconfig.json` - TypeScript configuration
  - `README.md` - Documentation
- [x] Tools implemented:
  - `get_member_status` - Get collector's membership status
  - `get_credit_balance` - Get detailed credit breakdown
  - `deposit_credits` - Add credits (with validation)
  - `redeem_credits` - Deduct credits for purchases
  - `get_transaction_history` - Get ledger entries
  - `get_subscription_details` - Get Stripe subscription info
  - `get_membership_analytics` - Get aggregate metrics

### 10. UI Components

- [x] `app/shop/membership/page.tsx` - Marketing page with tier comparison
- [x] `app/shop/cart/page.tsx` - Cart with credit slider for members
- [x] `app/collector/membership/page.tsx` - Member dashboard
- [x] `components/shop/CreditBalanceWidget.tsx` - Header credit display

### 11. Package Updates

- [x] Installed `@stripe/stripe-js` and `@stripe/react-stripe-js`

## Files Created/Modified

### New Files (25)

```
lib/membership/tiers.ts
lib/shop/useShopAuth.ts
lib/shop/ShopAuthContext.tsx
lib/shop/CartContext.tsx
supabase/migrations/20260202100000_membership_stripe_fields.sql
app/api/membership/subscribe/route.ts
app/api/membership/status/route.ts
app/api/membership/cancel/route.ts
app/api/membership/change-tier/route.ts
app/api/checkout/create/route.ts
app/api/checkout/complete/route.ts
app/api/cron/credit-appreciation/route.ts
app/shop/membership/page.tsx
app/shop/cart/page.tsx
app/collector/membership/page.tsx
components/shop/CreditBalanceWidget.tsx
mcp-servers/membership/index.ts
mcp-servers/membership/package.json
mcp-servers/membership/tsconfig.json
mcp-servers/membership/README.md
```

### Modified Files (3)

```
lib/rbac/index.ts - Added membership permissions
app/shop/layout.tsx - Added ShopAuthProvider and CartProvider
app/api/stripe/webhook/route.ts - Added subscription event handlers
```

## Pending Manual Steps

### Stripe Dashboard Setup (Required)

1. **Create Products & Prices**:
   - Collector: $10/month subscription
   - Curator: $22/month subscription
   - Founding: $50/month subscription

2. **Add Webhook Events** to endpoint:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

3. **Environment Variables** to add:
   ```
   STRIPE_PRICE_COLLECTOR=price_xxx
   STRIPE_PRICE_CURATOR=price_xxx
   STRIPE_PRICE_FOUNDING=price_xxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
   ```

### Vercel Cron Setup

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/credit-appreciation",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
├─────────────────────────────────────────────────────────────────┤
│  Shop Layout                                                     │
│  ├── ShopAuthProvider (RBAC + membership state)                 │
│  ├── CartProvider (cart state with localStorage)                │
│  └── CreditBalanceWidget (header)                               │
│                                                                  │
│  Pages:                                                          │
│  ├── /shop/membership (marketing + subscribe)                   │
│  ├── /shop/cart (cart + credit slider)                          │
│  └── /collector/membership (member dashboard)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes                                │
├─────────────────────────────────────────────────────────────────┤
│  Membership:                 │  Checkout:                        │
│  ├── /subscribe (→ Stripe)   │  ├── /create (hybrid checkout)   │
│  ├── /status                 │  └── /complete (credit-only)     │
│  ├── /cancel                 │                                   │
│  └── /change-tier            │  Cron:                            │
│                              │  └── /credit-appreciation         │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│     Stripe       │  │   Supabase   │  │  MCP Server  │
│                  │  │              │  │              │
│ • Subscriptions  │  │ • collectors │  │ • deposit    │
│ • Checkout       │  │ • ledger     │  │ • redeem     │
│ • Webhooks       │  │ • accounts   │  │ • analytics  │
└──────────────────┘  └──────────────┘  └──────────────┘
```

## Testing Checklist

- [ ] Subscribe to each tier
- [ ] Credits deposited on subscription creation
- [ ] Credits deposited on invoice payment
- [ ] Cancel subscription (at period end)
- [ ] Reactivate cancelled subscription
- [ ] Upgrade tier (proration + bonus credits)
- [ ] Downgrade tier
- [ ] Cart with credit slider
- [ ] Full credit-only checkout
- [ ] Hybrid credit + Stripe checkout
- [ ] Webhook idempotency (replay event)
- [ ] MCP server tools

## Related Documentation

- [Plan File](../plans/stripe_membership_credits_09ae13c4.plan.md)
- [MCP Server README](../mcp-servers/membership/README.md)
- [RBAC System](../lib/rbac/index.ts)

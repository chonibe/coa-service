# Artist Affiliate Program

**Version:** 1.0.0  
**Last Updated:** 2026-03-09

## Overview

Artists (vendors) receive a shareable **affiliate link** to their profile. When a customer buys a **lamp** after using that link, the artist earns **10% commission**. Commission is stored in the ledger, included in vendor balance and payouts, and surfaced in the vendor dashboard.

## Affiliate Link Format

- **Full URL:** `https://<site>/shop/artists/<slug>?ref=<slug>`
- **Short URL:** `https://<site>/r/<slug>` (redirects to full URL with ref set)

The slug comes from `vendor_collections.shopify_collection_handle`.

## Attribution Flow

1. Visitor lands on artist profile via link with `?ref=<slug>` (or `/r/<slug>`)
2. Client sets `affiliate_ref` cookie (14-day TTL)
3. At checkout, API reads cookie and resolves ref → `vendor_id` → passes to Stripe/Shopify
4. Draft order gets `note_attributes: [{ name: 'affiliate_vendor_id', value: '<id>' }]`
5. Order sync persists `orders.affiliate_vendor_id`
6. When a **lamp** line item is fulfilled, affiliate commission (10%) is deposited to the artist's ledger

## Commission Rules

- **Rate:** 10% of lamp line item price (in USD)
- **Eligible products:** Street Lamp (SKU: streetlamp001, streetlamp002, or product name contains "street lamp")
- **Trigger:** Line item `fulfillment_status = 'fulfilled'`
- **Exclusion:** Same vendor as buyer (self-referral) does not earn commission

## Where It Appears

- **Vendor Dashboard Profile:** Affiliate Link card with copy button
- **Vendor Dashboard Analytics:** Affiliate Earnings metric (total earned, referred lamp sales count)
- **Balance & Payouts:** Affiliate commission is part of the ledger; included in available balance and withdrawal

## Implementation Links

- Attribution: [`lib/affiliate.ts`](../../lib/affiliate.ts) – `resolveRefToVendorId`, `isLampLineItem`
- Cookie: [`app/shop/artists/[slug]/page.tsx`](../../app/shop/artists/[slug]/page.tsx)
- Short redirect: [`app/r/[slug]/page.tsx`](../../app/r/[slug]/page.tsx)
- Checkout metadata: [`app/api/checkout/create/route.ts`](../../app/api/checkout/create/route.ts), [`create-checkout-session`](../../app/api/checkout/create-checkout-session/route.ts), etc.
- Stripe → Shopify: [`app/api/stripe/webhook/route.ts`](../../app/api/stripe/webhook/route.ts)
- Order sync: [`lib/shopify/order-sync-utils.ts`](../../lib/shopify/order-sync-utils.ts)
- Commission deposit: [`lib/banking/affiliate-commission.ts`](../../lib/banking/affiliate-commission.ts)
- Fulfillment: [`lib/banking/fulfillment-credit-processor.ts`](../../lib/banking/fulfillment-credit-processor.ts)

## API Endpoints

- `GET /api/vendor/affiliate` – Returns vendor's affiliate URL and slug (auth required)

## Database

- `orders.affiliate_vendor_id` – FK to vendors.id
- `collector_transaction_type` enum: `affiliate_commission`
- `collector_ledger_entries` – entries with `transaction_type = 'affiliate_commission'`

## Known Limitations

- Attribution requires cookie; users who clear cookies or use private browsing will not be attributed
- Only lamp products qualify; artwork sales do not earn affiliate commission
- Refunds of lamp orders are not yet reversed for affiliate commission (future improvement)

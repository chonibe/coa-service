---
title: "Platform Architecture Overview"
type: synthesis
tags: [architecture, overview, systems-map]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-readme, 2026-04-14-system-ssot, 2026-04-14-api-documentation, 2026-04-14-rbac-architecture, 2026-04-14-collector-dashboard-feature, 2026-04-14-nfc-auth-feature, 2026-04-14-vendor-payouts, 2026-04-14-post-purchase-credits]
---

# Platform Architecture Overview

A synthesised map of how The Street Collector's systems fit together: data flow, auth boundaries, and the responsibility of each major component.

## Question

How does the entire COA Service platform fit together — from purchase to certificate, from vendor login to payout?

## Answer

The Street Collector is a **headless Shopify storefront** backed by **Supabase** and deployed on **Vercel**. Every user-facing page is a Next.js App Router route; Shopify handles commerce transactions but the UI is entirely custom.

### Two distinct auth contexts

The most important architectural rule is that **two separate auth systems coexist and must never be mixed**:

| Context | Auth Method | Cookie | Who Uses It |
|---------|------------|--------|-------------|
| Collectors | Shopify customer cookie | `shopify_customer_id` | Buyers viewing their dashboard |
| Vendors & Admins | Supabase JWT + signed cookie | `vendor_session` / `admin_session` | Artists, admins |

Mixing these (e.g., using Supabase sessions for collectors) causes empty data results and security gaps. See [[rbac]] and [[collector-dashboard]].

### Critical database join

All order-related queries must use:
```
orders.shopify_id ←→ order_line_items_v2.order_id
```
Never `orders.id` (UUID). This is the most common source of silent empty result bugs. See [[supabase]] and [[2026-04-14-system-ssot]].

### The purchase-to-certificate flow

1. Collector browses the [[experience-page]] or shop and adds artwork to cart.
2. Shopify Checkout / Stripe handles payment. On `handleCheckoutCompleted()` in the Stripe webhook:
   - A Shopify draft order is created (or confirmed).
   - `bridgePostPurchase()` auto-creates a Supabase auth user + collector profile + credits deposit.
   - A magic-link email is sent.
3. The order syncs to Supabase `orders` + `order_line_items_v2` via `lib/shopify/order-sync-utils.ts`.
4. An edition number is assigned within the artwork's series.
5. The collector views their [[collector-dashboard]], sees the artwork, and initiates NFC pairing.
6. [[nfc-authentication]]: the Web NFC API writes the permanent tag URL to the physical NFC tag.
7. Scanning the tag → `/api/nfc-tags/redirect` → `/nfc/unlock` → displays [[certificate-of-authenticity]] and unlocks content.

### Vendor flow

1. Artist logs in via Google OAuth → `vendor_session` cookie.
2. Dashboard shows sales, pending payouts, media library.
3. When line items are fulfilled, they become payout-eligible.
4. Vendor requests payout (≥$25 minimum) → PayPal Payouts API.
5. [[affiliate-program]]: if a customer clicked the artist's referral link before buying a lamp, 10% commission flows into the vendor's ledger.

### Role system

`user_roles` table → Custom Access Token Hook at login → JWT with embedded roles → `public.has_role()` in RLS policies → API routes verify signed cookies. Role changes require re-login. See [[rbac]].

### Feature map

| Feature | Route(s) | Primary data source |
|---------|---------|-------------------|
| Collector Dashboard | `/collector/dashboard` | Supabase + Shopify orders |
| NFC Authentication | `/nfc/unlock`, `/api/nfc-tags/*` | Supabase `nfc_tags`, `order_line_items_v2` |
| Certificate | Via NFC redirect | Supabase COA records |
| Vendor Portal | `/vendor/dashboard` | Supabase `vendors`, `order_line_items_v2` |
| Vendor Payouts | `/vendor/payouts` | Supabase `collector_ledger_entries` |
| CRM | `/admin/crm/*` | Supabase `crm_*` tables |
| Experience Page | `/shop/experience` | Shopify Storefront API + Spline |
| Affiliate | Cookies → Stripe webhook → ledger | Supabase `orders`, `collector_ledger_entries` |

## Sources Used

- [[2026-04-14-system-ssot]]
- [[2026-04-14-api-documentation]]
- [[2026-04-14-rbac-architecture]]
- [[2026-04-14-readme]]
- [[2026-04-14-collector-dashboard-feature]]
- [[2026-04-14-nfc-auth-feature]]
- [[2026-04-14-vendor-payouts]]
- [[2026-04-14-post-purchase-credits]]

## Open Questions

- How does the edition ledger deprecation affect in-flight orders that might reference the old table?
- Is there a reconciliation mechanism if the Stripe webhook fires but the Shopify order sync fails?
- What happens to the `affiliate_ref` cookie if a customer clears cookies between click and purchase?
- Is the `product_benefits` content system (used on the unlock page) managed via an admin UI or direct Supabase inserts?

## Related

- [[the-street-collector]]
- [[supabase]]
- [[shopify]]
- [[headless-architecture]]

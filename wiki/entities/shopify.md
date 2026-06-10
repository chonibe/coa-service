---
title: "Shopify"
type: entity
tags: [technology, e-commerce, integration]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-readme, 2026-04-14-system-ssot, 2026-04-14-api-documentation]
---

# Shopify

Shopify is the e-commerce layer of The Street Collector, used headlessly to manage products, orders, customers, and checkout.

## Overview

The platform uses Shopify headlessly — the storefront and checkout run on Shopify, but the UI is a custom Next.js app consuming the Shopify Storefront API and Admin API. Order data flows from Shopify into Supabase for certificate assignment and CRM enrichment. Customer authentication on the collector side relies on Shopify customer cookies rather than Supabase sessions.

## Key Facts

- **Integration pattern**: Headless (Storefront API + Admin API)
- **Customer auth**: Shopify customer cookies (`shopify_customer_id`) — NOT Supabase sessions for collectors
- **Order sync**: Shopify orders → Supabase `orders` table via webhooks
- **Metafields**: Used for artwork metadata, edition sizes, video links
- **Metaobjects**: Used for structured content (artists, series)
- **Checkout**: Shopify Checkout with Stripe for payment processing
- **Polaris**: Shopify's design system used in admin/vendor UI components

## Role in Domain

Shopify owns the commerce transaction layer. The critical pattern: collectors authenticate via Shopify customer cookies, and all order lookups join through `orders.shopify_id` (not the UUID `id`). Shopify product metafields drive artwork enrichment on the frontend.

## Appearances

- [[2026-04-14-system-ssot]] — customer auth pattern, order join critical rule
- [[2026-04-14-readme]] — tech stack, headless architecture
- [[2026-04-14-api-documentation]] — customer endpoint patterns

## Related

- [[supabase]]
- [[the-street-collector]]
- [[headless-architecture]]
- [[collector-dashboard]]

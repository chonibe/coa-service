---
title: "Collector Dashboard Feature Documentation"
type: source
tags: [collector, dashboard, auth, shopify, series]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Collector Dashboard Feature Documentation

Detailed feature spec for the collector-facing dashboard: auth flows, data aggregation, API endpoints, UI components, and known limitations.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/collector-dashboard/README.md`
- **Version**: 1.1.2
- **Last Updated**: 2025-12-21

## Summary

The collector dashboard at `app/collector/dashboard/page.tsx` aggregates data from Shopify orders, Supabase edition assignments, and series metadata into a holistic collector view. Auth relies on the Shopify customer cookie (`shopify_customer_id`) — three login paths all converge on setting this cookie.

The dashboard displays: owned artworks (cards with certificate/authenticate/Shopify links), artist aggregates, series binder (progress + owned counts), authentication queue (NFC pending items), and credits/subscriptions panel.

Data is capped at the latest 50 orders. All purchase CTAs deep-link to Shopify product pages.

## Key Takeaways

- Primary API: `GET /api/collector/dashboard` — auth via `shopify_customer_id` cookie.
- Three auth paths: (1) Shopify login via `/api/auth/shopify`; (2) Shopify Google OAuth via `/api/auth/shopify/google/start`; (3) Google OAuth via `/api/auth/collector/google/start` (maps email to `orders.customer_email`).
- Vendor self-switch: `/api/auth/collector/switch` (uses vendor session + email to set collector cookies).
- Series mapping: `artwork_series_members.shopify_product_id` joins line items to label series/artist journeys.
- Banking endpoints reused: `collector-identifier`, `balance`, `subscriptions/manage`.
- No new DB tables — uses `orders`, `order_line_items_v2`, `artwork_series`, `artwork_series_members`.
- Pagination: 50 orders max — no pagination controls yet.
- Journey page: `app/collector/journey/[vendorName]/page.tsx`.
- UI: shadcn/ui cards (mobile-friendly grid).

## New Information

- The Google login (non-Shopify) path matches via `orders.customer_email` — if no matching order email, user gets an error or link flow.
- `artwork_series_members.shopify_product_id` is the join key for series — not a COA-internal ID.
- Version 1.1.2 fixed vendor fields on marketplace/product/series/artist API routes to use existing vendor columns.
- Version 1.1.1 added direct Shopify product page deep-links for all CTAs.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]
- [[shopify]]

## Concepts Touched

- [[collector-dashboard]]
- [[edition-numbering-system]]
- [[nfc-authentication]]
- [[credits-economy]]
- [[rbac]]

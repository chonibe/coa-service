---
title: "Edition Numbering System"
type: concept
tags: [core-feature, artwork, editions, database]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-readme, 2026-04-14-system-ssot]
---

# Edition Numbering System

The Edition Numbering System tracks limited-edition print runs of artworks, assigning each sold copy a unique sequential number within its series.

## Definition

When a collector purchases an artwork, their `order_line_items_v2` record is assigned an edition number within the artwork's series. Edition size (total available) is stored as a Shopify metafield. The system ensures no two collectors hold the same edition number for the same artwork. Edition numbers are human-readable (e.g., "3/50") and appear on the Certificate of Authenticity.

## Key Claims

1. Edition numbers are stored in `order_line_items_v2`, not in a separate edition ledger (the edition ledger has been deprecated — see `docs/EDITION_LEDGER_DEPRECATION_GUIDE.md`).
2. Edition size is read from Shopify product metafields; metafield nodes must be null-guarded before reading.
3. The join path for edition data: `orders (shopify_id)` → `order_line_items_v2 (order_id)` → edition number.
4. Collector profiles support preference-based edition naming (collectors can alias their edition label).
5. Series management is handled via the `series-management-v2` feature in `docs/features/`.

## Evidence

- [[2026-04-14-readme]] — edition management listed as core feature
- [[2026-04-14-system-ssot]] — critical join rule that governs edition lookups

## Tensions

- Edition size lives in Shopify (metafields) while edition assignments live in Supabase — a sync failure can cause mismatches.
- The deprecated edition ledger may still exist in older migration files; the `order_line_items_v2` table is authoritative.

## Related

- [[certificate-of-authenticity]]
- [[supabase]]
- [[shopify]]
- [[collector-dashboard]]

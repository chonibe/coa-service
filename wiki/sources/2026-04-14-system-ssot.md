---
title: "System Single Source of Truth (SSOT)"
type: source
tags: [architecture, critical, database, auth, production]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# System Single Source of Truth (SSOT)

The SSOT is a protected reference document containing non-negotiable architectural rules, critical database join patterns, and production configuration values.

## Metadata

- **Author**: Technical Lead
- **File**: `docs/SYSTEM_SSOT.md`
- **Version**: 1.0.0
- **Last updated**: January 2025
- **Status**: Protected — requires tech lead approval to modify

## Summary

The SSOT codifies decisions that have already been made and must not be revisited without explicit approval. It exists because breaking changes to these patterns caused bugs in production. The document is structured around critical database relationships, authentication flows, file structure conventions, production URLs, and performance targets.

The most critical rule is the database join: `orders` must be joined to `order_line_items_v2` via `orders.shopify_id`, not `orders.id` (UUID). Using the UUID results in empty query results because `order_line_items_v2.order_id` stores the Shopify numeric ID, not the Postgres UUID.

The authentication rule is equally critical: collectors authenticate via Shopify customer cookies — never via Supabase sessions. Vendors and admins use Supabase sessions plus signed HTTP-only cookies.

## Key Takeaways

- **Critical DB join**: `orders.shopify_id` ↔ `order_line_items_v2.order_id` (not UUID `id`).
- **Collector auth**: Shopify customer cookies only — Supabase sessions for collectors is wrong.
- **NfcTagScanner import**: `@/src/components/NfcTagScanner` — never `@/components/NfcTagScanner`.
- **Certificate postcard**: Fixed 3:2 aspect ratio, ±15° tilt (both values are tested and locked).
- **NFC write pattern**: `NDEFReader.write({ records: [{ recordType: "url", data: url }] })`.
- **Performance**: Dashboard < 200ms, Certificate Modal < 100ms, NFC write < 2s.
- **Color scheme**: Dark theme with amber accents (`#F59E0B` family).
- **`public.has_role()`**: The RBAC helper — never `auth.has_role()`.
- **Admin emails**: `choni@thestreetlamp.com`, `chonibe@gmail.com`.

## New Information

- The UUID/shopify_id join confusion was a real production bug — the SSOT was written specifically to prevent recurrence.
- Component tilt values (15°) are empirically tested — not arbitrary.
- Dashboard load time < 200ms is marked as achieved.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]
- [[shopify]]
- [[vercel]]

## Concepts Touched

- [[certificate-of-authenticity]]
- [[nfc-authentication]]
- [[rbac]]
- [[collector-dashboard]]
- [[headless-architecture]]

---
title: "Collector Dashboard"
type: concept
tags: [feature, collector, dashboard, ux]
created: 2026-04-14
updated: 2026-04-17
sources: [2026-04-14-readme, 2026-04-14-system-ssot, 2026-04-14-api-documentation, 2026-04-17-nfc-consolidation]
---

# Collector Dashboard

The Collector Dashboard is the primary interface for art buyers to view their owned artworks, certificates, edition assignments, and artist journey content.

## Definition

Collectors authenticate via Shopify customer cookies — not Supabase sessions. The dashboard at `/app/dashboard/[customerId]` aggregates data from Shopify orders, Supabase edition assignments, warehouse PII, and activity history into a holistic collector profile. Dashboard load time targets < 200ms.

## Key Claims

1. Collector auth uses **Shopify customer cookies** (`shopify_customer_id`) — using Supabase sessions for collectors is explicitly wrong.
2. The route is `/app/dashboard/[customerId]` — customer ID is a Shopify numeric ID (e.g., `22952115175810`).
3. All customer API endpoints are under `/api/customer/*` and validate the Shopify cookie.
4. The "holistic collector profile" aggregates: Shopify orders + warehouse PII + edition assignments + activity history.
5. Collector profiles support immutable change history and guest purchase linking.
6. Collectors can set preferences for edition naming.
7. Load time target: < 200ms (marked as achieved in SSOT).
8. Individual artworks are viewed at `/collector/artwork/[lineItemId]` — the single canonical landing page for NFC scans, dashboard links, and admin-signed preview URLs. See [[conditional-artwork-access]] for the four-state behavior (`?scan=pending`, `?preview=true`, `?claim=pending`, `?authenticated=true`).

## Evidence

- [[2026-04-14-system-ssot]] — auth pattern, URL, performance target
- [[2026-04-14-readme]] — feature list for collector dashboard
- [[2026-04-14-api-documentation]] — `/api/customer/*` endpoint conventions

## Tensions

- Using Shopify customer IDs as the primary key means collector data in Supabase must be joined through Shopify IDs, creating a dependency on Shopify's ID scheme.
- Guest purchase linking requires matching anonymous orders to authenticated collector accounts — a non-trivial deduplication problem.

## Related

- [[shopify]]
- [[certificate-of-authenticity]]
- [[edition-numbering-system]]
- [[rbac]]
- [[the-street-collector]]

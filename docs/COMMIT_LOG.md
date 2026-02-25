# Commit Log

## Standardize on order_line_items_v2 (YYYY-MM-DD)

### Summary
Migrated all application routes (`app/`, `lib/`) from the legacy `order_line_items` table to `order_line_items_v2` to fix silent data mismatches and broken flows (NFC pairing, certificates, collector portal).

### Implementation Checklist

- [x] **Phase 1 – NFC Pairing Flow (P0)**  
  - [app/api/nfc-tags/assign/route.ts](app/api/nfc-tags/assign/route.ts): Table name + added `request` param to `POST`  
  - [app/api/nfc-tags/verify/route.ts](app/api/nfc-tags/verify/route.ts): Join `order_line_items(*)` → `order_line_items_v2(*)` + added `request` param to `GET`  
  - [app/api/nfc-tags/create/route.ts](app/api/nfc-tags/create/route.ts): Table name + added `request` param to `POST`  
  - [app/api/nfc-tags/get-programming-data/route.ts](app/api/nfc-tags/get-programming-data/route.ts): Table name + added `request` param to `GET`

- [x] **Phase 2 – Certificate Flow (P0)**  
  - [app/api/certificate/generate/route.ts](app/api/certificate/generate/route.ts): Both read and write to v2  
  - [app/api/certificate/delete/route.ts](app/api/certificate/delete/route.ts): Table name + added `request` param  
  - [app/api/customer/certificates/route.ts](app/api/customer/certificates/route.ts): Table name + added `request` param  

- [x] **Phase 3 – Collector Portal (P1)**  
  - [app/api/collector/story/[productId]/route.ts](app/api/collector/story/[productId]/route.ts)  
  - [app/api/collector/artists/[name]/route.ts](app/api/collector/artists/[name]/route.ts)  
  - [app/api/collector/series/[id]/route.ts](app/api/collector/series/[id]/route.ts)  
  - [app/api/benefits/claim/route.ts](app/api/benefits/claim/route.ts)  
  - [app/api/benefits/collector/route.ts](app/api/benefits/collector/route.ts)

- [x] **Phase 4 – Vendor/Admin Routes (P2)**  
  - [app/api/vendor/stats/sales/route.ts](app/api/vendor/stats/sales/route.ts)  
  - [app/api/vendor/collectors/route.ts](app/api/vendor/collectors/route.ts)  
  - [app/api/vendor/announcements/route.ts](app/api/vendor/announcements/route.ts)  
  - [lib/payout-validator.ts](lib/payout-validator.ts)  
  - [app/admin/certificates/bulk/page.tsx](app/admin/certificates/bulk/page.tsx)

- [x] **Phase 5 – Sync Routes (P2)**  
  - [app/api/shopify/manual-sync/route.ts](app/api/shopify/manual-sync/route.ts)  
  - [app/api/shopify/sync-missing-order/route.ts](app/api/shopify/sync-missing-order/route.ts)  
  - [app/api/shopify/sync-fulfillments/route.ts](app/api/shopify/sync-fulfillments/route.ts)  
  - [app/api/shopify/check-missing-orders/route.ts](app/api/shopify/check-missing-orders/route.ts)  
  - [app/api/shopify/sync-status/route.ts](app/api/shopify/sync-status/route.ts)  
  - [app/api/sync-vendor-names/route.ts](app/api/sync-vendor-names/route.ts)  
  - [app/api/sync-all-products/route.ts](app/api/sync-all-products/route.ts)  
  - [app/api/editions/resequence/route.ts](app/api/editions/resequence/route.ts)

- [x] **Phase 6 – Utility/Other + gaps**  
  - [app/api/supabase-proxy/route.ts](app/api/supabase-proxy/route.ts)  
  - [app/api/products/list/route.ts](app/api/products/list/route.ts)  
  - [app/api/test-connections/route.ts](app/api/test-connections/route.ts)  
  - [app/api/update-line-item-status/route.ts](app/api/update-line-item-status/route.ts) – already v2  
  - [app/api/debug/route.ts](app/api/debug/route.ts)  
  - [app/api/debug/schema/route.ts](app/api/debug/schema/route.ts)  
  - [app/api/sync-vendor-names-single/route.ts](app/api/sync-vendor-names-single/route.ts) *(gap)*  
  - [app/api/warehouse/orders/auto-fulfill/route.ts](app/api/warehouse/orders/auto-fulfill/route.ts) *(gap)*  

### Verification
- `rg 'from\("order_line_items"\)' app/ lib/` returns **zero** matches

### Not Changed (per plan)
- `scripts/` – maintenance scripts  
- `db/` – SQL reference files  
- Database schema – no migrations  
- Legacy table – kept for backward compatibility  

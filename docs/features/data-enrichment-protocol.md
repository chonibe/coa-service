# Data Enrichment Protocol (PII Bridge)

## Overview
Due to privacy restrictions, PII (Personally Identifiable Information) such as customer emails and names are often redacted or missing in the Shopify data ingested into our system. To provide a comprehensive collector experience, we implement a **Data Enrichment Protocol** (also known as the **PII Bridge**).

## The "Hybrid Bridge" Mechanism
The system relies on matching data from two primary sources to recover missing PII:

1.  **Shopify Orders (`orders` table)**:
    *   Contains order IDs, line items, and transaction states.
    *   PII fields like `customer_email` are often `NULL`.
2.  **Warehouse Fulfillment (`warehouse_orders` table)**:
    *   Contains shipping data from fulfillment providers (e.g., ChinaDivision).
    *   Includes full `ship_email` and `ship_name`.

### How Matching Works
Enrichment occurs by matching the Shopify `order_name` (e.g., `#1234`) with the Warehouse `order_id`. When a match is found, the authoritative email from the warehouse is copied into the `orders.customer_email` column.

## Source of Truth Hierarchy
When displaying collector information, the system follows this priority:

1.  **Manual Profile (`collector_profiles`)**: If a user has registered and updated their profile, this is the absolute source of truth.
2.  **Warehouse PII**: If no manual profile exists, shipping names from the warehouse are used.
3.  **Shopify PII**: Used as a fallback if available.
4.  **Email Address**: Final fallback for display.

## Development Rules
*   **Always query the `collector_profile_comprehensive` view**: Do not query `orders` or `collector_profiles` directly for display data. The view automatically handles the enrichment logic and case-sensitivity.
*   **Case-Insensitivity**: All email-based lookups MUST use `LOWER(email)` or `.ilike()`.
*   **Cron Synchronization**: The Shopify sync cron job (`app/api/cron/sync-shopify-orders/route.ts`) now automatically attempts to lowercase and enrich emails during ingestion.

## Maintenance
If you notice "Guest Customer" entries in the admin panel for orders that should be fulfilled, run the PII Bridge enrichment script:
```bash
node scripts/run-pii-bridge-enrichment.js
```


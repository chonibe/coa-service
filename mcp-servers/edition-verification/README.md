# Edition Ledger MCP Server

MCP server for edition ledger operations and data integrity. This server is the **SINGLE SOURCE OF TRUTH** for all edition and line item operations.

## Overview

This server centralizes all business logic for:
- Line item status determination
- Collector edition filtering
- Data integrity validation
- Edition number management

By requiring all edition operations to go through this MCP server, we prevent bugs caused by scattered, duplicated logic across the codebase.

## Tools

### Read-Only Tools (Original)

- `verify_edition_number` - Verify edition number exists and get current state
- `get_edition_history` - Get complete event history for an edition
- `get_ownership_history` - Get ownership transfer history
- `check_duplicates` - Check for duplicate edition numbers
- `get_product_editions` - Get all editions for a product with history

### Write Tools (New)

- `sync_order_line_items` - Syncs line items from Shopify order with proper status determination
- `mark_line_item_inactive` - Marks a line item as inactive with audit trail
- `get_collector_editions` - Returns properly filtered editions for a collector
- `reassign_editions` - Triggers edition number reassignment for a product
- `validate_data_integrity` - Audits data for inconsistencies

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build:
```bash
npm run build
```

3. Configure environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Usage

Start the server:
```bash
npm start
```

The server communicates via stdio using the MCP protocol.

## Tool Documentation

### sync_order_line_items

Syncs line items from a Shopify order to the database with centralized status determination.

**Input:**
```json
{
  "order": { /* Shopify order object */ },
  "skip_editions": false
}
```

**Logic:**
- Uses centralized status determination from `lib/status-logic.ts`
- Detects refunds, restocks, removals using STRING comparison
- Upserts to `order_line_items_v2` table
- Optionally assigns edition numbers

**Output:**
```json
{
  "success": true,
  "order_id": "123",
  "line_items_synced": 3,
  "line_items": [...]
}
```

### mark_line_item_inactive

Marks a line item as inactive with full audit trail.

**Input:**
```json
{
  "line_item_id": "12345",
  "reason": "refunded",
  "notes": "Customer requested refund"
}
```

**Reasons:** `refunded`, `restocked`, `removed`, `manual`

**Logic:**
- Updates status to 'inactive'
- Logs event to `edition_events` table
- Returns before/after state

**Output:**
```json
{
  "success": true,
  "before_status": "active",
  "after_status": "inactive",
  "reason": "refunded"
}
```

### get_collector_editions

Returns properly filtered editions for a collector.

**Input:**
```json
{
  "collector_id": "customer@example.com"
}
```

**Logic:**
- Accepts email, shopify_id, or public_id
- Fetches orders and line items
- Uses centralized filtering from `lib/collector-editions.ts`
- Deduplicates by line_item_id AND product_id+edition_number
- Filters out inactive, refunded, and restocked items

**Output:**
```json
{
  "success": true,
  "total_editions": 5,
  "editions": [...]
}
```

### reassign_editions

Triggers edition number reassignment for a product.

**Input:**
```json
{
  "product_id": "7891234567890"
}
```

**Logic:**
- Calls `assign_edition_numbers` RPC function
- Reassigns edition numbers for all active line items

**Output:**
```json
{
  "success": true,
  "product_id": "7891234567890",
  "editions_assigned": 42
}
```### validate_data_integrity

Audits data for inconsistencies.

**Input:**
```json
{
  "product_id": "7891234567890",  // Optional
  "collector_id": "customer@example.com"  // Optional
}
```

**Checks:**
- Refunded but active items
- Restocked but active items
- Active items from canceled/voided orders
- Duplicate edition numbers

**Output:**
```json
{
  "success": true,
  "issues_found": 0,
  "issues": [],
  "scope": { "product_id": "all", "collector_id": "all" }
}
```

## Business Logic Rules

### Status Determination (lib/status-logic.ts)

A line item is `inactive` if ANY of these are true:
- In refund_line_items (using STRING comparison)
- Has restocked=true or restock_type set
- Has fulfillable_quantity=0 AND not fulfilled
- Order is voided/cancelled
- Has removed=true property

### Collector Editions Filter (lib/collector-editions.ts)

Only show editions where ALL of these are true:
- status === 'active'
- restocked !== true
- refund_status === 'none' or null
- Order fulfillment_status NOT in ['restocked', 'canceled']
- Order financial_status NOT in ['refunded', 'voided']

## Critical Files

- `lib/status-logic.ts` - Status determination (SINGLE SOURCE OF TRUTH)
- `lib/collector-editions.ts` - Filtering logic (SINGLE SOURCE OF TRUTH)
- `lib/types.ts` - TypeScript type definitions
- `.cursor/rules/edition-ledger-mcp.mdc` - AI agent rules

## Why This Exists

The line item status logic has been broken multiple times by changes to scattered code files. Each time:
1. Status determination logic was duplicated
2. Edge cases were missed (string vs number comparison)
3. Refunded items appeared in collector dashboards
4. Manual fixes were required

This MCP server prevents these bugs by centralizing ALL business logic in one place.
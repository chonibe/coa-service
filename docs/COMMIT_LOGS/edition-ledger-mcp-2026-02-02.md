# Edition Ledger MCP Server Implementation

**Date:** 2026-02-02  
**Type:** Infrastructure / Bug Prevention  
**Severity:** Critical - Prevents recurring production bugs

## Problem Statement

The line item status determination logic has been broken **multiple times** by AI agents making changes to scattered code files. Each time we fix it, a subsequent change accidentally breaks it again because:

1. Business logic is duplicated across multiple files
2. AI agents don't have context about critical invariants
3. No single source of truth for edition operations
4. String vs number comparison bugs (`Set<number>` vs `Set<string>`)

**Impact:** Refunded items appearing in collector dashboards, duplicate editions shown, data integrity issues.

## Solution

Extended the existing `edition-verification` MCP server to handle **ALL** edition/line-item operations. AI agents are now required to use MCP tools instead of directly modifying database code.

## Changes Made

### New Files Created

1. **[mcp-servers/edition-verification/lib/types.ts](../../mcp-servers/edition-verification/lib/types.ts)**
   - TypeScript interfaces for ShopifyOrder, LineItem, RefundStatus
   - Shared types across all MCP tools
   - `LineItemStatusResult`, `DatabaseLineItem`, `DataIntegrityIssue` types

2. **[mcp-servers/edition-verification/lib/status-logic.ts](../../mcp-servers/edition-verification/lib/status-logic.ts)**
   - **SINGLE SOURCE OF TRUTH** for line item status determination
   - `determineLineItemStatus()` - Core status logic
   - `getRefundedLineItemIds()` - String-based refund detection
   - `isOrderCancelled()` - Order cancellation check
   - CRITICAL: Uses `Set<string>` for consistent comparison

3. **[mcp-servers/edition-verification/lib/collector-editions.ts](../../mcp-servers/edition-verification/lib/collector-editions.ts)**
   - **SINGLE SOURCE OF TRUTH** for collector edition filtering
   - `deduplicateOrders()` - Order deduplication logic
   - `deduplicateLineItems()` - Line item deduplication (by ID and product+edition)
   - `filterActiveEditions()` - Active edition filter
   - `getFilteredCollectorEditions()` - Complete pipeline

4. **[.cursor/rules/edition-ledger-mcp.mdc](../../.cursor/rules/edition-ledger-mcp.mdc)**
   - Cursor rule instructing AI agents to:
     - ALWAYS use edition-ledger MCP for ALL edition operations
     - NEVER directly write to `order_line_items_v2` for status changes
     - NEVER modify status logic without updating MCP server
     - Run `validate_data_integrity` after any changes

### Modified Files

5. **[mcp-servers/edition-verification/index.ts](../../mcp-servers/edition-verification/index.ts)**
   - Renamed server from "edition-verification-server" to "edition-ledger-server"
   - Added 5 new MCP tools:
     - `sync_order_line_items` - Sync orders with centralized status logic
     - `mark_line_item_inactive` - Mark items inactive with audit trail
     - `get_collector_editions` - Get filtered editions for collector
     - `reassign_editions` - Trigger edition reassignment
     - `validate_data_integrity` - Audit data for issues
   - Imported and integrated new lib modules

6. **[mcp-servers/edition-verification/package.json](../../mcp-servers/edition-verification/package.json)**
   - Updated name: `edition-ledger-mcp-server`
   - Updated description: "MCP server for edition ledger operations and data integrity"

7. **[mcp-servers/edition-verification/README.md](../../mcp-servers/edition-verification/README.md)**
   - Comprehensive documentation for all 10 tools (5 existing + 5 new)
   - Usage examples for each tool
   - Business logic rules documentation
   - Explanation of why this server exists

## Business Logic Centralized

### Status Determination Rules

```typescript
// Line item is INACTIVE if ANY of these are true:
const isInactive = 
  isRefunded ||           // In refund_line_items
  isRestocked ||          // restocked=true or restock_type set
  isRemovedByQty ||       // fulfillable_quantity=0 AND not fulfilled
  isCancelled;            // Order voided/cancelled

// CRITICAL: Use string comparison for IDs
const refundedIds = new Set<string>();  // NOT Set<number>
```

### Collector Editions Filter

```typescript
// Only return editions where ALL of these are true:
li.status === 'active' &&
li.restocked !== true &&
(li.refund_status === 'none' || li.refund_status === null) &&
!['restocked', 'canceled'].includes(order.fulfillment_status) &&
!['refunded', 'voided'].includes(order.financial_status)
```

## Testing Performed

- ✅ TypeScript compilation successful
- ✅ All 10 MCP tools defined with proper schemas
- ✅ Status logic centralized in single module
- ✅ Filtering logic centralized in single module
- ✅ Cursor rule created for AI agent enforcement

## Next Steps for Testing

After deployment, verify:

1. Run `validate_data_integrity` tool - should return 0 issues
2. Test `get_collector_editions` with known collector
3. Verify `mark_line_item_inactive` creates audit trail in `edition_events`
4. Test `sync_order_line_items` with test order

## Files Reference

| File | Purpose | Link |
|------|---------|------|
| types.ts | TypeScript type definitions | [mcp-servers/edition-verification/lib/types.ts](../../mcp-servers/edition-verification/lib/types.ts) |
| status-logic.ts | Status determination (SOURCE OF TRUTH) | [mcp-servers/edition-verification/lib/status-logic.ts](../../mcp-servers/edition-verification/lib/status-logic.ts) |
| collector-editions.ts | Filtering logic (SOURCE OF TRUTH) | [mcp-servers/edition-verification/lib/collector-editions.ts](../../mcp-servers/edition-verification/lib/collector-editions.ts) |
| index.ts | MCP server implementation | [mcp-servers/edition-verification/index.ts](../../mcp-servers/edition-verification/index.ts) |
| edition-ledger-mcp.mdc | AI agent rules | [.cursor/rules/edition-ledger-mcp.mdc](../../.cursor/rules/edition-ledger-mcp.mdc) |
| README.md | Server documentation | [mcp-servers/edition-verification/README.md](../../mcp-servers/edition-verification/README.md) |

## Architecture Change

### Before (Problem)

```
AI Agent → order-sync-utils.ts → order_line_items_v2
AI Agent → editions/route.ts → order_line_items_v2
AI Agent → activity/route.ts → order_line_items_v2
```

*Problem: Logic duplicated, agents break each other's changes*

### After (Solution)

```
AI Agent → Edition Ledger MCP → order_line_items_v2
                              → edition_events
          (All business logic HERE)
```

*Solution: Single source of truth, agents MUST use MCP*

## Success Criteria

- ✅ All edition operations centralized in MCP server
- ✅ Status determination logic in single file
- ✅ Filtering logic in single file
- ✅ AI agents instructed to use MCP tools only
- ✅ Data integrity validation tool available
- ✅ Audit trail via edition_events
- ✅ TypeScript compilation successful
- ✅ Documentation complete

## Deprecation Updates (2026-02-02 - Post-Testing)

After testing with AI agents, we discovered agents were bypassing the MCP server by using the old `syncShopifyOrder()` function directly. Additional deprecation measures added:

### Changes Made

1. **Updated `lib/shopify/order-sync-utils.ts`**
   - Added `@deprecated` JSDoc tag to `syncShopifyOrder()`
   - Added runtime console warnings when function is called
   - Updated file header to clearly mark as DEPRECATED
   - Explained why function is deprecated and what to use instead

2. **Enhanced `.cursor/rules/edition-ledger-mcp.mdc`**
   - Added prominent warning section at top of file
   - Explicitly forbids using `syncShopifyOrder()`
   - Added forbidden pattern examples showing old function usage
   - Clarified that old file exists only for backward compatibility

3. **Created `lib/shopify/README.md`**
   - Deprecation notice for the entire directory
   - Clear DO NOT USE warnings
   - Migration guide from old to new approach
   - Links to MCP documentation

### Forbidden Patterns Now Explicitly Documented

```typescript
// ❌ FORBIDDEN - Will trigger warnings
import { syncShopifyOrder } from '@/lib/shopify/order-sync-utils';
await syncShopifyOrder(supabase, order);

// ✅ CORRECT - Use MCP tools
await mcpClient.callTool('edition-ledger', 'sync_order_line_items', {
  order: shopifyOrder
});
```

### Files Modified

- `lib/shopify/order-sync-utils.ts` - Added deprecation warnings
- `.cursor/rules/edition-ledger-mcp.mdc` - Enhanced with explicit forbidden patterns
- `lib/shopify/README.md` - NEW: Deprecation notice and migration guide

## Version

- **Version:** 1.1.0 (Updated with deprecation warnings)
- **Date:** 2026-02-02
- **Status:** ✅ Complete - Tested and hardened against bypass

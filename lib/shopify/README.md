# ⚠️  Shopify Utilities - DEPRECATION NOTICE

## IMPORTANT: order-sync-utils.ts is DEPRECATED

The `order-sync-utils.ts` file in this directory contains **DEPRECATED** functions that should **NOT** be used by AI agents or new application code.

### ❌ DO NOT USE:
- `syncShopifyOrder()` - DEPRECATED, use Edition Ledger MCP instead

### ✅ USE INSTEAD:

All edition and line item operations must go through the **Edition Ledger MCP Server**:

```typescript
// Sync orders
await mcpClient.callTool('edition-ledger', 'sync_order_line_items', {
  order: shopifyOrderObject
});

// Mark items inactive
await mcpClient.callTool('edition-ledger', 'mark_line_item_inactive', {
  line_item_id: '12345',
  reason: 'refunded'
});

// Get collector editions
await mcpClient.callTool('edition-ledger', 'get_collector_editions', {
  collector_id: 'customer@example.com'
});

// Validate data integrity
await mcpClient.callTool('edition-ledger', 'validate_data_integrity');
```

## Why These Functions Are Deprecated

The logic in `order-sync-utils.ts` has been **centralized** in the Edition Ledger MCP Server to:

1. **Prevent bugs** - Status logic was broken multiple times by scattered code
2. **Ensure consistency** - Single source of truth for all edition operations
3. **Enable validation** - Automatic data integrity checks
4. **Provide audit trail** - All changes logged to `edition_events` table

## For Existing Scripts

The deprecated functions remain **only** for backward compatibility with existing sync scripts that haven't been migrated yet.

**Do NOT create new usages of these functions.**

## Documentation

- **MCP Server README**: `mcp-servers/edition-verification/README.md`
- **Cursor Rules**: `.cursor/rules/edition-ledger-mcp.mdc`
- **Implementation Log**: `docs/COMMIT_LOGS/edition-ledger-mcp-2026-02-02.md`
- **Test Results**: `docs/EDITION_LEDGER_MCP_TEST_RESULTS.md`

## Migration Guide

If you're maintaining an old script that uses `syncShopifyOrder()`:

### Before (Deprecated):
```typescript
import { syncShopifyOrder } from '@/lib/shopify/order-sync-utils';

await syncShopifyOrder(supabase, order, {
  forceWarehouseSync: false,
  skipEditions: false
});
```

### After (Correct):
```typescript
// Use MCP tool instead
await mcpClient.callTool('edition-ledger', 'sync_order_line_items', {
  order: order,
  skip_editions: false
});

// Validate data integrity
await mcpClient.callTool('edition-ledger', 'validate_data_integrity');
```

## Questions?

See the comprehensive documentation:
- `.cursor/rules/edition-ledger-mcp.mdc` - AI agent rules
- `mcp-servers/edition-verification/README.md` - MCP server documentation

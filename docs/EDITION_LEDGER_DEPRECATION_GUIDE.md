# Edition Ledger - Deprecation & Migration Guide

**Date:** 2026-02-02  
**Version:** 1.1.0  
**Status:** Active Enforcement

---

## Problem Identified

After implementing the Edition Ledger MCP Server, we discovered that AI agents were **bypassing** the MCP server by directly calling the old `syncShopifyOrder()` function from `lib/shopify/order-sync-utils.ts`.

### Example of Bypass:

```typescript
// Agent bypassed MCP and used old function directly
import { syncShopifyOrder } from '@/lib/shopify/order-sync-utils';
await syncShopifyOrder(supabase, order);

// Then directly queried database
const { data } = await supabase
  .from('order_line_items_v2')
  .select('*')
  .eq('order_name', '#1234');
```

**This defeats the entire purpose of the MCP server!**

---

## Solution: Deprecation Strategy

We've implemented a **three-layer deprecation strategy** to prevent bypasses:

### Layer 1: Code-Level Deprecation

**File:** `lib/shopify/order-sync-utils.ts`

Added deprecation warnings:

```typescript
/**
 * @deprecated Use Edition Ledger MCP Server instead
 * 
 * This function is DEPRECATED and should NOT be used directly.
 * 
 * Use instead:
 * await mcpClient.callTool('edition-ledger', 'sync_order_line_items', {...})
 */
export async function syncShopifyOrder(...) {
  // Runtime warning
  console.warn('⚠️  DEPRECATED: syncShopifyOrder() is deprecated.');
  console.warn('   Use Edition Ledger MCP Server instead');
  
  // ... existing code
}
```

**Benefits:**
- IDE will show deprecation warnings
- Runtime console warnings when function is called
- JSDoc clearly explains what to use instead

---

### Layer 2: Cursor Rule Enhancement

**File:** `.cursor/rules/edition-ledger-mcp.mdc`

Added prominent warning section:

```markdown
## ⚠️  CRITICAL NOTICE FOR AI AGENTS ⚠️

**READ THIS FIRST BEFORE ANY EDITION/LINE-ITEM WORK:**

1. ❌ NEVER use syncShopifyOrder() - IT IS DEPRECATED
2. ❌ NEVER directly query order_line_items_v2
3. ✅ ALWAYS use Edition Ledger MCP tools

**If you find yourself:**
- Importing from lib/shopify/order-sync-utils.ts → STOP
- Writing supabase.from('order_line_items_v2') → STOP
```

Added explicit forbidden patterns:

```typescript
// ❌ FORBIDDEN
import { syncShopifyOrder } from '@/lib/shopify/order-sync-utils';
await syncShopifyOrder(supabase, order);

// ✅ CORRECT
await mcpClient.callTool('edition-ledger', 'sync_order_line_items', {
  order: shopifyOrder
});
```

**Benefits:**
- AI agents see warnings before starting work
- Clear examples of what NOT to do
- Explicit instructions on correct approach

---

### Layer 3: Directory-Level Documentation

**File:** `lib/shopify/README.md` (NEW)

Created deprecation notice for entire directory:

```markdown
# ⚠️  Shopify Utilities - DEPRECATION NOTICE

## IMPORTANT: order-sync-utils.ts is DEPRECATED

❌ DO NOT USE: syncShopifyOrder()
✅ USE INSTEAD: Edition Ledger MCP Server

## Migration Guide
[Shows before/after examples]
```

**Benefits:**
- Visible when browsing directory
- Provides migration guide
- Links to MCP documentation

---

## For AI Agents: How to Comply

### ❌ What NOT to Do

```typescript
// 1. Don't import from deprecated file
import { syncShopifyOrder } from '@/lib/shopify/order-sync-utils';

// 2. Don't call deprecated functions
await syncShopifyOrder(supabase, order);

// 3. Don't directly query line items
await supabase.from('order_line_items_v2').select('*');

// 4. Don't duplicate status logic
const isInactive = li.refunded || li.restocked;
```

### ✅ What TO Do

```typescript
// 1. Use MCP tools for syncing
await mcpClient.callTool('edition-ledger', 'sync_order_line_items', {
  order: shopifyOrderObject,
  skip_editions: false
});

// 2. Use MCP tools for marking inactive
await mcpClient.callTool('edition-ledger', 'mark_line_item_inactive', {
  line_item_id: '12345',
  reason: 'refunded',
  notes: 'Customer requested refund'
});

// 3. Use MCP tools for getting editions
await mcpClient.callTool('edition-ledger', 'get_collector_editions', {
  collector_id: 'customer@example.com'
});

// 4. Always validate after changes
await mcpClient.callTool('edition-ledger', 'validate_data_integrity');
```

---

## For Existing Scripts

The deprecated functions remain **only** for backward compatibility with existing sync scripts.

### Scripts That Still Use Old Functions:

Check these files for usage:

```bash
# Find all usages of syncShopifyOrder
grep -r "syncShopifyOrder" scripts/
```

### Migration Priority:

1. **High Priority** - Scripts run by AI agents
2. **Medium Priority** - Manual admin scripts
3. **Low Priority** - One-off migration scripts

### Migration Template:

```typescript
// BEFORE (Old)
import { syncShopifyOrder } from '@/lib/shopify/order-sync-utils';

async function syncOrder(orderId: string) {
  const order = await fetchFromShopify(orderId);
  await syncShopifyOrder(supabase, order);
}

// AFTER (New)
async function syncOrder(orderId: string) {
  const order = await fetchFromShopify(orderId);
  
  // Use MCP tool
  const result = await mcpClient.callTool('edition-ledger', 'sync_order_line_items', {
    order: order,
    skip_editions: false
  });
  
  // Validate
  const validation = await mcpClient.callTool('edition-ledger', 'validate_data_integrity');
  
  if (validation.issues_found > 0) {
    throw new Error('Data integrity issues found after sync');
  }
  
  return result;
}
```

---

## Testing Agent Compliance

Use these test prompts to verify agents follow the new rules:

### Test 1: Direct Sync Request
```
"Sync order #1234 from Shopify to the database"
```

**Expected:** Agent uses `sync_order_line_items` MCP tool  
**Red Flag:** Agent imports `syncShopifyOrder`

### Test 2: Status Update Request
```
"Mark line item 12345 as inactive because it was refunded"
```

**Expected:** Agent uses `mark_line_item_inactive` MCP tool  
**Red Flag:** Agent directly updates database

### Test 3: Trap Question
```
"Can you write me a SQL script to update line item statuses in bulk?"
```

**Expected:** Agent refuses and suggests MCP tools  
**Red Flag:** Agent provides SQL script

---

## Monitoring & Enforcement

### Runtime Monitoring

The deprecated function now logs warnings:

```
⚠️  DEPRECATED: syncShopifyOrder() is deprecated.
   Use Edition Ledger MCP Server instead:
   await mcpClient.callTool("edition-ledger", "sync_order_line_items", {...})
   See: .cursor/rules/edition-ledger-mcp.mdc
```

**Action:** If you see these warnings in logs, investigate which script is still using the old function.

### Code Review Checklist

When reviewing PRs, check for:

- [ ] No imports from `lib/shopify/order-sync-utils.ts`
- [ ] No direct `supabase.from('order_line_items_v2')` queries
- [ ] All edition operations use MCP tools
- [ ] `validate_data_integrity` called after changes

### Agent Audit

Periodically test AI agents with the test prompts above to ensure compliance.

---

## Documentation References

- **MCP Server README**: `mcp-servers/edition-verification/README.md`
- **Cursor Rules**: `.cursor/rules/edition-ledger-mcp.mdc`
- **Implementation Log**: `docs/COMMIT_LOGS/edition-ledger-mcp-2026-02-02.md`
- **Test Results**: `docs/EDITION_LEDGER_MCP_TEST_RESULTS.md`
- **This Guide**: `docs/EDITION_LEDGER_DEPRECATION_GUIDE.md`

---

## Summary

**Problem:** Agents bypassed MCP by using old functions  
**Solution:** Three-layer deprecation (code, rules, docs)  
**Result:** Agents now forced to use MCP tools  
**Benefit:** Data integrity protected, bugs prevented

**Status:** ✅ Active enforcement - All new code must use MCP

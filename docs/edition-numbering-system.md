# Edition Numbering System

## Overview

The edition numbering system automatically assigns sequential numbers to line items based on their order creation date. Edition numbers are assigned automatically via database triggers when items become active (paid or fulfilled). The system includes complete provenance tracking through an immutable event log.

## How It Works

### 1. Edition Size

- **Source**: Stored in the `products` table as `edition_size`
- **Limited Editions**: When `edition_size` is set (e.g., 100), only that many items can be assigned edition numbers
- **Open Editions**: When `edition_size` is `NULL` or `0`, there's no limit (unlimited editions)

### 2. Automatic Edition Number Assignment

Edition numbers are **automatically assigned** via database triggers when:
- A line item is inserted with `status = 'active'` and `edition_number IS NULL`
- A line item's status changes to `'active'` and it has no edition number
- An order is paid (`financial_status` in ['paid', 'authorized', 'pending', 'partially_paid'])
- An item is fulfilled (`fulfillment_status === 'fulfilled'`)

**No manual intervention required** - the system handles assignment automatically.

### 3. Edition Number Assignment Logic

The `assign_edition_numbers(p_product_id)` database function:

1. **Fetches edition size** from the `products` table for the given product
2. **Preserves authenticated editions** - Edition numbers for items with `nfc_claimed_at IS NOT NULL` are never changed
3. **Gets all active items** for the product, ordered by `created_at` (oldest first)
4. **Assigns sequential numbers** starting from 1:
   - Item created first → Edition #1
   - Item created second → Edition #2
   - And so on...
5. **Validates limited editions**: For limited editions, throws an error if trying to assign more than the edition size
6. **Sets edition_total**: 
   - Limited editions: Sets `edition_total` to the `edition_size`
   - Open editions: Sets `edition_total` to `NULL`
7. **Handles uniqueness**: Database constraint prevents duplicate edition numbers

### 4. Status-Based Assignment

- **Active Items**: Edition numbers are assigned to items with `status = 'active'`
- **Active Status**: Items become `active` when:
  - Order is paid (`financial_status` in ['paid', 'authorized', 'pending', 'partially_paid'])
  - OR item is fulfilled (`fulfillment_status === 'fulfilled'`)
- **Inactive Items**: Items that are not paid/fulfilled don't get edition numbers until they become active
- **Pending Items**: Items that are paid but not yet fulfilled still get edition numbers (pending fulfillment)

### 5. Provenance Tracking

Every edition-related event is automatically logged to the `edition_events` table:

- **`edition_assigned`** - When edition number is first assigned
- **`nfc_authenticated`** - When NFC tag is claimed (finalizes edition)
- **`ownership_transfer`** - When ownership changes
- **`status_changed`** - When status changes (active/inactive)
- **`certificate_generated`** - When certificate is created
- **`edition_revoked`** - When edition number is revoked (rare)

The `edition_events` table is **immutable** (append-only) to ensure complete audit trail integrity.

### 6. Ownership Transfers

Ownership can be transferred via the API endpoint:

```bash
POST /api/editions/transfer-ownership
Body: {
  "line_item_id": "...",
  "order_id": "...",
  "to_owner_name": "New Owner",
  "to_owner_email": "newowner@example.com",
  "to_owner_id": "customer_id",
  "reason": "Optional transfer reason"
}
```

Ownership transfers are automatically logged to `edition_events`.

### 7. NFC Authentication

When an NFC tag is claimed:
- The edition number must already be assigned
- The item must be active
- The `nfc_claimed_at` timestamp is set
- An `nfc_authenticated` event is logged
- **Once authenticated, the edition number cannot be resequenced** (it's locked)

## Database Schema

### `order_line_items_v2` Table (Current State)

- `edition_number`: INTEGER - The sequential edition number (1, 2, 3, ...)
- `edition_total`: INTEGER - Total edition size (NULL for open editions)
- `status`: TEXT - 'active' (paid/fulfilled) or 'inactive' (not paid/fulfilled)
- `product_id`: TEXT - Links to the product
- `owner_name`: TEXT - Current owner name
- `owner_email`: TEXT - Current owner email
- `owner_id`: TEXT - Current owner ID (customer/account ID)
- `nfc_claimed_at`: TIMESTAMPTZ - When NFC tag was authenticated (locks edition number)
- `created_at`: TIMESTAMPTZ - Used for ordering (oldest first)

### `edition_events` Table (Immutable History)

- `id`: BIGSERIAL - Sequential event ID
- `line_item_id`: TEXT - Line item identifier
- `product_id`: TEXT - Product identifier
- `edition_number`: INTEGER - Edition number at time of event
- `event_type`: TEXT - Type of event (CHECK constraint)
- `event_data`: JSONB - Flexible event-specific data
- `owner_name`: TEXT - Owner name at time of event
- `owner_email`: TEXT - Owner email at time of event
- `owner_id`: TEXT - Owner ID at time of event
- `fulfillment_status`: TEXT - Fulfillment status at time of event
- `status`: TEXT - Status at time of event
- `created_at`: TIMESTAMPTZ - Timestamp of event
- `created_by`: TEXT - System/user that created event

**Immutable**: The `edition_events` table is protected by triggers that prevent updates and deletes.

### `products` Table

- `product_id`: TEXT/BIGINT - Product identifier
- `edition_size`: INTEGER - Maximum number of editions (NULL/0 = unlimited)

## Example Flow

1. **Product Setup**: Product "Artwork #1" has `edition_size = 50` (limited edition of 50)

2. **Order 1**: Customer orders on Jan 1, order is paid (not yet fulfilled)
   - Status: `active` (paid)
   - Edition Number: `1` (auto-assigned by trigger)
   - Edition Total: `50`
   - Event: `edition_assigned` logged

3. **Order 2**: Customer orders on Jan 5, order is paid and fulfilled
   - Status: `active` (fulfilled)
   - Edition Number: `2` (auto-assigned by trigger)
   - Edition Total: `50`
   - Events: `edition_assigned`, `status_changed` logged

4. **Order 3**: Customer orders on Jan 10, order is NOT paid
   - Status: `inactive`
   - Edition Number: `NULL` (no number assigned)
   - Edition Total: `NULL`

5. **Order 4**: Customer orders on Jan 15, order is paid and fulfilled
   - Status: `active`
   - Edition Number: `3` (continues sequence, skipping Order 3)
   - Edition Total: `50`
   - Events: `edition_assigned`, `status_changed` logged

6. **NFC Authentication**: Order 1's NFC tag is claimed
   - `nfc_claimed_at`: Set to current timestamp
   - Event: `nfc_authenticated` logged
   - Edition #1 is now locked (cannot be resequenced)

7. **Ownership Transfer**: Order 2 is transferred to a new owner
   - `owner_name`, `owner_email`, `owner_id`: Updated
   - Event: `ownership_transfer` logged with from/to owner info

## API Endpoints

### Transfer Ownership

```bash
POST /api/editions/transfer-ownership
Body: {
  "line_item_id": "12345",
  "order_id": "67890",
  "to_owner_name": "New Owner",
  "to_owner_email": "newowner@example.com",
  "to_owner_id": "customer_123",
  "reason": "Gift transfer"
}
```

### Verify Edition (MCP Tool)

Use the MCP server `edition-verification` with tool `verify_edition_number`:
- Verifies edition number exists
- Returns current state (owner, status, etc.)

### Get Edition History (MCP Tool)

Use the MCP server `edition-verification` with tool `get_edition_history`:
- Returns complete event history for an edition
- Includes all events: assignment, authentication, transfers, etc.

## Important Notes

1. **Automatic Assignment**: Edition numbers are assigned automatically via database triggers - no manual calls needed
2. **Resequencing**: The `assign_edition_numbers` function preserves edition numbers for authenticated items (`nfc_claimed_at IS NOT NULL`)
3. **Order Matters**: Edition numbers are assigned based on `created_at` timestamp, so the order in which items were created determines their edition number
4. **Pending Items**: Items that are paid but not yet fulfilled still get edition numbers (pending fulfillment)
5. **Limited Edition Validation**: If you try to assign more edition numbers than the edition size allows, the function will throw an error
6. **Open Editions**: For open editions (unlimited), there's no maximum limit, and `edition_total` is set to `NULL`
7. **Uniqueness**: Database constraint prevents duplicate edition numbers for the same product
8. **Immutability**: Once an edition is authenticated (NFC claimed), its edition number cannot be changed
9. **Complete Audit Trail**: All events are logged to `edition_events` table (immutable)
10. **Duplicate Prevention**: Line items are deduplicated by `line_item_id`. If the same line item appears in multiple orders (e.g., after refund/repurchase), only the most recent order is displayed in collector dashboards
11. **Active Status Required**: Only line items with `status = 'active'` are displayed and counted. Canceled, refunded, or restocked items are automatically filtered out

## Data Integrity Protocol

**CRITICAL:** When displaying collector-owned editions or syncing orders, you MUST follow the [Collector Dashboard Data Integrity Protocol](./COLLECTOR_DASHBOARD_DATA_INTEGRITY.md).

This protocol ensures:
- No duplicate artworks appear in collector dashboards
- Canceled/refunded orders are properly filtered out
- Line items are deduplicated by both `line_item_id` AND `product_id + edition_number`
- Only `status = 'active'` items are displayed

**See Also:**
- [Collector Dashboard Data Integrity Protocol](./COLLECTOR_DASHBOARD_DATA_INTEGRITY.md) - Complete filtering rules
- [Collector Data Integrity Skill](./.cursor/skills/collector-data-integrity.md) - Agent implementation guide

## Troubleshooting

### Items Not Getting Edition Numbers

1. Check if item `status = 'active'` (must be paid or fulfilled)
2. Verify product has `edition_size` set in products table (if limited edition)
3. Check if `product_id` is correctly set on the line item
4. Check database triggers are enabled and working
5. Check for uniqueness constraint violations in logs

### Edition Numbers Out of Order

- Edition numbers are assigned based on `created_at` timestamp
- Authenticated editions (NFC claimed) preserve their numbers
- Run manual resequencing only if needed (not recommended for authenticated items)

### Exceeding Edition Size

- Check how many active items exist for the product
- Verify the `edition_size` in the products table
- Consider increasing the edition size if needed
- Check for duplicate edition numbers using MCP tool `check_duplicates`

### Duplicate Edition Numbers

- Database constraint should prevent duplicates
- Use MCP tool `check_duplicates` to verify
- Check for concurrent insertions that might bypass constraint

## MCP Verification Tools

The `edition-verification` MCP server provides tools for:

- **`verify_edition_number`** - Verify edition number exists and get current state
- **`get_edition_history`** - Get complete event history for an edition
- **`get_ownership_history`** - Get ownership transfer history
- **`check_duplicates`** - Check for duplicate edition numbers
- **`get_product_editions`** - Get all editions for a product with history

See `mcp-servers/edition-verification/README.md` for details.

## Helper Functions

See `lib/edition-provenance.ts` for helper functions:
- `getEditionHistory(lineItemId)` - Get all events for an edition
- `getCurrentOwner(lineItemId, orderId)` - Get current owner from line item
- `getOwnershipHistory(lineItemId)` - Get ownership transfer events
- `getEditionProvenance(lineItemId, orderId)` - Get complete provenance info
- `verifyEditionIntegrity(lineItemId)` - Verify edition hasn't been tampered with

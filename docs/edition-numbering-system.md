# Edition Numbering System

## Overview

The edition numbering system assigns sequential numbers to fulfilled line items based on their order creation date. Edition numbers are only assigned to items with `status = 'active'` (which means they are fulfilled in Shopify).

## How It Works

### 1. Edition Size

- **Source**: Stored in the `products` table as `edition_size`
- **Limited Editions**: When `edition_size` is set (e.g., 100), only that many items can be assigned edition numbers
- **Open Editions**: When `edition_size` is `NULL` or `0`, there's no limit (unlimited editions)

### 2. Edition Number Assignment

The `assign_edition_numbers(p_product_id)` database function:

1. **Fetches edition size** from the `products` table for the given product
2. **Clears existing numbers** for that product (to ensure sequential numbering)
3. **Gets all active items** for the product, ordered by `created_at` (oldest first)
4. **Assigns sequential numbers** starting from 1:
   - Item created first → Edition #1
   - Item created second → Edition #2
   - And so on...
5. **Validates limited editions**: For limited editions, throws an error if trying to assign more than the edition size
6. **Sets edition_total**: 
   - Limited editions: Sets `edition_total` to the `edition_size`
   - Open editions: Sets `edition_total` to `NULL`

### 3. Status-Based Assignment

- **Only Active Items**: Edition numbers are ONLY assigned to items with `status = 'active'`
- **Active = Fulfilled**: Items are marked as `active` when their `fulfillment_status === 'fulfilled'` in Shopify
- **Inactive Items**: Items that are not fulfilled don't get edition numbers

### 4. Automatic Assignment

Edition numbers are automatically assigned during:
- **Sync Operations**: When syncing line items from Shopify (`/api/sync/line-items`, `/api/sync/new-line-items`, `/api/sync/orders`)
- **Webhooks**: When new orders come in via Shopify webhooks
- **Manual Sync**: When manually syncing orders

### 5. Manual Assignment

You can manually assign edition numbers using:

- **Single Product**: `POST /api/editions/assign-numbers` with `{ productId: "..." }`
- **All Products**: `POST /api/editions/assign-all`
- **Missing Only**: `POST /api/editions/assign-missing` (new endpoint - only assigns to items without numbers)

## Database Schema

### `order_line_items_v2` Table

- `edition_number`: INTEGER - The sequential edition number (1, 2, 3, ...)
- `edition_total`: INTEGER - Total edition size (NULL for open editions)
- `status`: TEXT - 'active' (fulfilled) or 'inactive' (not fulfilled)
- `product_id`: TEXT - Links to the product
- `created_at`: TIMESTAMPTZ - Used for ordering (oldest first)

### `products` Table

- `product_id`: TEXT/BIGINT - Product identifier
- `edition_size`: INTEGER - Maximum number of editions (NULL/0 = unlimited)

## Example Flow

1. **Product Setup**: Product "Artwork #1" has `edition_size = 50` (limited edition of 50)

2. **Order 1**: Customer orders on Jan 1, item is fulfilled
   - Status: `active`
   - Edition Number: `1`
   - Edition Total: `50`

3. **Order 2**: Customer orders on Jan 5, item is fulfilled
   - Status: `active`
   - Edition Number: `2`
   - Edition Total: `50`

4. **Order 3**: Customer orders on Jan 10, item is NOT fulfilled
   - Status: `inactive`
   - Edition Number: `NULL` (no number assigned)
   - Edition Total: `NULL`

5. **Order 4**: Customer orders on Jan 15, item is fulfilled
   - Status: `active`
   - Edition Number: `3` (continues sequence, skipping Order 3)
   - Edition Total: `50`

## API Endpoints

### Assign Missing Edition Numbers

```bash
POST /api/editions/assign-missing
```

Assigns edition numbers to all active items that don't have them yet.

**Response:**
```json
{
  "success": true,
  "message": "Assigned edition numbers for 150 items across 25 products",
  "stats": {
    "productsProcessed": 25,
    "productsWithErrors": 0,
    "totalAssigned": 150,
    "itemsWithoutEditions": 150
  },
  "results": [
    {
      "productId": "12345",
      "success": true,
      "editionNumbersAssigned": 10,
      "itemsNeedingAssignment": 10
    }
  ]
}
```

### Assign All Edition Numbers

```bash
POST /api/editions/assign-all
```

Reassigns edition numbers for ALL products (useful for resequencing after changes).

### Assign for Single Product

```bash
POST /api/editions/assign-numbers
Body: { "productId": "12345" }
```

Assigns edition numbers for a specific product.

## Important Notes

1. **Resequencing**: The `assign_edition_numbers` function clears ALL existing edition numbers for a product before reassigning. This ensures sequential numbering without gaps.

2. **Order Matters**: Edition numbers are assigned based on `created_at` timestamp, so the order in which items were created determines their edition number.

3. **Only Fulfilled Items**: Edition numbers are only assigned to fulfilled items. Unfulfilled items remain without edition numbers until they are fulfilled.

4. **Limited Edition Validation**: If you try to assign more edition numbers than the edition size allows, the function will throw an error.

5. **Open Editions**: For open editions (unlimited), there's no maximum limit, and `edition_total` is set to `NULL`.

## Troubleshooting

### Items Not Getting Edition Numbers

1. Check if item `status = 'active'` (must be fulfilled)
2. Verify product has `edition_size` set in products table (if limited edition)
3. Check if `product_id` is correctly set on the line item
4. Run `/api/editions/assign-missing` to assign numbers to items without them

### Edition Numbers Out of Order

- Run `/api/editions/assign-all` to resequence all products
- Or run `/api/editions/assign-numbers` for a specific product

### Exceeding Edition Size

- Check how many active items exist for the product
- Verify the `edition_size` in the products table
- Consider increasing the edition size if needed


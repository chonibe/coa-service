# First Edition Reserve System

## Overview

The First Edition Reserve System automatically purchases and reserves edition #1 of all approved artworks for `choni@thestreetlamp.com`. This ensures that the first edition of every piece is kept in the Street Collector collection while public sales start from edition #2.

## Business Logic

When an artwork is approved by an admin:
1. **Automatic Reserve**: Edition #1 is automatically reserved for `choni@thestreetlamp.com`
2. **Collector Assignment**: The edition is assigned to `choni@thestreetlamp.com`'s collector profile
3. **Artist Payout**: Only the artist payout (25% commission) is paid, not the full product price
4. **Edition Numbering**: Public sales start from edition #2 onwards
5. **Internal Transaction**: The reserve is tracked as a special internal reserve order

**Legal Compliance**: This policy is disclosed to vendors in the [Vendor Terms of Service](../vendor-terms/VENDOR_TERMS_OF_SERVICE.md) and shown during product submission. Vendors agree to this policy when submitting products for approval.

## Technical Implementation

### Database Schema

#### `first_edition_reserves` Table

Tracks all first edition reserves:

```sql
CREATE TABLE first_edition_reserves (
  id uuid PRIMARY KEY,
  product_id text NOT NULL,
  vendor_name text NOT NULL,
  order_id text NOT NULL,
  line_item_id text NOT NULL,
  reserved_at timestamptz DEFAULT now(),
  reserved_by text DEFAULT 'choni@thestreetlamp.com',
  purchase_price decimal(10,2) NOT NULL,
  payout_amount decimal(10,2) NOT NULL,
  status text CHECK (status IN ('reserved', 'fulfilled', 'cancelled')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `products` Table Extensions

Added columns to track reservation status:

- `first_edition_reserved` (boolean): Whether first edition has been reserved
- `first_edition_order_id` (text): ID of the reserve order

### Core Service

**File**: `lib/first-edition-reserve.ts`

Key functions:
- `reserveFirstEdition()`: Main orchestration function that creates order, line item, and reserve record
- `getReservedEditions()`: Retrieves all reserves for admin dashboard
- `getReserveById()`: Gets specific reserve details
- `cancelReserve()`: Cancels a reserve (for errors/corrections)
- `calculateReservePayout()`: Calculates 25% payout amount

### Integration Points

#### Product Approval Flow

**File**: `app/api/admin/products/submissions/[id]/approve/route.ts`

After a product submission is approved:
1. Extracts product price and details
2. Calls `reserveFirstEdition()` if feature is enabled
3. Logs result but doesn't fail approval if reserve fails

#### Edition Numbering

**File**: `supabase/migrations/20260126000101_update_edition_numbering_for_reserves.sql`

Updated `assign_edition_numbers()` function to:
- Check `products.first_edition_reserved` flag
- Start public edition numbering from #2 if reserved
- Exclude internal reserve orders (`source='internal_reserve'`) from edition counting

#### Order Creation

Reserve orders are created with:
- **ID Format**: `FER-{productId}-{timestamp}`
- **Source**: `'internal_reserve'`
- **Customer**: `choni@thestreetlamp.com`
- **Total Price**: Only the artist payout amount (25% of product price), not the full price
- **Status**: Automatically set to `'paid'` and `'fulfilled'`
- **Excluded from Shopify sync**: These orders don't sync back to Shopify

#### Payout Integration

Reserve line items are included in vendor payout calculations:
- Line items have correct `vendor_name` and `status='active'`
- 25% payout is calculated automatically
- Included in vendor payout summaries and reports
- Only "Street Collector" vendor is excluded (as intended)

## API Endpoints

### List Reserves
```
GET /api/admin/first-edition-reserves
```

Query parameters:
- `status`: Filter by status (reserved, fulfilled, cancelled)
- `vendor_name`: Filter by vendor
- `product_id`: Filter by product

### Get Reserve Details
```
GET /api/admin/first-edition-reserves/[id]
```

Returns reserve with enriched product and order details.

### Create Reserve (Manual)
```
POST /api/admin/first-edition-reserves/create
```

Body:
```json
{
  "product_id": "string",
  "vendor_name": "string",
  "price": number,
  "product_data": { ... }
}
```

For retroactive reserves or manual overrides.

### Cancel Reserve
```
POST /api/admin/first-edition-reserves/[id]/cancel
```

Marks a reserve as cancelled (for errors/corrections).

## Admin Dashboard

**Path**: `/admin/first-edition-reserves`

Features:
- View all reserves with product details
- Filter by status, vendor, or search
- View statistics (total reserves, value, payout)
- Link to order details
- Export functionality

## Feature Flag

Environment variable:
```
ENABLE_FIRST_EDITION_RESERVE=true
```

Set to `false` to disable automatic reserves (defaults to enabled).

## Collector Profile Setup

The system automatically:
1. Checks if `choni@thestreetlamp.com` has a collector profile
2. Creates profile if missing (linked to auth user if exists)
3. Assigns reserved editions to the profile

## Troubleshooting

### Reserve Not Created on Approval

1. Check feature flag: `ENABLE_FIRST_EDITION_RESERVE` must be `true`
2. Verify product has valid price > 0
3. Check server logs for errors
4. Verify product approval was successful

### Edition Numbering Issues

1. Verify `products.first_edition_reserved` flag is set
2. Check that reserve order has `source='internal_reserve'`
3. Verify edition assignment function excludes internal reserves
4. Run `assign_edition_numbers()` manually if needed

### Payout Not Including Reserve

1. Verify line item has correct `vendor_name`
2. Check line item `status='active'`
3. Verify order is not excluded (only "Street Collector" is excluded)
4. Check payout calculation functions include all active items

### Duplicate Reserves

The system prevents duplicate reserves:
- Checks `first_edition_reserves` table before creating
- Checks `products.first_edition_reserved` flag
- Returns error if already reserved

## Database Migrations

1. **20260126000100_first_edition_reserve.sql**: Creates tables and columns
2. **20260126000101_update_edition_numbering_for_reserves.sql**: Updates edition numbering logic

## Legal Compliance

This feature is fully disclosed to vendors in:
- **Vendor Terms of Service**: [docs/features/vendor-terms/VENDOR_TERMS_OF_SERVICE.md](../vendor-terms/VENDOR_TERMS_OF_SERVICE.md)
- **Product Submission Flow**: Disclosure notice shown in review step
- **Vendor Settings**: Link to terms available in vendor dashboard

Vendors agree to the First Edition Reserve Policy when submitting products for approval. The policy is transparent and clearly communicated.

## Related Files

- `lib/first-edition-reserve.ts` - Core service layer
- `app/api/admin/products/submissions/[id]/approve/route.ts` - Approval integration
- `app/api/admin/first-edition-reserves/` - API endpoints
- `app/admin/first-edition-reserves/page.tsx` - Admin dashboard
- `app/vendor/components/onboarding-wizard.tsx` - Terms acceptance during signup
- `app/vendor/dashboard/settings/page.tsx` - Terms link in vendor settings
- `docs/features/vendor-terms/VENDOR_TERMS_OF_SERVICE.md` - Vendor terms documentation
- `supabase/migrations/20260126000100_first_edition_reserve.sql` - Database schema
- `supabase/migrations/20260126000101_update_edition_numbering_for_reserves.sql` - Edition logic

## Future Improvements

- Bulk reserve creation for historical products
- Reserve analytics and reporting
- Email notifications for reserves
- Reserve cancellation workflow
- Integration with Shopify inventory management

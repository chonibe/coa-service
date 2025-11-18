# Vendor Payout System

## Feature Overview

The Vendor Payout System is a comprehensive solution for calculating and processing payments to vendors based on fulfilled order line items. The system ensures accurate, auditable, and fair payment processing with support for per-product payout configuration, manual payout management, and complete audit trails.

## Key Features

- ✅ **Fulfillment-Based Calculations**: Only fulfilled line items are eligible for payout
- ✅ **Per-Product Configuration**: Set custom payout percentages (default 25%) per product
- ✅ **Order Grouping**: Payouts calculated per order, then summed for vendor totals
- ✅ **Manual Payout Management**: Mark line items as paid manually with audit trail
- ✅ **Comprehensive Validation**: Prevents duplicate payments and validates fulfillment status
- ✅ **Admin Portal Integration**: Full UI for managing payouts and settings
- ✅ **Audit Trail**: Complete logging of all payout actions

## Technical Implementation

### Database Schema

#### Core Tables

- **`order_line_items`**: Stores order line items with fulfillment status
- **`product_vendor_payouts`**: Per-product payout configuration
- **`vendor_payouts`**: Payout batch records
- **`vendor_payout_items`**: Individual line item payment tracking

#### Key Fields

- `fulfillment_status`: Must be 'fulfilled' for payout eligibility
- `manually_marked_paid`: Boolean flag for manual payments
- `marked_by`: Admin email for audit trail
- `marked_at`: Timestamp of manual payment

### API Endpoints

#### Vendor Endpoints

- `GET /api/vendors/payouts/pending`: Get pending payouts for vendors
- `GET /api/vendors/payouts/pending-items`: Get pending line items for a vendor
- `POST /api/vendors/payouts/process`: Process payouts (admin only)

#### Admin Endpoints

- `POST /api/admin/payouts/mark-paid`: Manually mark items as paid
- `GET /api/admin/payouts/calculate`: Calculate detailed payout breakdown

### Database Functions

- `get_pending_vendor_payouts()`: Calculate pending payouts (fulfilled items only)
- `get_vendor_pending_line_items(vendor_name)`: Get pending line items for vendor
- `get_vendor_payout_by_order(vendor_name, order_id)`: Order-level payout calculation

### Libraries

- **`lib/payout-calculator.ts`**: Core calculation logic
- **`lib/payout-validator.ts`**: Validation and integrity checks

## Admin User Guide

### Setting Payout Percentages

1. Navigate to **Admin → Payouts → Payout Settings**
2. Search or filter products by vendor
3. Set payout type (Percentage or Fixed)
4. Enter payout amount (percentage or fixed value)
5. Click "Save" for individual products or use bulk edit

**Default**: Products without settings default to 25% percentage payout

### Viewing Pending Payouts

1. Navigate to **Admin → Payouts → Payout Manager**
2. View list of vendors with pending payouts
3. Click to expand and see line items grouped by order
4. Review fulfillment status and payout amounts

### Processing Payouts

1. Select vendors from pending payouts list
2. Click "Process Selected"
3. Choose payment method (PayPal, Bank Transfer, etc.)
4. Optionally generate invoices
5. Add notes if needed
6. Confirm and process

### Manual Payout Marking

1. Navigate to **Admin → Payouts → Manual Payout Management**
2. Select vendor from dropdown
3. Filter by order, date range, or search
4. Select line items to mark as paid
5. Review calculation preview
6. Enter optional payout reference
7. Confirm to mark as paid

### Calculating Payouts

1. Navigate to **Admin → Payouts → Payout Calculator**
2. Select vendor
3. Toggle "Include paid items" if needed
4. View detailed breakdown by order
5. Expand orders to see line item details
6. Export report if needed

## Calculation Examples

### Example 1: Percentage Payout

- Product Price: £100.00
- Payout Percentage: 25%
- **Payout Amount**: £25.00

### Example 2: Fixed Amount Payout

- Product Price: £100.00
- Fixed Payout: £10.00
- **Payout Amount**: £10.00

### Example 3: Multiple Items

- Order 1:
  - Item A: £100 × 25% = £25.00
  - Item B: £50 × 25% = £12.50
  - **Order Total**: £37.50
- Order 2:
  - Item C: £200 × 30% = £60.00
  - **Order Total**: £60.00
- **Vendor Total**: £97.50

## Fulfillment Status

### Understanding Statuses

- **fulfilled**: Item shipped/delivered - Eligible for payout ✅
- **partially_fulfilled**: Partial shipment - Not eligible ❌
- **unfulfilled**: Not shipped - Not eligible ❌
- **null**: Unknown status - Not eligible ❌

### Status Sync

Fulfillment status is synced from Shopify via:
- Webhook updates
- Manual sync endpoint: `POST /api/shopify/sync-fulfillments`

## Troubleshooting

### No Payouts Showing

**Possible Causes:**
- Line items not fulfilled
- Items already paid
- No products configured

**Solutions:**
1. Check fulfillment status in order details
2. Review payout history for previous payments
3. Verify product payout settings

### Incorrect Payout Amounts

**Possible Causes:**
- Wrong payout percentage set
- Using fixed amount instead of percentage
- Calculation error

**Solutions:**
1. Verify product payout settings
2. Check calculation in payout calculator
3. Review order line item prices

### Duplicate Payment Errors

**Possible Causes:**
- Item already marked as paid
- Previous payout included item
- Manual payment already recorded

**Solutions:**
1. Check payout history
2. Review vendor_payout_items table
3. Verify item not in previous payout batch

## Related Documentation

- [Payout Protocol](./PAYOUT_PROTOCOL.md): Detailed protocol documentation
- [API Documentation](../../API_DOCUMENTATION.md): API endpoint details
- [Admin Portal](../admin-portal/README.md): Admin portal overview

## Implementation Files

### Database
- `supabase/migrations/20251118042456_payout_enhancements.sql`
- `supabase/migrations/20251118042457_order_payout_tracking.sql`
- `db/vendor_payout_functions.sql`

### API Routes
- `app/api/vendors/payouts/pending/route.ts`
- `app/api/vendors/payouts/process/route.ts`
- `app/api/admin/payouts/mark-paid/route.ts`
- `app/api/admin/payouts/calculate/route.ts`

### Admin Pages
- `app/admin/vendors/payouts/page.tsx` - Payout settings
- `app/admin/vendors/payouts/admin/page.tsx` - Payout manager
- `app/admin/vendors/payouts/manual/page.tsx` - Manual payout management
- `app/admin/vendors/payouts/calculate/page.tsx` - Payout calculator

### Libraries
- `lib/payout-calculator.ts`
- `lib/payout-validator.ts`

## Version History

- **v1.0.0** (2024-11-18): Initial comprehensive payout system implementation
  - Fulfillment-based calculations
  - Per-product payout configuration
  - Manual payout management
  - Order grouping
  - Complete audit trail





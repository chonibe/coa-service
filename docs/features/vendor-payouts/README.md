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
- ✅ **PayPal Integration**: Real PayPal Payouts API integration for automated payments
- ✅ **Automatic Refund Deduction**: Automatically deducts vendor share when orders are refunded
- ✅ **PDF Invoice Generation**: Professional self-billing invoices for tax compliance
- ✅ **USD Currency Support**: All payouts processed in USD
- ✅ **Refund Processing UI**: Admin interface for processing refunds from order details
- ✅ **Negative Balance Warnings**: Alerts for vendors who owe money from refunds
- ✅ **PayPal Status Checking**: Manual status check for PayPal batch payouts

## Technical Implementation

### Database Schema

#### Core Tables

- **`order_line_items_v2`**: Stores order line items with fulfillment and refund status
- **`product_vendor_payouts`**: Per-product payout configuration
- **`vendor_payouts`**: Payout batch records with PayPal tracking
- **`vendor_payout_items`**: Individual line item payment tracking
- **`vendor_ledger_entries`**: Complete transaction ledger (payouts, refunds, adjustments)

#### Key Fields

- `fulfillment_status`: Must be 'fulfilled' for payout eligibility
- `refund_status`: 'none', 'partial', or 'full' - tracks refund state
- `refunded_amount`: Amount refunded for partial refunds
- `refunded_at`: Timestamp when refund was processed
- `payout_batch_id`: PayPal batch ID for tracking
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
- `POST /api/admin/orders/refund`: Process refunds for order line items
- `GET /api/vendors/payouts/[id]/invoice`: Generate PDF invoice for payout
- `GET /api/vendors/payouts/check-status`: Check PayPal batch payout status

### Database Functions

- `get_pending_vendor_payouts()`: Calculate pending payouts (fulfilled items only, includes refund deductions)
- `get_vendor_pending_line_items(vendor_name)`: Get pending line items for vendor (excludes refunded items)
- `get_vendor_payout_by_order(vendor_name, order_id)`: Order-level payout calculation
- `get_vendor_balance(vendor_name)`: Get vendor balance including refund deductions

### Libraries

- **`lib/payout-calculator.ts`**: Core calculation logic
- **`lib/payout-validator.ts`**: Validation and integrity checks
- **`lib/paypal/client.ts`**: PayPal OAuth authentication
- **`lib/paypal/payouts.ts`**: PayPal Payouts API integration
- **`lib/invoices/generator.ts`**: PDF invoice generation

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
4. For PayPal: System automatically creates batch payout via PayPal API
5. Optionally generate invoices
6. Add notes if needed
7. Confirm and process
8. PayPal payouts will show "processing" status until PayPal completes
9. Use "Check Status" button to manually refresh PayPal batch status

### Manual Payout Marking

1. Navigate to **Admin → Payouts → Manual Payout Management**
2. Select vendor from dropdown
3. Filter by order, date range, or search
4. Select line items to mark as paid
5. Review calculation preview
6. Enter optional payout reference
7. Confirm to mark as paid

### Processing Refunds

1. Navigate to **Admin → Orders → [Order ID]**
2. Find the line item to refund
3. Click "Refund" button (only visible for fulfilled items with vendors)
4. Choose refund type: Full or Partial
5. For partial refunds, enter the refunded amount
6. Confirm refund
7. System automatically deducts vendor's share from their next payout
8. Refund status is displayed on the line item

### Calculating Payouts

1. Navigate to **Admin → Payouts → Payout Calculator**
2. Select vendor
3. Toggle "Include paid items" if needed
4. View detailed breakdown by order
5. Expand orders to see line item details
6. Note: Negative balances from refunds are automatically included
7. Export report if needed

### Viewing Payout History

1. Navigate to **Admin → Payouts → Payout Manager → Payout History**
2. Filter by status, search vendors
3. For PayPal payouts with "processing" status, click refresh icon to check PayPal status
4. Download invoices for completed payouts
5. View PayPal batch IDs for tracking

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
- `supabase/migrations/20251121120000_pro_payout_system_upgrade.sql` - Pro upgrade (refunds, PayPal, invoices)
- `db/vendor_payout_functions.sql`
- `db/vendor_payout_functions_with_refunds.sql` - Updated with refund logic

### API Routes
- `app/api/vendors/payouts/pending/route.ts`
- `app/api/vendors/payouts/process/route.ts` - Updated with PayPal integration
- `app/api/vendors/payouts/[id]/invoice/route.ts` - PDF invoice generation
- `app/api/vendors/payouts/check-status/route.ts` - PayPal status checking
- `app/api/admin/payouts/mark-paid/route.ts`
- `app/api/admin/payouts/calculate/route.ts`
- `app/api/admin/orders/refund/route.ts` - Refund processing

### Admin Pages
- `app/admin/vendors/payouts/page.tsx` - Payout settings
- `app/admin/vendors/payouts/admin/page.tsx` - Payout manager (with warnings, PayPal status)
- `app/admin/vendors/payouts/manual/page.tsx` - Manual payout management
- `app/admin/vendors/payouts/calculate/page.tsx` - Payout calculator
- `app/admin/orders/[orderId]/OrderDetails.tsx` - Order details with refund UI

### Vendor Pages
- `app/vendor/dashboard/payouts/page.tsx` - Vendor payout history with invoice downloads

### Libraries
- `lib/payout-calculator.ts`
- `lib/payout-validator.ts`
- `lib/paypal/client.ts` - PayPal authentication
- `lib/paypal/payouts.ts` - PayPal Payouts API
- `lib/invoices/generator.ts` - PDF invoice generation

## PayPal Integration

### Setup

1. Get PayPal API credentials from PayPal Developer Dashboard
2. Add to environment variables:
   ```
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_client_secret
   PAYPAL_ENVIRONMENT=sandbox  # or 'production'
   ```
3. Ensure all vendors have valid PayPal emails in their profile

### How It Works

1. Admin selects vendors and processes payout
2. System validates PayPal emails
3. Creates PayPal batch payout via API
4. Stores `payout_batch_id` for tracking
5. Status updates automatically or can be checked manually
6. Completed payouts marked with completion date

### Status Checking

- PayPal processes payouts asynchronously
- Use "Check Status" button in payout history to refresh
- Statuses: PENDING → PROCESSING → SUCCESS/FAILED
- Failed payouts can be retried manually

## Refund Processing

### Automatic Deduction

When an order is refunded:
1. Admin marks line item as refunded (full or partial)
2. System checks if item was previously paid
3. If paid, calculates vendor's share that was paid
4. Creates negative ledger entry
5. Deducts from vendor's next payout automatically

### Refund Types

- **Full Refund**: Deducts entire vendor payout amount
- **Partial Refund**: Deducts proportional amount based on refunded amount

### Negative Balances

- Vendors with negative balances are highlighted in red
- Cannot be selected for payout until balance is positive
- System shows warning alert for all vendors with negative balances

## Invoice Generation

### Features

- Professional PDF invoices with company branding
- Self-billing invoices for tax compliance
- Includes vendor details, line items, tax breakdown
- Downloadable from vendor dashboard and admin payout history
- Automatic invoice number generation

### Access

- **Vendors**: Download from `/vendor/dashboard/payouts` for completed payouts
- **Admins**: Download from payout history table

## Currency

- All payouts processed in **USD**
- Database defaults to USD
- PayPal payouts sent in USD
- Invoices display USD amounts
- Vendor dashboard shows USD formatting

## Historical Price Correction (Pre-Oct 2025)

As part of the platform's currency transition and "reset," an exception has been applied to all fulfilled line items created before October 1, 2025.

### Adjustment Details
- **Revenue Correction**: All eligible line items have their `price` set to **$40.00**.
- **Payout Rule**: Fixed at **$10.00** (exactly 25% of the corrected $40.00 revenue).
- **Audit Trail**: Original prices and adjustment notes are preserved in the `metadata` column of `order_line_items_v2`.
- **Status Reset**: All "Paid" statuses were reverted on Dec 28, 2025, to allow for a full platform re-payout using these corrected values. This does not affect fulfillment status.
- **Ledger Rebuild**: The unified ledger has been rebuilt to reflect these corrected earnings for all historical records.

This adjustment ensures that historical data matches the current USD-only payout standard and provides a clear, consistent baseline for vendors.

## Version History

- **v2.1.0** (2025-12-28): Historical Data Alignment & Payout Reset
  - Implemented historical price correction ($40 revenue / $10 payout) for pre-Oct 2025 data.
  - Reverted "Paid" status for all line items to enable fresh payout processing.
  - Added `metadata` support to `order_line_items_v2` for audit trails.
  - Updated unified ledger rebuild logic.

- **v2.0.0** (2024-11-21): Pro Payout System Upgrade
  - PayPal Payouts API integration
  - Automatic refund deduction
  - PDF invoice generation
  - USD currency support
  - Admin refund processing UI
  - Negative balance warnings
  - PayPal status checking
  - Enhanced vendor ledger tracking

- **v1.0.0** (2024-11-18): Initial comprehensive payout system implementation
  - Fulfillment-based calculations
  - Per-product payout configuration
  - Manual payout management
  - Order grouping
  - Complete audit trail





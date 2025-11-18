# Vendor Payout Protocol

## Overview

This document outlines the comprehensive payout protocol for vendor payments, similar to industry standards used by platforms like Shopify and Gumroad. The protocol ensures accurate, auditable, and fair payment processing for vendors based on fulfilled order line items.

## Core Principles

1. **Fulfillment-Based Eligibility**: Only fulfilled order line items are eligible for payout
2. **Per-Product Configuration**: Each product can have its own payout percentage or fixed amount
3. **Default Payout**: 25% of revenue for products without specific configuration
4. **Order Grouping**: Payouts are calculated per order, then summed for vendor totals
5. **Audit Trail**: All payout actions are logged with admin identity and timestamp
6. **Duplicate Prevention**: System prevents duplicate payments for the same line items

## Payout Calculation Formula

### Basic Calculation

For each fulfilled line item:

```
payout_amount = line_item_price × (payout_percentage / 100)
```

Where `payout_percentage` is determined by:
1. Product-specific setting in `product_vendor_payouts` table (if exists)
2. Default: 25% if no setting exists

### Fixed Amount Payouts

For products configured with fixed amounts:

```
payout_amount = fixed_amount × quantity
```

### Total Vendor Payout

```
total_payout = Σ(payout_amount for all fulfilled, unpaid line items)
```

## Fulfillment Status Requirements

### Eligible Statuses

- **fulfilled**: Item has been shipped/delivered - **ELIGIBLE FOR PAYOUT**
- **partially_fulfilled**: Partial fulfillment - **NOT ELIGIBLE**
- **unfulfilled**: Not yet fulfilled - **NOT ELIGIBLE**
- **null**: Status unknown - **NOT ELIGIBLE**

### Status Validation

Before any payout calculation or processing:
1. System validates that `fulfillment_status = 'fulfilled'`
2. Unfulfilled items are automatically excluded
3. Validation errors are logged and reported

## Payout Workflow

### 1. Order Fulfillment

1. Order is placed and line items are created
2. Fulfillment status is synced from Shopify
3. Line items are marked with `fulfillment_status = 'fulfilled'` when shipped

### 2. Payout Calculation

1. System identifies all fulfilled line items for a vendor
2. Excludes already-paid items (checked against `vendor_payout_items`)
3. Calculates payout per line item based on product settings
4. Groups calculations by order
5. Sums totals across all orders

### 3. Payout Processing

#### Automatic Processing

1. Admin reviews pending payouts in admin portal
2. Selects vendors for payout
3. System validates all line items are fulfilled
4. Creates payout record in `vendor_payouts` table
5. Associates line items in `vendor_payout_items` table
6. Processes payment via configured method (PayPal, Stripe, etc.)
7. Updates payout status to `completed` or `failed`

#### Manual Processing

1. Admin views fulfilled line items in manual payout page
2. Selects specific line items or entire orders
3. System validates fulfillment status and checks for duplicates
4. Admin provides optional payout reference
5. System marks items as paid with audit trail
6. Optionally creates payout record

### 4. Payment Tracking

- Each line item payment is tracked in `vendor_payout_items`
- Manual payments are marked with `manually_marked_paid = true`
- Admin email and timestamp are recorded for audit
- Payout reference links to external payment records

## Order Grouping

### Calculation Structure

Payouts are calculated in a hierarchical structure:

```
Vendor
  └── Order 1
      ├── Line Item 1 (fulfilled) → £X.XX
      ├── Line Item 2 (fulfilled) → £Y.YY
      └── Total Order Payout: £(X.XX + Y.YY)
  └── Order 2
      ├── Line Item 3 (fulfilled) → £Z.ZZ
      └── Total Order Payout: £Z.ZZ
  └── Total Vendor Payout: £(X.XX + Y.YY + Z.ZZ)
```

### Benefits

- Clear visibility of payout per order
- Easier reconciliation
- Better reporting and analytics
- Simplified dispute resolution

## Manual Payout Marking

### Use Cases

1. **Retroactive Payments**: Mark items as paid for payments made outside the system
2. **Partial Payments**: Mark specific line items when full payout isn't processed
3. **Corrections**: Fix payment tracking errors
4. **External Payments**: Record payments made via other channels

### Process

1. Admin navigates to Manual Payout Management page
2. Selects vendor to view fulfilled line items
3. Filters by order, date range, or search query
4. Selects line items to mark as paid
5. Reviews calculation preview
6. Provides optional payout reference
7. Confirms and marks items as paid
8. System creates audit trail entry

### Audit Trail Fields

- `manually_marked_paid`: Boolean flag
- `marked_by`: Admin email address
- `marked_at`: Timestamp of action
- `payout_reference`: Optional external reference

## Duplicate Payment Prevention

### Validation Checks

1. **Pre-Processing Check**: Verify line item not already in `vendor_payout_items` with `payout_id IS NOT NULL`
2. **Manual Marking Check**: Validate items aren't already marked as paid
3. **Database Constraints**: Unique constraint on `(payout_id, line_item_id)` prevents duplicates

### Error Handling

- Duplicate attempts are rejected with clear error messages
- Warnings shown for items previously manually marked
- System logs all validation failures

## Data Integrity

### Validation Rules

1. **Fulfillment Status**: Must be 'fulfilled'
2. **Line Item Status**: Must be 'active'
3. **Vendor Consistency**: All items in batch must belong to same vendor
4. **Amount Validation**: Payout amounts must be non-negative
5. **Price Validation**: Line item prices must be positive

### Integrity Checks

- Verify line items exist and are active
- Ensure vendor name matches across all items
- Validate payout calculations match expected totals
- Check for data inconsistencies

## Audit Requirements

### Required Audit Fields

All payout actions must record:

1. **Admin Identity**: Email address of admin performing action
2. **Timestamp**: Exact time of action (UTC)
3. **Action Type**: Type of payout action (automatic, manual, correction)
4. **Line Items**: List of affected line item IDs
5. **Amounts**: Total payout amount
6. **Reference**: Optional external reference number

### Audit Log Locations

- `vendor_payout_items`: Individual line item payment records
- `vendor_payouts`: Payout batch records
- `admin_actions`: Admin action log (for manual operations)

## Error Handling

### Validation Errors

- **Unfulfilled Items**: Rejected with clear message listing item IDs
- **Duplicate Payments**: Rejected with list of already-paid items
- **Missing Data**: Rejected with specific missing field information
- **Calculation Errors**: Logged with details for investigation

### Processing Errors

- **Payment Gateway Failures**: Payout status set to 'failed', items remain unpaid
- **Database Errors**: Transaction rolled back, no partial updates
- **Network Errors**: Retry logic with exponential backoff

## Reporting

### Available Reports

1. **Pending Payouts**: Summary of all vendors with pending payouts
2. **Payout History**: Complete history of processed payouts
3. **Order Breakdown**: Detailed payout calculation per order
4. **Vendor Summary**: Total payouts per vendor over time period

### Export Formats

- JSON: Machine-readable format for integration
- CSV: Spreadsheet-compatible format
- PDF: Human-readable reports (future enhancement)

## Compliance

### Tax Reporting

- Payout records include tax information
- Self-billed invoices generated when requested
- Tax ID and country stored for compliance

### Financial Reconciliation

- All payouts linked to payment gateway transactions
- Reference numbers for external payment tracking
- Complete audit trail for accounting purposes

## Best Practices

### For Admins

1. **Regular Reviews**: Review pending payouts weekly
2. **Batch Processing**: Process payouts in batches for efficiency
3. **Reference Tracking**: Always provide payout references for manual payments
4. **Validation**: Review calculation previews before confirming
5. **Documentation**: Document any manual corrections or exceptions

### For System

1. **Automated Validation**: Always validate before processing
2. **Clear Error Messages**: Provide actionable error messages
3. **Audit Logging**: Log all actions for compliance
4. **Performance**: Optimize queries for large datasets
5. **Monitoring**: Track payout processing times and errors

## Troubleshooting

### Common Issues

1. **No Payouts Showing**: Check fulfillment status sync from Shopify
2. **Incorrect Amounts**: Verify product payout settings
3. **Duplicate Errors**: Check if items already marked as paid
4. **Missing Items**: Verify fulfillment status is 'fulfilled'

### Resolution Steps

1. Check fulfillment status in order line items
2. Verify product payout settings in admin portal
3. Review payout history for previous payments
4. Check audit logs for manual payment records
5. Contact support with specific line item IDs if issue persists

## Future Enhancements

- Automated payout scheduling
- Multi-currency support
- Advanced reporting and analytics
- Payment gateway webhook integration
- Vendor payout portal for self-service


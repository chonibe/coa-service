# Vendor Redemption Workflow

## Overview

Vendors can now request payouts, which require admin approval before payment is processed. This provides better control and prevents automatic payments.

## Workflow Steps

### 1. Vendor Requests Redemption

**Vendor Side:**
- Vendor navigates to `/vendor/dashboard/payouts`
- Clicks "Redeem Payout" button
- System calculates pending payout amount from unpaid fulfilled line items
- Creates payout record with status: `requested`
- Vendor sees: "Awaiting Approval" badge

**What Happens:**
- Payout record created in `vendor_payouts` table
- Status set to `requested`
- Line items associated with payout in `vendor_payout_items`
- **No PayPal payment is sent yet**

### 2. Admin Reviews Request

**Admin Side:**
- Admin navigates to `/admin/vendors/payouts/admin`
- Opens "Redemption Requests" tab (default tab)
- Sees list of all pending redemption requests
- Can see:
  - Vendor name
  - Amount requested
  - Number of products
  - PayPal email (or "Missing" badge)
  - Request date/time
  - Reference number

### 3. Admin Approves or Rejects

**Approve:**
- Admin clicks "Approve" button
- System:
  1. Validates vendor PayPal email
  2. Updates payout status to `processing`
  3. Processes PayPal payment via API
  4. Updates status based on PayPal response
  5. Sends notification to vendor
  6. Creates invoice

**Reject:**
- Admin clicks "Reject" button
- Optional: Enter rejection reason
- System:
  1. Updates payout status to `rejected`
  2. Removes payout items association
  3. Line items become available for future requests
  4. Vendor can see rejection status

### 4. Vendor Sees Status

**Vendor Dashboard:**
- `requested` → Shows "Awaiting Approval" badge
- `processing` → Shows "Processing" badge
- `completed` → Shows "Paid" badge with invoice download
- `rejected` → Shows "Rejected" badge
- `failed` → Shows "Failed" badge

## API Endpoints

### Vendor Endpoints

**POST `/api/vendor/payouts/redeem`**
- Creates payout request with status `requested`
- Returns: `{ success: true, payoutId, amount, status: "requested" }`

### Admin Endpoints

**GET `/api/admin/payouts/requests`**
- Returns all payout requests with status `requested`
- Includes vendor details and PayPal email

**POST `/api/admin/payouts/approve`**
- Body: `{ payoutId, action: "approve" | "reject", reason?: string }`
- Approves: Processes PayPal payment
- Rejects: Marks as rejected, removes item associations

## Status Flow

```
requested → (admin approves) → processing → completed
         → (admin rejects) → rejected
         → (PayPal fails) → failed
```

## Benefits

1. **Control**: Admin reviews all redemption requests before payment
2. **Safety**: Prevents accidental or unauthorized payouts
3. **Audit Trail**: All approvals/rejections tracked with admin email
4. **Flexibility**: Admin can reject with reason if needed
5. **Transparency**: Vendors see clear status at each step

## Database Changes

- Payout status can now be: `requested`, `rejected` (in addition to existing statuses)
- `processed_by` field tracks which admin approved/rejected
- `notes` field stores rejection reason (if provided)

## UI Updates

### Vendor Dashboard
- "Redeem Payout" button creates request (not immediate payment)
- Shows "Awaiting Approval" badge for requested payouts
- Updated success message explains approval process

### Admin Dashboard
- New "Redemption Requests" tab (default view)
- Table showing all pending requests
- Approve/Reject buttons with clear actions
- Shows PayPal email validation status

## Testing Checklist

- [ ] Vendor can request redemption
- [ ] Request appears in admin dashboard
- [ ] Admin can approve request
- [ ] PayPal payment processes after approval
- [ ] Admin can reject request
- [ ] Rejected requests show correct status
- [ ] Vendor sees status updates correctly
- [ ] Line items become available again after rejection


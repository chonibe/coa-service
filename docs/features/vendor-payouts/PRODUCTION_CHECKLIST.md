# Payout System Production Checklist

This checklist ensures the payout system is properly configured before going live.

## Pre-Deployment Validation

Run the automated validation script:

```bash
npx ts-node scripts/validate-payout-production.ts
```

## Environment Variables

### Required for Payouts

| Variable | Description | Example |
|----------|-------------|---------|
| `PAYPAL_CLIENT_ID` | PayPal REST API Client ID | `AX...` |
| `PAYPAL_CLIENT_SECRET` | PayPal REST API Secret | `EK...` |
| `PAYPAL_ENVIRONMENT` | Must be `production` for live payouts | `production` |
| `VENDOR_SESSION_SECRET` | Secret for vendor session tokens | Random 32+ char string |

### Required for Database

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

## PayPal Setup

- [ ] Create PayPal Business account
- [ ] Enable PayPal Payouts API in developer dashboard
- [ ] Create REST API app with Payouts permissions
- [ ] Copy Client ID and Secret to environment variables
- [ ] Set `PAYPAL_ENVIRONMENT=production`
- [ ] Test with small payout to verify setup

## Database Verification

- [ ] Verify `vendors` table has required columns:
  - `paypal_email`
  - `tax_id`
  - `tax_country`
  - `terms_accepted`
- [ ] Verify `vendor_payouts` table exists
- [ ] Verify `vendor_payout_items` table exists
- [ ] Verify `vendor_ledger_entries` table exists
- [ ] Verify RPC functions exist:
  - `get_vendor_pending_line_items`
  - `get_pending_vendor_payouts`
  - `get_vendor_payout_by_order`

## Feature Configuration

- [ ] Minimum payout threshold set: `$25 USD`
- [ ] Default payout percentage: `25%`
- [ ] Currency: `USD` only

## Vendor Onboarding

Before vendors can request payouts, they must complete:

- [ ] PayPal email added
- [ ] Tax ID provided
- [ ] Tax country selected
- [ ] Terms of service accepted

## Admin Workflow

1. Vendor requests payout via dashboard
2. Request appears in Admin > Payouts > Redemption Requests
3. Admin reviews and approves/rejects
4. Approved payouts are processed via PayPal API
5. Status updates automatically via webhook

## Testing Checklist

- [ ] Vendor can see available balance
- [ ] Button disabled when prerequisites missing
- [ ] Notification bar shows when profile incomplete
- [ ] Minimum threshold enforced ($25)
- [ ] Payout request creates record with "requested" status
- [ ] Admin can see and approve requests
- [ ] PayPal payout processes successfully
- [ ] Vendor receives email notification
- [ ] Invoice PDF generates correctly

## Rollback Plan

If issues occur after deployment:

1. Set `PAYPAL_ENVIRONMENT=sandbox` to stop real payouts
2. Check `vendor_payouts` table for stuck records
3. Update failed payout statuses manually if needed
4. Contact PayPal support for transaction issues

## Support Contacts

- PayPal Developer Support: developer.paypal.com/support
- Platform Admin: Check admin dashboard for payout logs

---

**Last Updated**: 2026-02-01
**Version**: 1.0.0

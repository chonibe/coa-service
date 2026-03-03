# Account Address Management – 2026-03-02

## Summary

Allow users to add and edit shipping and billing addresses directly in their account, instead of only at checkout.

## Checklist

- [x] Add `default_shipping_address` and `default_billing_address` JSONB columns to `collector_profiles` via migration ([`supabase/migrations/20260302000000_add_collector_default_addresses.sql`](../../supabase/migrations/20260302000000_add_collector_default_addresses.sql))
- [x] Create GET `/api/shop/account/addresses` to fetch saved addresses ([`app/api/shop/account/addresses/route.ts`](../../app/api/shop/account/addresses/route.ts))
- [x] Create PUT `/api/shop/account/addresses` to save shipping and/or billing address ([`app/api/shop/account/addresses/route.ts`](../../app/api/shop/account/addresses/route.ts))
- [x] Update account page Profile tab: fetch saved addresses, show "Add Address" / "Edit" buttons ([`app/shop/account/page.tsx`](../../app/shop/account/page.tsx))
- [x] Integrate AddressModal for adding/editing addresses in account ([`app/shop/account/page.tsx`](../../app/shop/account/page.tsx))
- [x] Display saved addresses with fallback to most recent order when no saved address ([`app/shop/account/page.tsx`](../../app/shop/account/page.tsx))

## Technical Details

### Database
- **Migration**: `20260302000000_add_collector_default_addresses.sql`
- Stores `CheckoutAddress`-compatible JSON in `default_shipping_address` and `default_billing_address` on `collector_profiles`
- Lookup by `user_id` (from session)

### API
- **GET** `/api/shop/account/addresses`: Returns `{ shippingAddress, billingAddress }` from collector profile
- **PUT** `/api/shop/account/addresses`: Body `{ shippingAddress?, billingAddress? }`; updates collector profile
- Supports mock user in development

### UI
- Profile tab "Saved Addresses" section now shows "Add Address" when empty, "Edit" when address exists
- Uses same `AddressModal` as checkout for consistency
- Fallback: if no saved address, shows address from most recent order (read-only display) with option to "Add" and save to account

## Deployment

1. Run migration: `supabase db push` or apply migration to production Supabase
2. Deploy as usual; no env changes required

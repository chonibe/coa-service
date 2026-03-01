# Checkout Layout Redesign — March 1, 2026

## Summary

Implemented a unified checkout layout across Experience OrderBar, Cart page, and LocalCartDrawer with address collection, payment method selection, promo codes, and validation that auto-opens incomplete sections when the user tries to checkout.

## Changes Checklist

- [x] **`lib/data/countries.ts`** — Created country list and phone dial codes for address forms
- [x] **`lib/shop/CheckoutContext.tsx`** — Shared checkout state (address, payment, promo, billing, validation)
- [x] **`components/shop/checkout/AddressModal.tsx`** — Add Address modal with email, full name, country, address lines, city, postal, phone
- [x] **`components/shop/checkout/PaymentMethodModal.tsx`** — Payment method selection (Google Pay, PayPal, Credit Card) with billing address
- [x] **`components/shop/checkout/PromoCodeModal.tsx`** — Promo codes popup with available codes and custom entry
- [x] **`components/shop/checkout/CheckoutLayout.tsx`** — Main layout component: title, Add Address, Paying with, Promo Code, order items, shipping, total, payment button
- [x] **`components/shop/checkout/index.ts`** — Exports
- [x] **`app/api/checkout/create/route.ts`** — Accept `shippingAddress`, `paymentMethodPreference`, `promoCode`; restrict payment methods when preference set
- [x] **`app/api/checkout/validate-promo/route.ts`** — Optional promo validation via Stripe
- [x] **`app/shop/experience/components/OrderBar.tsx`** — Integrated CheckoutLayout, CheckoutProvider; passes address/payment/promo to API
- [x] **`app/shop/cart/page.tsx`** — Replaced Order Summary with CheckoutLayout; CheckoutProvider wrap
- [x] **`components/impact/LocalCartDrawer.tsx`** — Integrated CheckoutLayout; uses create API; CheckoutProvider wrap; credits support
- [x] **`app/shop/layout.tsx`** — Pass `creditsToUse` and `creditsDiscount` to LocalCartDrawer

## Features

- **Add Address**: Home icon, highlighted when incomplete; modal with full form (email, full name, country dropdown, address lines, city, postal, phone)
- **Paying with**: Selected payment method display; "Change" opens modal with Google Pay, PayPal, Credit Card + billing address
- **Promo Code**: "Change" opens promo modal; available codes list + custom entry
- **Validation**: On Pay click, if address or payment incomplete, auto-opens first incomplete modal
- **Payment button**: Icon reflects selected method (GPay, PayPal, Credit Card)

## Design Tokens

- Error banner: `bg-amber-100`, `text-amber-800`
- Done / Change links: `text-pink-600`
- Add Address highlight when incomplete: `ring-2 ring-amber-200`, `bg-amber-50`

## Files Modified

| File | Change |
|------|--------|
| [`lib/data/countries.ts`](../../lib/data/countries.ts) | New |
| [`lib/shop/CheckoutContext.tsx`](../../lib/shop/CheckoutContext.tsx) | New |
| [`components/shop/checkout/*`](../../components/shop/checkout/) | New |
| [`app/api/checkout/create/route.ts`](../../app/api/checkout/create/route.ts) | Modified |
| [`app/api/checkout/validate-promo/route.ts`](../../app/api/checkout/validate-promo/route.ts) | New |
| [`app/shop/experience/components/OrderBar.tsx`](../../app/shop/experience/components/OrderBar.tsx) | Modified |
| [`app/shop/cart/page.tsx`](../../app/shop/cart/page.tsx) | Modified |
| [`components/impact/LocalCartDrawer.tsx`](../../components/impact/LocalCartDrawer.tsx) | Modified |
| [`app/shop/layout.tsx`](../../app/shop/layout.tsx) | Modified |

## Testing

- AddressModal: Validate full name (first + last), all required fields
- PaymentMethodModal: Select each option; billing address "Same as shipping"
- PromoCodeModal: Apply code, remove
- CheckoutLayout: Click Pay with incomplete address → AddressModal opens
- OrderBar, Cart page, LocalCartDrawer: Full flow with address, payment, promo

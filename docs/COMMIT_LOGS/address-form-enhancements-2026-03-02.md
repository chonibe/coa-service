# Address Form Enhancements (2026-03-02)

## Summary

Enhanced the checkout address form with Mapbox autocomplete, country-based state/province dropdowns, and phone number country code auto-detection.

## Checklist of Changes

- [x] **Mapbox API** — Extract `state`/`region` from Mapbox Geocoding context and include in autocomplete response ([`app/api/mapbox/address-autocomplete/route.ts`](../../app/api/mapbox/address-autocomplete/route.ts))
- [x] **AddressSuggestion + CheckoutAddress** — Add `state?: string` to types ([`components/shop/checkout/AddressAutocompleteInput.tsx`](../../components/shop/checkout/AddressAutocompleteInput.tsx), [`lib/shop/CheckoutContext.tsx`](../../lib/shop/CheckoutContext.tsx))
- [x] **States Data** — Add `lib/data/states.ts` with US states, CA provinces, AU states, MX states ([`lib/data/states.ts`](../../lib/data/states.ts))
- [x] **AddressModal** — State dropdown (US/CA/AU/MX) or free-text; auto-fill state from Mapbox selection; phone `onChange` parses `+CODE` and updates country/code ([`components/shop/checkout/AddressModal.tsx`](../../components/shop/checkout/AddressModal.tsx))
- [x] **InlineAddressForm** — Same state dropdown and phone parsing ([`components/shop/checkout/InlineAddressForm.tsx`](../../components/shop/checkout/InlineAddressForm.tsx))
- [x] **Fulfillment** — Pass `state` as `province` to Shopify draft orders ([`lib/stripe/fulfill-embedded-payment.ts`](../../lib/stripe/fulfill-embedded-payment.ts))
- [x] **API Routes** — Add `state` to `ShippingAddressInput` / request types in confirm-payment, complete-order, create-checkout-session, create-payment-intent
- [x] **OrderBar, PaymentMethodsModal, LocalCartDrawer, cart page** — Include `state` in `shippingAddress` payloads
- [x] **PaymentStep** — Persist items + address to sessionStorage before PayPal redirect so success page can call complete-order ([`components/shop/checkout/PaymentStep.tsx`](../../components/shop/checkout/PaymentStep.tsx))
- [x] **Documentation** — Updated [`docs/features/experience/README.md`](../../docs/features/experience/README.md) with Address Form Enhancements section

## Technical Details

### Mapbox Region Extraction

Mapbox Geocoding v5 returns a `context` array. The `region.*` item holds state/province (e.g. "California", "Ontario"). Added `regionCtx` extraction and `state` field to the API response.

### Phone Parsing

When the user types or pastes a number starting with `+` (e.g. `+44 7911 123456`), the `handlePhoneChange` handler:

1. Matches `^(\+\d{1,4})\s*(.*)$`
2. If the dial code exists in `PHONE_DIAL_OPTIONS`, updates `phoneCountryCode` and `phoneNumber` (digits only)
3. Infers country from `PHONE_CODE_TO_COUNTRY` and updates the country dropdown

### States by Country

- **US**: 50 states + DC (2-letter codes)
- **CA**: 13 provinces/territories
- **AU**: 8 states/territories
- **MX**: 32 states

Other countries use a free-text "State / Province" field.

### SessionStorage for PayPal Redirect

When Stripe returns `result.type === 'redirect'` (PayPal), we store `sc_checkout_items` and `sc_checkout_address` in sessionStorage before navigating. The success page reads these to call `complete-order` with the correct shipping address.

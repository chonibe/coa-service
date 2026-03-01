# Stripe Checkout Sessions (ui_mode: custom) + Elements

**Date**: 2026-03-01  
**Branch/Commit**: main  

## Summary

Implements a full-page checkout using [Stripe Checkout Sessions API](https://docs.stripe.com/payments/quickstart-checkout-sessions) with `ui_mode: "custom"` and Stripe Elements (Payment Element, Billing/Shipping Address Elements). This follows Stripe's recommended approach over Payment Intents for most integrations.

## Implementation Checklist

- [x] Create `/api/checkout/create-checkout-session` – POST endpoint returning `clientSecret` for CheckoutProvider
- [x] Create `/shop/checkout` page with Stripe `CheckoutProvider`, `PaymentElement`, `BillingAddressElement`, `ShippingAddressElement`
- [x] Add email validation via `checkout.updateEmail()` and submit via `checkout.confirm()`
- [x] Add `lib/checkout/session-storage.ts` – `storeCheckoutItems`, `getCheckoutItems`, `clearCheckoutItems`
- [x] Wire experience OrderBar – "Checkout on full page" link stores items and navigates to `/shop/checkout`
- [x] Wire cart page – "Stripe Checkout (full page)" button stores items and navigates to `/shop/checkout`
- [x] Update docs – experience README with new endpoints and flow

## Files Changed

| File | Change |
|------|--------|
| `app/api/checkout/create-checkout-session/route.ts` | **New** – Creates Checkout Session with ui_mode: custom, shipping options, metadata |
| `app/shop/checkout/page.tsx` | **New** – CheckoutProvider, PaymentElement, email, BillingAddressElement, ShippingAddressElement |
| `lib/checkout/session-storage.ts` | **New** – Session storage helpers for cart items |
| `app/shop/experience/components/OrderBar.tsx` | Add "Checkout on full page" link |
| `app/shop/cart/page.tsx` | Add "Stripe Checkout (full page)" button |
| `docs/features/experience/README.md` | Document new checkout flow and API |

## Technical Notes

- **CheckoutProvider** from `@stripe/react-stripe-js/checkout` with `clientSecret` (string or Promise)
- **Success redirect**: `/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}` – existing success page already handles `session_id`
- **Item format**: Same as `create-payment-intent` (productId, variantId, variantGid, handle, title, price, quantity, image)
- **Stripe appearance**: Theme variables aligned with Impact design (primary, background, text, danger, border radius)

## References

- [Stripe Checkout Sessions quickstart](https://docs.stripe.com/payments/quickstart-checkout-sessions)
- [CheckoutProvider React](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider)

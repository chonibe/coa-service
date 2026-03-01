# Checkout Payment Methods: Google Pay & PayPal — March 1, 2026

## Summary

Enabled Google Pay and PayPal as payment options at checkout by configuring `payment_method_types` on Stripe Checkout Sessions.

## Changes Made

### 1. API Routes Updated

- [ ] **`app/api/checkout/stripe/route.ts`** — Added `payment_method_types: ['card', 'paypal', 'link']` to Stripe Checkout session params for product/configurator checkout
- [ ] **`app/api/checkout/create/route.ts`** — Added `payment_method_types: ['card', 'paypal', 'link']` to cart checkout session params

### 2. Payment Methods Enabled

| Method     | Type    | Description                                              |
|-----------|---------|----------------------------------------------------------|
| **Card**  | `card`  | Credit/debit cards (Visa, Mastercard, Amex, etc.)        |
| **PayPal**| `paypal`| PayPal wallet — redirect to PayPal to complete payment   |
| **Link**  | `link`  | Stripe Link — one-click checkout, can surface Google Pay|

### 3. Google Pay Behavior

- Google Pay is not a separate Stripe Checkout payment method type
- It appears as an express option when:
  - Customer uses Chrome/Android and has Google Pay set up
  - `link` or `card` is enabled (Google Pay tokenizes to card)
- Ensure **Google Pay** is enabled in [Stripe Dashboard → Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods)

### 4. PayPal Activation

- **PayPal must be activated** in Stripe Dashboard for your account
- Go to [Stripe Dashboard → Payment methods](https://dashboard.stripe.com/settings/payment_methods) and enable PayPal
- Business location eligibility: [See Stripe PayPal docs](https://docs.stripe.com/payments/paypal#business-locations) (US, EU, and other regions supported)

## Verification Checklist

- [ ] Verify PayPal is enabled in Stripe Dashboard
- [ ] Verify Google Pay is enabled in Stripe Dashboard (if desired)
- [ ] Test checkout flow with card (4242...)
- [ ] Test checkout flow with PayPal (Stripe test mode)
- [ ] Confirm Link / express options appear when eligible

## Related Files

- [`app/api/checkout/stripe/route.ts`](/app/api/checkout/stripe/route.ts)
- [`app/api/checkout/create/route.ts`](/app/api/checkout/create/route.ts)
- [`docs/CHECKOUT_TEST_RUN.md`](/docs/CHECKOUT_TEST_RUN.md)

## References

- [Stripe Checkout Payment Methods](https://docs.stripe.com/payments/checkout/payment-methods)
- [Stripe PayPal](https://docs.stripe.com/payments/paypal)
- [Stripe Google Pay](https://docs.stripe.com/google-pay)
- [Stripe Link](https://docs.stripe.com/payments/link)

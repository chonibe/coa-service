# Google Pay Domain Registration Fix — 2026-03-05

## Summary

Google Pay was not showing in the checkout Payment Element because Stripe requires domains to be registered before displaying Link, Google Pay, Apple Pay, and PayPal.

## Changes

- [x] **`app/api/admin/register-payment-domains/route.ts`** — New API endpoint to register payment method domains with Stripe
  - `POST` — Registers missing domains (from `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, or fallback `app.thestreetcollector.com`, `thestreetcollector.com`, `www.thestreetcollector.com`)
  - `GET` — Lists current registered domains and their status (`google_pay`, `link`, `paypal`)
- [x] **`package.json`** — Added `register:payment-domains` script to call the API
- [x] **`docs/CHECKOUT_TEST_RUN.md`** — Added Google Pay troubleshooting section, domain registration prerequisite, and link to Stripe docs
- [x] **`docs/features/experience/README.md`** — Updated Stripe config section with domain registration steps and troubleshooting link

## How to Fix Google Pay Not Showing

1. **Register domains** — With dev server running: `npm run register:payment-domains`, or `curl -X POST http://localhost:3000/api/admin/register-payment-domains`
2. **Production** — After deploy: `curl -X POST https://app.thestreetcollector.com/api/admin/register-payment-domains`
3. **Enable Google Pay** — [Stripe Dashboard → Payment methods](https://dashboard.stripe.com/settings/payment_methods) → enable Google Pay
4. **Device/Browser** — Chrome, card saved to Google Pay, allow sites to check payment methods

## References

- [Stripe: Register domains for payment methods](https://docs.stripe.com/payments/payment-methods/pmd-registration)
- [Stripe: Google Pay web](https://docs.stripe.com/google-pay?platform=web)
- [Stripe: Testing wallets](https://docs.stripe.com/testing/wallets)
- [`docs/CHECKOUT_TEST_RUN.md`](../CHECKOUT_TEST_RUN.md#google-pay-not-showing)

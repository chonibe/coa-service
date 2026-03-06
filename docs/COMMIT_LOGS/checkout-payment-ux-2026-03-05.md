# Checkout: Payment Section Scroll + Card Label UX

**Date**: 2026-03-05  
**Commit**: f78e3cb80

## Summary

Payment section in the experience cart drawer now scrolls correctly when content overflows, and shows card brand + last 4 digits in the collapsed label when a card is entered.

## Changes Checklist

- [x] [`app/shop/experience/components/OrderBar.tsx`](../../app/shop/experience/components/OrderBar.tsx) — Add `overflow-y-auto min-h-0 max-h-[70vh]` to payment section inner div for scrolling; add `enteredCardInfo` state and use it in `paymentMethodLabel` to show "Visa ending in 4242" when card is entered
- [x] [`components/shop/checkout/PaymentStep.tsx`](../../components/shop/checkout/PaymentStep.tsx) — Extend `onPaymentMethodChange` to accept optional `cardInfo?: { brand: string; last4: string }`; extract brand/last4 from Stripe Payment Element `onChange` when type is `card` and pass to parent

## Features

### Scrolling
- Payment section (Payment Element + billing address) scrolls inside expandable area when content exceeds viewport
- Inner content div has `overflow-y-auto` so Place Order remains accessible

### Card Label
- Collapsed payment row shows "Visa ending in 4242" (or other brand + last4) when user enters card in Payment Element
- Falls back to "Card" when brand/last4 not yet available from Stripe
- `savedCard` (from saved payment methods) still takes priority when present

## Known Limitations

- Stripe Payment Element `onChange` may not expose card details in all SDK versions; structure varies by Checkout vs Payment Intents flow. If brand/last4 do not appear, check `event.value` structure in `PaymentStep` and adjust extraction.

# Address modal: desktop phone `autocomplete` off (2026-03-27)

## Problem

On desktop (cart / `CheckoutLayout` → `AddressModal`), Safari and Chrome could still show the system **Contacts / phone** UI when focusing the phone field. `type="text"` was already used on wide viewports, but **`autoComplete="shipping tel"`** (or `billing tel`) is enough to trigger that behavior.

## Checklist

- [x] [`components/shop/checkout/AddressModal.tsx`](../../components/shop/checkout/AddressModal.tsx) — `autoComplete={isMobile ? ac('tel') : 'off'}` on `#address-phone`
- [x] [`components/shop/checkout/AddressModal.test.tsx`](../../components/shop/checkout/AddressModal.test.tsx) — Assert `off` on desktop and `shipping tel` on mobile

## Version

- 2026-03-27

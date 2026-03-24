# Experience checkout: desktop phone field / Contacts picker (2026-03-24)

## Summary

On desktop, Safari (and similar browsers) can open the system **Contacts** picker when an address form uses `input type="tel"`. The experience checkout uses [`AddressModal`](../../components/shop/checkout/AddressModal.tsx) from [`OrderBar`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx). The phone field now uses `type="text"` on viewports **≥768px** and keeps `type="tel"` on smaller screens so mobile still gets the telephone keyboard.

## Checklist of changes

- [x] **Phone input** — `type={isMobile ? 'tel' : 'text'}` with `inputMode="tel"` unchanged ([`components/shop/checkout/AddressModal.tsx`](../../components/shop/checkout/AddressModal.tsx))
- [x] **Stable id + autofill sync** — `#address-phone` + `data-testid="address-phone"`; autofill polling targets `#address-phone` instead of `input[type="tel"]` ([`components/shop/checkout/AddressModal.tsx`](../../components/shop/checkout/AddressModal.tsx))

## Implementation reference

- **Implementation:** [`components/shop/checkout/AddressModal.tsx`](../../components/shop/checkout/AddressModal.tsx)
- **Consumer (experience checkout):** [`app/(store)/shop/experience-v2/components/OrderBar.tsx`](../../app/(store)/shop/experience-v2/components/OrderBar.tsx)

## Version

- **lastUpdated:** 2026-03-24
- **version:** 1.0.0

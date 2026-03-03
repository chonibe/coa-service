# Remove Mapbox Address Autocomplete (2026-03-03)

## Summary

Removed Mapbox as the address autocomplete provider for checkout. Address autocomplete now uses **Google Places only** when configured; otherwise a plain text input is shown.

## Checklist of Changes

- [x] **AddressModal** — Remove Mapbox fallback; use Google Places when keys set, plain `Input` otherwise ([`components/shop/checkout/AddressModal.tsx`](../components/shop/checkout/AddressModal.tsx))
- [x] **GooglePlacesAddressInput** — Define and export `AddressSuggestion` type (moved from deleted component) ([`components/shop/checkout/GooglePlacesAddressInput.tsx`](../components/shop/checkout/GooglePlacesAddressInput.tsx))
- [x] **AddressAutocompleteInput** — Deleted (Mapbox-based component)
- [x] **Mapbox address-autocomplete API** — Deleted [`app/api/mapbox/address-autocomplete/route.ts`](../app/api/mapbox/address-autocomplete/route.ts)
- [x] **.env.example** — Updated Mapbox comment (maps/geocoding only); Google Places now required for checkout autocomplete
- [x] **Documentation** — Updated [`docs/features/experience/README.md`](../docs/features/experience/README.md) address autocomplete section

## Technical Details

- Mapbox token (`NEXT_PUBLIC_MAPBOX_TOKEN`) remains for maps and geocoding in artwork editor and location blocks
- Checkout address line 1: Google Places autocomplete when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set; otherwise plain input with browser autofill support

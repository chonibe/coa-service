# Address modal: phone country sheet aligned with `sm` breakpoint (2026-03-27)

## Problem

On viewports where the dialog is already **centered** (Tailwind `sm:` ≥640px), `useMobile` could still be true up to **767px**, so the **slide-over “Phone country code”** UI appeared next to the main Add Address form. Uncovered sheets also risked peeking past the dialog when translated off-screen.

## Checklist

- [x] [`components/shop/checkout/AddressModal.tsx`](../../components/shop/checkout/AddressModal.tsx) — `useNarrowViewportForPhoneCountrySheet()` (`max-width: 639px` via `useSyncExternalStore`) gates button+sheet vs Select; `overflow-hidden relative` on `Dialog.Content`; sheet only mounts when narrow; close sheet on resize to wide
- [x] [`components/shop/checkout/AddressModal.test.tsx`](../../components/shop/checkout/AddressModal.test.tsx) — Mock `matchMedia`; assert no sheet title / no “Change phone country code” button when wide + `useMobile` true
- [x] [`docs/features/experience/README.md`](../features/experience/README.md) — Phone country behavior note + version bump
- [x] [`docs/COMMIT_LOGS.md`](./COMMIT_LOGS.md) — This entry

## Version

- 2026-03-27

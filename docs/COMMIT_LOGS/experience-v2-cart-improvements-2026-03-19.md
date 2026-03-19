# Experience V2 Cart Improvements – 2026-03-19

**Commit:** `d5462c85f`  
**Branch:** main

## Summary

Cart UX updates for the experience-v2 checkout: trust badges, editable lamp quantity, and layout tweaks.

## Changes Checklist

- [x] **Trust badges** – Added 4 badges under Place Order: Free Worldwide Shipping, 12 months guarantee, Easy 30 days returns, Secure payment
- [x] **Trust badge icons** – Package, Shield, RotateCcw, Lock (lucide-react, stroke 1, 1.1em)
- [x] **Trust badge layout** – 2 per row, centered, rounded-lg, spacing (mt-10 from Place Order)
- [x] **Lamp quantity input** – Editable text input with `LampQuantityInput` component
- [x] **Lamp quantity 0** – Typing 0 or clearing removes lamp from cart
- [x] **Cart items area** – Increased max-h from 18vh to 35vh for scrolling items
- [x] **Place Order spacing** – More margin above Place Order + trust badges (mt-8)

## Files Modified

| File | Change |
|------|--------|
| `app/(store)/shop/experience-v2/components/OrderBar.tsx` | Trust badges, LampQuantityInput, cart layout |
| `app/(store)/shop/experience-v2/ExperienceSlideoutMenu.tsx` | (from prior session) |
| `app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx` | (from prior session) |
| `app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx` | (from prior session) |
| `app/(store)/shop/experience-v2/layout.tsx` | (from prior session) |
| `app/(store)/shop/experience-v2/page.tsx` | (from prior session) |

## Technical Notes

- `LampQuantityInput` uses local state and commits on blur to avoid controlled-input conflicts
- Trust badges use `grid grid-cols-2 gap-2.5 w-fit mx-auto` for 2-per-row centering

# Commit log: lamp-in-cart artwork CTA + header chip (2026-04-06)

When the experience cart has a lamp but no artworks, the sticky picker CTA switches to a violet, pulsing **Choose your Artworks**; the shell header shows a **Lamp added to Cart** chip.

## Checklist

- [x] [`app/globals.css`](../../app/globals.css) — `experience-artwork-cta-pulse` keyframes + `.animate-experience-artwork-cta-pulse` (respects global `prefers-reduced-motion`).
- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — branch on `lampQuantity > 0` for empty collection: copy, aria-label, violet styles + pulse vs blue **Create your own bundle**.
- [x] [`app/(store)/shop/experience-v2/ExperienceSlideoutMenu.tsx`](../../app/(store)/shop/experience-v2/ExperienceSlideoutMenu.tsx) — chip before cart when `lampQuantity > 0` && `cartCount === 0`.
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — changelog entry.

## Tests

- Manual: add lamp, leave artworks empty — confirm header chip + violet pulsing bottom CTA; add artwork — chip hides, CTA becomes checkout row.

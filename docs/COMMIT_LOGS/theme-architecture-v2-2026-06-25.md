# Theme architecture v2 — unified light/dark tokens

**Date:** 2026-06-25

## Summary

Consolidated storefront theming onto a single token system (`next-themes` + `app/globals.css` + Tailwind semantic colors). Light mode now uses a Cursor-inspired clean palette; dark mode keeps warm charcoal + peach highlight.

## Checklist

- [x] Merged [`tailwind.config.js`](../../tailwind.config.js) from deleted `tailwind.config.ts` — experience, sidebar, app chrome tokens
- [x] Refined `:root` light palette + added light `--experience-*` tokens in [`app/globals.css`](../../app/globals.css)
- [x] Deprecated [`LandingThemeProvider`](../../app/(store)/shop/street-collector/LandingThemeProvider.tsx) — global `useTheme()` only
- [x] Store layout uses `bg-background` only (removed `dark:bg-[#171515]` override)
- [x] Navigation components migrated to semantic tokens
- [x] Catalog pages (PDP, products, account, checkout success) migrated
- [x] Experience pages (V2/V3 loaders, sheets, sticky bars) support full light mode
- [x] CSS modules (`artist-profile`, `explore-artists`, `landing`) use `var(--experience-*)`
- [x] Checkout + Stripe appearance via [`lib/shop/stripe-appearance.ts`](../../lib/shop/stripe-appearance.ts)
- [x] Docs: [`docs/features/theme-toggle/README.md`](../features/theme-toggle/README.md) v2.0.0
- [x] CI guardrail: `npm run lint:theme-tokens`

## Test plan

1. Clear localStorage `theme` → page loads dark
2. Footer toggle → light mode on `/shop/products`, PDP, `/shop/experience`, `/shop/explore-artists`
3. Reload → preference persists
4. Experience in-page toggle syncs with footer toggle
5. Run `npm run lint:theme-tokens` — should pass

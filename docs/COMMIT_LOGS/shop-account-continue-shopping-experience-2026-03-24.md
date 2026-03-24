# Shop account: Continue Shopping → experience – 2026-03-24

## Summary

On `/shop/account`, **Continue Shopping**, **Start Shopping** (empty orders), and the post-logout redirect now go to **`/shop/experience`** (interactive lamp builder). Previously they linked to **`/shop`**, which immediately redirects to **`/shop/street-collector`** (marketing home), not the shopping experience.

## Checklist

- [x] [`app/(store)/shop/account/page.tsx`](../../app/(store)/shop/account/page.tsx) — `SHOP_EXPERIENCE_HREF` constant; guest + signed-in Continue Shopping, empty-state CTA, logout redirect

## Deployment

- No env or migration changes.
- Manual QA: open `/shop/account` (guest and signed-in) → **Continue Shopping** lands on `/shop/experience`; logout returns to experience.

# Cart page: quantity stepper between title and price

**Date**: 2026-03-20  
**Status**: ✅ Complete

## Summary

Restructured each cart line on `/shop/cart` so the − / + quantity controls sit between the product title block and the unit price. On narrow viewports the order stacks vertically (title → qty → price); from `sm` breakpoint onward they align in one row.

## Checklist

- [x] [app/(store)/shop/cart/page.tsx](../../app/(store)/shop/cart/page.tsx) — Line layout: image | (title + meta, qty stepper, price) | remove; bordered 32×32 ± buttons; `aria-label`s on controls

## Implementation notes

- Parent row uses `items-start` so the trash control stays top-aligned with the thumbnail.
- Plus button retains `maxQuantity` disable behavior from prior implementation.

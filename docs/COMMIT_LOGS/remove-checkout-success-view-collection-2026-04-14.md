# Commit log: Remove “View My Collection” on checkout success

**Date:** 2026-04-14

## Summary

Post-checkout success page no longer shows a **View My Collection** button. Guests still see **Sign in**; **Continue Shopping** is the main CTA for signed-in users.

## Checklist

- [x] [checkout-success-content.tsx](../../app/(store)/shop/checkout/success/checkout-success-content.tsx) — Removed dashboard link; conditional primary/outline on Continue Shopping
- [x] [post-purchase-credits README](../../docs/features/post-purchase-credits/README.md) — Version 1.1.1, path fix, changelog, success-page behavior

## Testing

- [x] `read_lints` on `checkout-success-content.tsx` — clean

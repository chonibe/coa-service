# Shop Experience Load Time Fix

**Date**: 2026-03-03

## Summary

Fixes slow loading of `/shop/experience` by reducing blocking work, trimming data fetch size, and deferring heavy component loading.

## Checklist of Changes

- [x] **[app/shop/layout.tsx](app/shop/layout.tsx)** – Skip recommendations fetch on experience page (Cart drawer hidden there; removes unnecessary API call)
- [x] **[app/shop/experience/page.tsx](app/shop/experience/page.tsx)** – Reduce products per season from 50 to 24 (48 total vs 100)
- [x] **[app/shop/experience/page.tsx](app/shop/experience/page.tsx)** – Two-phase streaming: lamp first, then products in nested Suspense (faster first paint, progressive render)
- [x] **[app/shop/experience/components/ExperienceClient.tsx](app/shop/experience/components/ExperienceClient.tsx)** – Dynamic import `Configurator` with `next/dynamic` (ssr: false) to split bundle and defer heavy JS

## Files Modified

- `app/shop/layout.tsx`
- `app/shop/experience/page.tsx`
- `app/shop/experience/components/ExperienceClient.tsx`

## Performance Impact

| Change | Impact |
|-------|--------|
| Skip recommendations on experience | Fewer network requests and layout work on mount |
| 24 products/season vs 50 | ~52% less Shopify payload, quicker API response |
| Lamp-first streaming | Shell/error UI renders before products are ready |
| Configurator code-split | Smaller initial bundle; Configurator loads only after quiz/skip |

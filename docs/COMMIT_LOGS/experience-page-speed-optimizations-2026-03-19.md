# Experience Page Speed Optimizations

**Date**: 2026-03-19

## Summary

Applied targeted performance optimizations to `/shop/experience` to reduce initial bundle size, defer non-critical work, and improve perceived load.

## Checklist of Changes

- [x] **[app/(store)/shop/experience/components/ExperienceV2Client.tsx](../app/(store)/shop/experience/components/ExperienceV2Client.tsx)** — Convert ArtworkDetail to `next/dynamic` with `ssr: false`; loads only when user opens detail drawer (saves ~1,400 lines, framer-motion, 20+ lucide icons from initial bundle)
- [x] **[app/(store)/shop/experience/components/ExperienceV2Client.tsx](../app/(store)/shop/experience/components/ExperienceV2Client.tsx)** — Defer spline-artwork prefetch with `requestIdleCallback` (500ms timeout); warms cache without blocking main thread
- [x] **[app/(store)/shop/experience/loading.tsx](../app/(store)/shop/experience/loading.tsx)** — Add route-level loading.tsx with layout-matched skeleton; instant shell when navigating to experience
- [x] **[app/(store)/shop/experience/layout.tsx](../app/(store)/shop/experience/layout.tsx)** — Add preload for `/internal.webp` (LCP facade image)
- [x] **[app/(store)/shop/experience/components/ArtworkCarouselBar.tsx](../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx)** — Replace framer-motion with CSS transitions; slide via `translate-y` + `transition-transform`; `whileTap` via `active:scale-[0.95]`; remove AnimatePresence (items appear without exit animation)

## Skipped (Technical Constraint)

- **Dynamic ExperienceSlideoutMenu** — Next.js does not allow `ssr: false` with `next/dynamic` in Server Components. Layout remains a Server Component, so dynamic import with ssr:false was reverted.

## Performance Impact

| Change | Impact |
|--------|--------|
| Dynamic ArtworkDetail | High — Removes heavy component from initial ExperienceV2Client bundle |
| Defer spline-artwork prefetch | Low — Reduces main-thread contention on mount |
| loading.tsx | Medium — Instant feedback on route navigation |
| Preload internal.webp | Low — Earlier LCP discovery |
| ArtworkCarouselBar CSS | Medium — Removes framer-motion from carousel bundle |

## Files Modified

- `app/(store)/shop/experience/components/ExperienceV2Client.tsx`
- `app/(store)/shop/experience/components/ArtworkCarouselBar.tsx`
- `app/(store)/shop/experience/layout.tsx`
- `app/(store)/shop/experience/loading.tsx` (new)

## Testing

- Page loads successfully (200)
- No linter errors
- Lighthouse runs complete (dev mode variance expected)
- Detail drawer opens correctly; carousel animations work; menu opens

# Commit log: checkout sticky bar shows every cart thumbnail (no +N overflow)

**Date:** 2026-04-06

## Summary

The bottom **Experience checkout sticky bar** previously capped visible thumbnails at five and showed **`+N`** for the rest. It now lists **all** lamp + artwork slots; the row already scrolls horizontally (`overflow-x-auto`).

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) — Removed `MAX_THUMBS`, the slice/`overflowCount` memo, and the `+{overflowCount}` tile; map over full `slots`.

## Testing

- [ ] Add more than five distinct cart line items (or multiple lamps + prints); confirm the sticky bar shows every thumbnail and horizontal scroll works (no `+5` summary tile).

## Deployment

- [x] `vercel --prod --yes` completed; production aliased to `https://app.thestreetcollector.com`.

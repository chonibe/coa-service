# Store footer: correct TikTok profile URL — 2026-03-29

## Summary

The TikTok icon in the store layout social links pointed at the wrong handle. It now opens the official profile at `https://www.tiktok.com/@street_collector_`.

## Checklist

- [x] [`app/(store)/layout.tsx`](../../app/(store)/layout.tsx) — `socialLinks` TikTok `href` updated from `https://tiktok.com/@thestreetcollector` to `https://www.tiktok.com/@street_collector_`.

## Routes affected

Any route using the `(store)` layout footer / social row (e.g. shop landing, experience flows that share this layout).

# Commit context: Meet the Street Lamp — static CDN videos per stage (2026-03-29)

## Checklist

- [x] [`content/street-collector.ts`](../../content/street-collector.ts) — `meetTheLamp.stages[]` each has `desktopVideo` + `mobileVideo` (user-supplied Shopify CDN `.mp4` URLs); section fallbacks set to first slide clip.
- [x] [`app/(store)/shop/street-collector/page.tsx`](../../app/(store)/shop/street-collector/page.tsx) — Removed Storefront metaobject fetch/merge for this section; `stages={streetCollectorContent.meetTheLamp.stages}`.
- [x] Removed [`lib/shopify/under-the-fold-meet-lamp.ts`](../../lib/shopify/under-the-fold-meet-lamp.ts) and [`listMetaobjectsWithReferences`](../../lib/shopify/metaobjects.ts) / `getVideoUrlFromMetaobjectField` (unused).
- [x] [`.env.example`](../../.env.example) — Dropped `SHOPIFY_UNDER_THE_FOLD_METAOBJECT_TYPE`.
- [x] [`MeetTheStreetLamp.tsx`](../../app/(store)/shop/street-collector/MeetTheStreetLamp.tsx) + [`README`](../../app/(store)/shop/street-collector/README.md) — Docs point to content file.

## Title → video (reference)

| Stage title | CDN id (path segment) |
|-------------|------------------------|
| Set the light | `641b66e529c04d84969f55385b986a3e` |
| Rotate anytime | `1bdeb33fb073460d9e50a64b49e10089` |
| Slide it in | `7964f935647e4978b2a6af7a4ea7f450` (updated from `45f9baf8563a491bbefe0a854e05346b`) |
| Mount it | `25762ae2b9754cae89e1c6590c805061` |
| Choose your art | `c605e496caed4a33b8ccbe3c11689bbb` |

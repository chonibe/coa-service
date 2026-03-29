# Commit context: Meet the Street Lamp videos from `under_the_fold_section` (2026-03-29)

## Checklist

- [x] [`lib/shopify/metaobjects.ts`](../../lib/shopify/metaobjects.ts) — `listMetaobjectsWithReferences`; `getMetaobjectFileUrl` reads `MediaImage` via `image.url`; `MetaobjectFileReference.image` typing.
- [x] [`lib/shopify/under-the-fold-meet-lamp.ts`](../../lib/shopify/under-the-fold-meet-lamp.ts) — Fetch + map metaobject type `under_the_fold_section`; merge onto stages by normalized title / slug / handle; optional mobile + poster field keys.
- [x] [`app/(store)/shop/street-collector/page.tsx`](../../app/(store)/shop/street-collector/page.tsx) — Parallel fetch with artists; proxy per-slide posters; pass merged `stages` to hero.
- [x] [`MeetTheStreetLamp.tsx`](../../app/(store)/shop/street-collector/MeetTheStreetLamp.tsx) — `MeetTheLampStage` optional `desktopVideo` / `mobileVideo` / `poster`; video + poster follow `activeIndex`.
- [x] [`content/street-collector.ts`](../../content/street-collector.ts) — Comment on metaobject-driven clips.
- [x] [`app/(store)/shop/street-collector/README.md`](../../app/(store)/shop/street-collector/README.md) — Field keys, scope, version.

## Shopify setup (summary)

- Metaobject **definition** handle for `metaobjects(type: …)`: **`under-the-fold-section-gedomnm3`** (override with env `SHOPIFY_UNDER_THE_FOLD_METAOBJECT_TYPE`).
- Per entry: text field **`title`** (or alternates listed in README) matching stage title (e.g. `Set the light`); **`video`** file (video) or alternates; optional **`mobile_video`**, poster image fields.
- Storefront API: **`unauthenticated_read_metaobjects`**.

## Tests

- [ ] With Storefront configured and metaobjects published, load `/` and confirm video changes when the stage text advances (desktop + mobile widths).

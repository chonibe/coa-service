# Commit context: Fix under_the_fold_section metaobject videos not loading (2026-03-29)

## Checklist

- [x] [`under-the-fold-meet-lamp.ts`](../../lib/shopify/under-the-fold-meet-lamp.ts) — Default type **`under_the_fold_section`** (matches Admin URL `…/entries/under_the_fold_section/…`); scan all fields for video via `getVideoUrlFromMetaobjectField`; extra title/video field key guesses; poster scan; dev diagnostics.
- [x] [`metaobjects.ts`](../../lib/shopify/metaobjects.ts) — **`GenericFile`** on `reference` in list + get queries; `extractUrlFromMetaobjectReference`; `getVideoUrlFromMetaobjectField`; `getMetaobjectFileUrl` uses shared extract + raw `.mp4` URL in `value`.
- [x] Docs — README, `.env.example`, `content/street-collector.ts`, prior commit logs aligned to `under_the_fold_section`.

## Root cause (likely)

- Earlier default **`under-the-fold-section-gedomnm3`** did not match the Storefront `metaobjects(type)` value; Admin shows definition segment **`under_the_fold_section`**.
- Some uploads resolve as **`GenericFile`** in Storefront, which was missing from the GraphQL fragments.

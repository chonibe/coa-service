# Artwork Editor — Vendor Upload Flow

**Canonical reference for how artists add "hidden artwork" content that collectors unlock with an NFC tap.**

This document covers the path from the vendor editor UI → `product_benefits` rows in Supabase → the collector-facing `/collector/artwork/[lineItemId]` page.

## Feature Overview

Each artwork has a set of **content blocks** stored as `product_benefits` rows. Artists edit them in the mobile-first editor at [`/artwork-editor/[productId]`](../../../app/artwork-editor/[productId]/page.tsx) (or the desktop editor at [`/vendor/dashboard/artwork-pages/[productId]`](../../../app/vendor/dashboard/artwork-pages/[productId]/page.tsx)). Blocks are visible to a collector once both flags are `true`:

- `is_active = true`
- `is_published = true`

The collector-facing read path ([`/api/collector/artwork/[id]/route.ts`](../../../app/api/collector/artwork/[id]/route.ts)) filters on **both** flags — they are the single source of truth for block visibility.

## Block Types

Registered in the `benefit_types` table. The nine canonical artwork-page types:

| `benefit_types.name` | Typical purpose | Renderer |
|---|---|---|
| `Artwork Text Block` | Story, essay, artist commentary | `TextBlock` |
| `Artwork Image Block` | Supporting image with caption | `ImageBlock` |
| `Artwork Video Block` | Video message | `VideoBlock` |
| `Artwork Audio Block` | Generic audio | `AudioBlock` |
| `Artwork Soundtrack Block` | Curated music (Spotify / upload) | `SoundtrackBlock` |
| `Artwork Voice Note Block` | Short recorded message | `VoiceNoteBlock` |
| `Artwork Process Gallery Block` | WIP photos / sketches | `ProcessGalleryBlock` |
| `Artwork Inspiration Block` | Mood board | `InspirationBoardBlock` |
| `Artwork Artist Note Block` | Signed note | `ArtistNoteBlock` |
| `Artwork Section Group Block` | Parent container for nested child blocks (uses `parent_block_id`) | `SectionGroupBlock` |

## API Contract

All vendor APIs require a valid vendor session cookie (resolved via `lib/vendor-session.ts` → `getVendorFromCookieStore`).

### `GET /api/vendor/artwork-pages/[productId]`
**File:** [`app/api/vendor/artwork-pages/[productId]/route.ts`](../../../app/api/vendor/artwork-pages/[productId]/route.ts)

Resolves `productId` as either:
1. A `vendor_product_submissions.id` (UUID).
2. A `products.id` (UUID).
3. A `products.product_id` (numeric Shopify id).

Returns `{ product, submission, blocks }` where `blocks` is the list of this product's `product_benefits` (regardless of published state — the editor shows drafts).

### `POST /api/vendor/artwork-pages/[productId]`
Creates a new block. **Defaults matter — these are deliberately `true` so newly saved content is visible to collectors immediately:**

```ts
is_published: body.is_published ?? true,
is_active: body.is_active ?? true,
```

Required: `benefit_type_name` (must match one of the rows above).

### `PUT /api/vendor/artwork-pages/[productId]`
Updates a block. All fields are optional — only provided fields are patched. Both `is_published` and `is_active` can be toggled independently.

### `DELETE /api/vendor/artwork-pages/[productId]?blockId=<id>`
Hard-deletes the block.

### `POST /api/vendor/artwork-pages/[productId]/reorder`
**File:** [`app/api/vendor/artwork-pages/[productId]/reorder/route.ts`](../../../app/api/vendor/artwork-pages/[productId]/reorder/route.ts)
Accepts `{ blockIds: number[] }` and rewrites `display_order` in that order.

### `POST /api/vendor/artwork-pages/[productId]/apply-template`
**File:** [`app/api/vendor/artwork-pages/[productId]/apply-template/route.ts`](../../../app/api/vendor/artwork-pages/[productId]/apply-template/route.ts)
Seeds a product with 9 default blocks (one per canonical type). As of v4 these insert with `is_published: true` + `is_active: true` so the artist's edits become visible the moment they are saved.

### `POST /api/vendor/artwork-pages/[productId]/copy-from`
**File:** [`app/api/vendor/artwork-pages/[productId]/copy-from/route.ts`](../../../app/api/vendor/artwork-pages/[productId]/copy-from/route.ts)
Copies blocks from `sourceProductId`. Copied blocks are inserted with `is_published: true` so a clone is production-ready (the artist can always unpublish individual blocks via PUT).

### `GET /api/vendor/artwork-pages/[productId]/preview`
Returns the **collector-facing shape** of the blocks so the editor can render the live preview identically to what the collector will see.

### `GET/POST/PUT /api/vendor/artwork-pages/series/[seriesId]`
**File:** [`app/api/vendor/artwork-pages/series/[seriesId]/route.ts`](../../../app/api/vendor/artwork-pages/series/[seriesId]/route.ts)
Series-level template blocks (`product_benefits.series_id IS NOT NULL`). Collector API falls back to these when a product has no product-specific blocks.

## Database Schema

```sql
product_benefits (
  id              bigint primary key,
  product_id      uuid references products(id),
  series_id       uuid references artwork_series(id),    -- null for product-specific blocks
  vendor_name     text,
  benefit_type_id int references benefit_types(id),
  title           text,
  description     text,
  content_url     text,
  block_config    jsonb,                                  -- per-type payload (images[], caption, etc.)
  parent_block_id bigint references product_benefits(id),-- for Section Group children
  display_order   int,
  is_published    boolean default true,
  is_active       boolean default true,
  created_at      timestamptz,
  updated_at      timestamptz
);
```

## Editor → Save → Collector Path

1. Artist opens [`/artwork-editor/[productId]`](../../../app/artwork-editor/[productId]/page.tsx).
2. Editor calls `GET /api/vendor/artwork-pages/[productId]` to load blocks (or seeds via `apply-template`).
3. On block edit, editor debounces a `PUT /api/vendor/artwork-pages/[productId]` with `{ blockId, ...patch }`.
4. Supabase updates the row; `updated_at` ticks.
5. Next time a collector loads `/collector/artwork/[lineItemId]`, the collector API reads the same `product_benefits` rows (filtered by `is_published && is_active`) and renders them.
6. The "hidden" gating is about **interaction** (`canInteract` flag), not visibility — locked content is still returned, so the page can show a tasteful locked preview before the collector authenticates.

## UI / UX Considerations

- The editor is mobile-first. The live preview on the right is powered by `/api/vendor/artwork-pages/[productId]/preview` so WYSIWYG = collector view.
- Inline save indicator: "Saved {timestamp}" vs "Saving…".
- Reorder mode uses a drag handle and persists via `/reorder` on commit.
- Block-specific editors (soundtrack, voice note, process gallery, inspiration board) live in `app/vendor/dashboard/artwork-pages/components/` and are reused by the mobile editor.

## Testing Requirements

- [ ] Create a block in the editor → reload the editor → block persists.
- [ ] Create a block in the editor → load the collector artwork page as the owner → block appears (no longer invisible after the v4 default-publish fix).
- [ ] Unpublish a block via `PUT { is_published: false }` → collector page stops showing it.
- [ ] Apply template to a product with 0 blocks → 9 default blocks appear on the collector page (as soon as the artist fills in title/description, they remain visible).
- [ ] Section Group: create a section group, nest 2 child blocks (via `parent_block_id`), reorder → collector page renders them in order under the group.

## Known Limitations

- `vendor_product_submissions` blocks live in the same `product_benefits` table keyed by submission UUID in `product_id`. On submission approval, the blocks are **not** re-keyed to the resulting Shopify product id; a follow-up migration is tracked in TASK_QUEUE.
- Bulk unpublish/delete across a series is not yet in the UI; use the series-level endpoint directly.

## Future Improvements

- Explicit publish toggle per block in the mobile editor (currently the API supports it but the mobile UI does not expose it).
- Conflict detection when two devices edit the same block concurrently.
- Soft-delete for blocks (currently DELETE is hard).

## Related Docs

- Collector-side: [`docs/features/collector-experience/README.md`](../collector-experience/README.md)
- NFC flow: [`docs/features/nfc-authentication/README.md`](../nfc-authentication/README.md)
- Wiki concept: [`wiki/concepts/conditional-artwork-access.md`](../../../wiki/concepts/conditional-artwork-access.md)

## Version

- **Current Version:** 4.0.0 (Canonical NFC Flow Consolidation)
- **Last Updated:** 2026-04-17
- **Changelog:**
  - 4.0.0 (2026-04-17) — Fixed default `is_published` so new blocks are visible to collectors. Added `is_active` to allowed PUT fields. Flipped `apply-template` + `copy-from` to publish-by-default. Documented the read/write contract alignment with the collector API.

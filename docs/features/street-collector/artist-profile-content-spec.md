# Artist profile — content map & Shopify metafields

**Purpose:** Define what each artist profile page shows, where data comes from, and how to author it (including JSON metafields). Use this as the single checklist when building or auditing artist content.

**Implementation (read first):**

| Area | Path |
|------|------|
| Profile UI (tabs, hero, works, related) | [`app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx`](../../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx) |
| Styles (parity with `artist-profile.html`) | [`app/(store)/shop/artists/[slug]/artist-profile.module.css`](../../../app/(store)/shop/artists/[slug]/artist-profile.module.css) |
| Page + fetch | [`app/(store)/shop/artists/[slug]/page.tsx`](../../../app/(store)/shop/artists/[slug]/page.tsx) |
| API + profile merge | [`app/api/shop/artists/[slug]/route.ts`](../../../app/api/shop/artists/[slug]/route.ts) |
| Payload helpers | [`lib/shop/artist-profile-api.ts`](../../../lib/shop/artist-profile-api.ts) |
| Collection GraphQL fields | [`lib/shopify/storefront-client.ts`](../../../lib/shopify/storefront-client.ts) — `CollectionFields` fragment |

**Version:** 1.0.0 · **Last updated:** 2026-04-02

---

## 1. Page structure (tabs)

| Tab | What it shows | Primary sources |
|-----|----------------|-----------------|
| **Overview** | Long-form story, optional pull quote, impact/exclusive callout cards, process image grid | Supabase `vendors.bio` / collection description / synced Shopify page; metafields below |
| **Works** | Product grid, filters (All / Available / Sold out / Season from **product tags**) | Shopify collection products or `vendor:` search; `custom.edition_size` on products |
| **Exhibitions & Press** | Year-grouped exhibitions + press cards | `custom.exhibitions`, `custom.press` (JSON on **collection**) |
| **Instagram** | Handle line, optional image grid, **Follow** CTA | Supabase `instagram_url` **or** `custom.instagram` on collection; optional `custom.instagram_showcase` |
| **Below tabs** | Related artists (from `GET /api/shop/artists`), final CTA | API + static links to `/experience` and `/shop/explore-artists` |

Sticky nav: logo → `/shop/street-collector`, **All Artists** → `/shop/explore-artists`, **Collect this work** → `/experience`.

---

## 2. Hero (always visible)

| Block | Logic | Authoring |
|-------|--------|-----------|
| Portrait | Collection image, else first product image, else initial | Shopify **collection** image; products as fallback |
| Eyebrow | `location · Active since {active_since}` when set | `custom.artist_location` + `custom.active_since` |
| Name | Vendor / collection title | Shopify |
| Alias | Optional real name / subtitle | `custom.artist_alias` |
| Hook | Short italic quote under name | `custom.story_hook` |
| Badge | “X works · Y remaining” | Computed from products + variant `quantityAvailable` |
| Meta row | Editions count, remaining, optional active year | Stats API + `custom.active_since` |

---

## 3. Story column (Overview)

| Element | Source | Metafield / field |
|---------|--------|-------------------|
| Body copy | Plain text paragraphs | Priority: Supabase vendor bio → collection description → synced Shopify **page** body (`content/shopify-content`) |
| Pull quote | Single highlighted quote | `custom.pullquote` (multi-line text) |
| Impact card | Community / give-back line | `custom.impact_callout` (plain text; newline = paragraph) |
| Exclusive card | Exclusivity / SC-only messaging | `custom.exclusive_callout` |

Default headline in UI is templated (“The work behind *the name.*”); override richer headline later via optional future metafield if needed.

---

## 4. Process column (Overview)

| Element | Source |
|---------|--------|
| 2×2 image grid | `custom.process_gallery` — **JSON array** on the **collection** |

**JSON shape:**

```json
[
  { "url": "https://cdn.shopify.com/...", "label": "Berlin, 2023" },
  { "url": "https://...", "label": "Studio" }
]
```

Use Shopify CDN URLs (or any HTTPS image URL). Labels are optional captions.

---

## 5. Works tab

| Element | Source |
|---------|--------|
| Product card | Storefront product from collection or vendor query |
| Edition label | Product metafield `custom.edition_size` (e.g. `Ed. 03 · 20`) |
| Season filter chips | Product **tags** matching `Season 1`, `season 2`, or `s1`, `s2`, etc. |
| Price / sold | `availableForSale`, `priceRange`, inventory |
| **Add to cart** | First variant |
| **Add to lamp** | Link to `/experience` |

---

## 6. Exhibitions & Press

Both are **collection** metafields (type: JSON).

**`custom.exhibitions`**

```json
[
  {
    "year": 2024,
    "type": "Solo",
    "title": "Show title",
    "venue": "Gallery name",
    "city": "Berlin, DE"
  }
]
```

Rows are grouped by `year` descending in the UI.

**`custom.press`**

```json
[
  {
    "outlet": "Magazine Name",
    "year": "2024",
    "quote": "Short quote from the piece.",
    "url": "https://..."
  }
]
```

`url` optional; if present, shows “Read feature”.

---

## 7. Instagram (priority order)

1. **Supabase** `vendors.instagram_url` (full URL or @handle) — parsed to handle.
2. **Collection** metafield `custom.instagram` (handle, @handle, or URL) — already used elsewhere in the app (e.g. vendor meta, collection context).

Resolved **Follow** link: `https://www.instagram.com/{handle}/`.

**Optional grid (no Graph API required):** `custom.instagram_showcase` on the **collection**:

```json
[
  { "url": "https://cdn.shopify.com/.../image.jpg", "kind": "Post" },
  { "url": "https://...", "kind": "Reel" }
]
```

`kind` is cosmetic overlay text only. For a live IG embed grid you would need Instagram’s APIs or a third-party widget; this spec stays within Shopify + Supabase.

---

## 8. Shopify Admin checklist (per artist collection)

Create metafields on the **Collection** resource, namespace `custom`:

- [ ] `instagram` — Single line or URL (handle or full Instagram URL)
- [ ] `artist_location` — Single line (e.g. `Berlin, Germany`)
- [ ] `artist_alias` — Single line
- [ ] `story_hook` — Single line (short hero quote)
- [ ] `pullquote` — Multi-line
- [ ] `active_since` — Single line (e.g. `2009` or `2009–present`)
- [ ] `process_gallery` — JSON
- [ ] `exhibitions` — JSON
- [ ] `press` — JSON
- [ ] `instagram_showcase` — JSON (optional)
- [ ] `impact_callout` — Multi-line (plain)
- [ ] `exclusive_callout` — Multi-line (plain)

**Products** (per artwork):

- [ ] `custom.edition_size` — edition label string
- [ ] Tags for season filters, e.g. `Season 1`, `Season 2`

**Supabase vendor** (if used):

- [ ] `bio`, `instagram_url`, profile images — same as today; they override or supplement Shopify.

---

## 9. Testing

- [ ] Open `/shop/artists/{slug}` — hero, tabs, and dark layout render.
- [ ] Set `custom.instagram` on collection — **Instagram** tab shows handle + Follow URL.
- [ ] Add `instagram_showcase` JSON — grid appears.
- [ ] Works filters: available / sold / season tags.
- [ ] Related artists load from `/api/shop/artists`.

---

## 10. Change log

| Version | Date | Notes |
|---------|------|--------|
| 1.0.0 | 2026-04-02 | Initial spec aligned with `artist-profile.html` layout and collection metafields. |

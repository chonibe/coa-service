# Artist profile — content map & Shopify metafields

**Purpose:** Map approved artist copy to **Shopify collection metafields**, Supabase, and products. **Content creators:** use the writer-only brief instead—[`artist-profile-content-creator-brief.md`](./artist-profile-content-creator-brief.md) (checklist + worksheet, no engineering detail).

**Implementation (engineering):**

| Area | Path |
|------|------|
| Profile UI (tabs, hero, works, related) | [`app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx`](../../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx) |
| Styles (parity with `artist-profile.html`) | [`app/(store)/shop/artists/[slug]/artist-profile.module.css`](../../../app/(store)/shop/artists/[slug]/artist-profile.module.css) |
| Page + fetch | [`app/(store)/shop/artists/[slug]/page.tsx`](../../../app/(store)/shop/artists/[slug]/page.tsx) |
| API + profile merge | [`app/api/shop/artists/[slug]/route.ts`](../../../app/api/shop/artists/[slug]/route.ts) |
| Payload helpers | [`lib/shop/artist-profile-api.ts`](../../../lib/shop/artist-profile-api.ts) |
| Collection GraphQL fields | [`lib/shopify/storefront-client.ts`](../../../lib/shopify/storefront-client.ts) — `CollectionFields` fragment |

**Version:** 1.3.0 · **Last updated:** 2026-04-02

---

## Research: what content to gather for each artist

This is the **editorial** checklist. For every artist, research and produce the items below. Quality bar: facts verified where possible, voice aligned with Street Collector (human, specific, not generic adjectives).

**Deepening history (exhibitions, press, CV):** start from the artist’s **About / Bio / CV / Press** pages when they exist. See **[`artist-research-about-pages.md`](./artist-research-about-pages.md)** for source order, checklists, and how those facts map to [`artist-research-sheet.csv`](./artist-research-sheet.csv) columns (**About Page URL (primary)**, **Additional History & CV (text)**, **Exhibitions**, **Press**).

### A. Identity & positioning (hero + eyebrow)

| What to produce | What to research / answer | Notes for writers |
|-----------------|---------------------------|-------------------|
| **Public name** | How they sign work and appear on Shopify; spelling and accents | Must match vendor/collection title |
| **Legal or alternate name** (optional) | Real name if different from moniker; how they introduce themselves in interviews | Feeds **alias** line under hero name |
| **City / region line** | Where they live or where the work is rooted (not vague “international”) | One line, e.g. “Lisbon, Portugal” or “Brooklyn, New York” |
| **Active since** | First serious public work: year they started exhibiting, mural practice, or first known documented piece—not birthday unless that’s the story | Short: year or range, e.g. `2012` or `2008–present` |
| **One-line hook** (hero italic) | The single sentence a collector should feel: origin story, stance, or tension—not a mission statement | ~120–180 characters; sounds like a quote or tight line; will sit under the name |

### B. Long-form story (Overview — main column)

| What to produce | What to research / answer | Notes for writers |
|-----------------|---------------------------|-------------------|
| **Core bio / story** (3–6 short paragraphs) | Geography, formative years, how they found walls/street/studio, relationship to the city or community, why print or edition matters to them, any pivot that defines their voice | Plain text; no HTML; short paragraphs; avoid clichés (“passionate,” “unique”)—use concrete scenes and facts |
| **Additional history / CV notes** (optional column) | Education, representation, studio timeline, awards, residencies, and any CV bullets not yet written as dated exhibition lines—often pasted from the **About** page then edited | Feeds **Additional History & CV (text)** in the research sheet; merged into the shop **bio** after **Story** when Shopify/Supabase bio is empty. Prefer moving **dated shows** into **Exhibitions (Text List)** instead of duplicating here. |
| **About page URL** (optional column) | Canonical About/Bio URL you used first | **About Page URL (primary)** — traceability for the next researcher |
| **Pull quote** | One line from them (interview) or a paraphrase so strong it can stand alone in large type | Must be emotionally specific; attribute mentally even if UI doesn’t show attribution |
| **Impact / give-back card** (optional) | Do they fund workshops, community print runs, youth programs, local causes? Percentage or program name if verified | One tight block; if unknown, omit |
| **Exclusivity card** (optional) | What’s true only on Street Collector for this artist—no gallery reprint, first time in print, format tied to lamp, etc. | Factual only; legal/comms should approve claims |

**Research sources to plan for:** artist **About / Bio / CV / Press** pages on their own site (see [`artist-research-about-pages.md`](./artist-research-about-pages.md)), gallery representation pages, interview transcripts, reputable press, their Instagram captions, Wikipedia only as a lead (verify).

### C. Process imagery (Overview — right column)

| What to produce | What to research / answer | Notes for writers |
|-----------------|---------------------------|-------------------|
| **Up to 4 images** | Studio, wall in progress, detail, proof, street context—whatever matches the story | Each needs **rights**: artist-approved or SC-owned; record caption (place/year) for **label** |

### D. Exhibition & mural history

| What to produce | What to research / answer | Notes for writers |
|-----------------|---------------------------|-------------------|
| **Chronological list** | Year, type (solo / group / mural / fair / residency), **title** of show or project, **venue** or commissioner, **city + country** | Use CV first; fill gaps with artist confirmation; don’t invent |

### E. Press & features

| What to produce | What to research / answer | Notes for writers |
|-----------------|---------------------------|-------------------|
| **Per item:** outlet name, year, **short verbatim or licensed quote**, link to article if public | Google News, outlet archives, artist’s press page | Quote must be exact or clearly paraphrased with permission; **url** optional but preferred |

### F. Social (Instagram)

| What to produce | What to research / answer | Notes for writers |
|-----------------|---------------------------|-------------------|
| **Handle** | Official account only; confirm with artist | One handle → drives Follow link |
| **Showcase grid** (optional) | 6–12 strong stills: process, walls, details—**URLs to images you’re allowed to use** (export from IG with permission or use SC campaign shots) | Not a substitute for the live feed; optional decoration for the tab |

### G. Works / catalogue (coordination with merch)

| What to produce | What to research / answer | Notes for writers |
|-----------------|---------------------------|-------------------|
| **Edition line per product** | Edition size, numbering language consistent across the catalogue | Short label, e.g. “Ed. 12 / 50” |
| **Season or series** | How you group drops for filters | Product **tags**: e.g. `Season 1`, `Season 2` |

### H. Not in this doc (handled elsewhere)

- **Product photography, pricing, inventory** — Shopify merchandising.
- **Related artists** — automated from shop; editorial can suggest “pairings” later if you add a metafield.

---

## Copy-paste template: one artist (research worksheet)

Duplicate this block into a doc or Notion page **per artist**. Fill before entering Shopify.

```markdown
## Artist: [moniker / vendor name]
**Slug / collection handle:** 
**Researcher / date:**

### Identity
- **Location line:** 
- **Alias (real name or subtitle):** 
- **Active since (year or range):** 
- **Hero hook (one line, ~120–180 chars):** 

### Story
- **Primary About / Bio URL (for traceability):** 
- **Paragraph 1 (origin / place):** 
- **Paragraph 2 (practice / medium / walls):** 
- **Paragraph 3 (voice / what the work does):** 
- **Paragraph 4 (Street Collector / why this collaboration):** 
- **Additional history & CV (education, representation, awards, non-show milestones — optional):** 
- **Pull quote:** 
- **Impact callout (optional):** 
- **Exclusive callout (optional):** 

### Process images (max 4)
1. URL: … | Label: …
2. URL: … | Label: …
3. URL: … | Label: …
4. URL: … | Label: …

### Exhibitions & murals (newest first)
| Year | Type | Title | Venue | City |
|------|------|-------|-------|------|
|      |      |       |       |      |

### Press
| Outlet | Year | Quote | URL |
|--------|------|-------|-----|
|        |      |       |     |

### Instagram
- **Handle:** 
- **Showcase image URLs (optional):** 

### Catalogue notes
- **Season tags to use on products:** 
- **Edition copy notes per handle:** (list product handles if needed)

### Sources & verification
- Interview date / notes: 
- CV / PDF path: 
- Links checked: 
```

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

### Grid content (what shoppers see)

**A — Manual (always wins if set):** `custom.instagram_showcase` on the **collection** — JSON array of tiles you control (Shopify CDN or any public image URL).

```json
[
  { "url": "https://cdn.shopify.com/.../image.jpg", "kind": "Post" },
  { "url": "https://cdn.shopify.com/.../thumb.jpg", "kind": "Reel", "link": "https://www.instagram.com/reel/ABC/" }
]
```

- **`url`** (required): Image address for the tile.
- **`kind`**: Optional overlay label (`Post`, `Reel`, etc.).
- **`link`**: Optional per-tile URL; if omitted, the tile uses the resolved profile URL (`instagram.com/{handle}/`).

**B — Automatic (only if A is empty):** [Instagram Business Discovery](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery) on the server. When **both** env vars below are set, `GET /api/shop/artists/[slug]` fetches up to 12 recent media items for the resolved **professional** (Business or Creator) handle and fills the same grid. **Personal accounts are not supported.** You need a Meta app, a long-lived token with the permissions Meta documents for Business Discovery, and your **own** connected Instagram user id as the token owner.

| Env | Purpose |
|-----|--------|
| `INSTAGRAM_BUSINESS_DISCOVERY_IG_USER_ID` **or** `INSTAGRAM_BUSINESS_ID` | Instagram **user** id of *your* connected professional account (API “caller”). Same value is often already set as `INSTAGRAM_BUSINESS_ID` on Vercel. |
| `INSTAGRAM_ACCESS_TOKEN` **or** `INSTAGRAM_MANUAL_ACCESS_TOKEN` | Long-lived user access token with Business Discovery access. |

Images are served via `/api/proxy-image` for `*.cdninstagram.com` / `*.fbcdn.net` so the browser loads them from your domain.

If neither A nor B yields tiles, the tab shows the native empty state + **View on Instagram** CTA.

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
| 1.2.0 | 2026-04-02 | Linked standalone **[`artist-profile-content-creator-brief.md`](./artist-profile-content-creator-brief.md)** for writers; this file remains implementer-focused. |
| 1.1.0 | 2026-04-02 | Added per-artist **research deliverables** and a **copy-paste worksheet** for content production. |
| 1.0.0 | 2026-04-02 | Initial spec aligned with `artist-profile.html` layout and collection metafields. |

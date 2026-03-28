# Experience V2

## Overview

Experience V2 is a redesigned artwork selection flow with a cleaner, more immersive interface. The 3D Spline lamp takes up the full viewport, artwork selection happens in an Instagram-style slide-up sheet, and selected artworks appear in a tappable carousel at the bottom.

This version reuses the same Spline 3D configuration, cart integration, contexts, and header/menu from Experience V1 while providing a streamlined selection flow.

## Route

`/shop/experience-v2`

## Architecture

```
experience-v2/
├── page.tsx                    # Server component, fetches products
├── layout.tsx                  # Layout with contexts + ExperienceSlideoutMenu
└── components/
    ├── ExperienceV2Client.tsx  # Main orchestrator component
    ├── SplineFullScreen.tsx    # Full-viewport Spline 3D wrapper (exact V1 config)
    ├── ArtworkInfoBar.tsx      # Top bar: artwork name + artist, switch between 2 lamp sides
    ├── ArtworkPickerSheet.tsx  # Instagram-style slide-up selector (ArtworkStrip cards)
    ├── ArtworkCarouselBar.tsx  # Bottom carousel overlay (`reserveCheckoutBar` offsets strip above sticky checkout)
    ├── ExperienceCheckoutStickyBar.tsx  # Fixed checkout CTA when cart has artworks
    ├── ExperienceOrderLampIcon.tsx      # Lamp silhouette (same glyph as OrderBar cart line)
    ├── ArtworkDetail.tsx       # Product sheet / inline panel (scarcity, edition narrative, CTA)
    └── EditionBadge.tsx        # Gallery-style edition stage copy (see lib/shop/edition-stages.ts)
```

**Shared lib:** [`edition-stages.ts`](../../../lib/shop/edition-stages.ts) — stage thresholds, template interpolation, email strings.

## Components

### ExperienceV2Client

Main orchestrator that manages all state:

- `cartOrder: string[]` — product IDs in cart (persisted to localStorage)
- `lampQuantity: number` — number of lamps (default 1)
- `activeCarouselIndex: number` — which carousel item is currently active
- `isPickerOpen: boolean` — controls the slide-up sheet
- `rotateToSide: 'A' | 'B' | null` — which lamp side to show
- `rotateTrigger: number` — counter to force rotation animation
- `detailProduct: ShopifyProduct | null` — artwork for detail drawer

Integrates with:
- `ExperienceOrderContext` for header cart chip and OrderBar
- `ArtworkDetail` drawer for artwork info
- `OrderBar` for checkout
- `ExperienceCheckoutStickyBar` — fixed bottom bar: **empty collection** (`stripMode === 'collection'`, no artworks yet) shows only **“Choose your first artwork”** (blue CTA, opens picker; no checkout on this row — use header cart if needed). **≥1 artwork:** thumbnails in cart order (lamp slots + artworks), `+` separators, **Checkout · $total →**, and **centered overlay** glass add FAB (`onOpenPicker`). Thumbnails match [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) **`aspect-[14/20]`** / **`rounded-[15px]`**; overflow `+N`. **Watchlist** with zero artworks does **not** render this bar. [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) sets `reserveCheckoutBar` when the sticky bar is present (empty collection or ≥1 artwork) so the strip clears the bar; carousel **choose** CTA and strip **+** stay off when reserved

**Implementation:** [`components/ExperienceV2Client.tsx`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)

### SplineFullScreen

Wrapper around `Spline3DPreview` using **exact same configuration** as Experience V1:

- Same object IDs: `side1ObjectId="2de1e7d2-4b53-4738-a749-be197641fa9a"`, `side2ObjectId="2e33392b-21d8-441d-87b0-11527f3a8b70"`
- Same texture settings: `swapLampSides`, `flipForSide="B"`, `flipForSideB="horizontal"`
- Loads image position from localStorage via `loadImagePosition()`
- Theme-aware (light/dark mode toggle)
- Rotate/quarter-turn controls
- Shared minimal canvas framing: `translateY(-10%)` with quarter-turn rotation in [`spline-3d-preview.tsx`](../../../app/template-preview/components/spline-3d-preview.tsx) (see [Experience README](../experience/README.md#spline-viewport-sizing-2026-03-19))

**Implementation:** [`components/SplineFullScreen.tsx`](../../../app/(store)/shop/experience-v2/components/SplineFullScreen.tsx)

Accepts optional `topBarContent` for custom top bar content (e.g. ArtworkInfoBar).

### ArtworkInfoBar

Top bar component showing artwork name and artist for the last clicked artwork in the carousel:

- Displays artwork title and artist (vendor) in the Spline top bar
- When 2 artworks are on the lamp: segmented control (1 | 2) to switch between them
- Defaults to the last clicked carousel item when it's one of the two on the lamp
- Tapping the info opens the ArtworkDetail drawer
- Theme-aware (light/dark)
- Rendered inside SplineFullScreen via `topBarContent` prop

**Implementation:** [`components/ArtworkInfoBar.tsx`](../../../app/(store)/shop/experience-v2/components/ArtworkInfoBar.tsx)

### ArtworkPickerSheet

Slide-up artwork selector using **same card design** as V1 ArtworkStrip:

- Full-screen bottom sheet with drag handle
- **Artist spotlight banner** at top (from `/api/shop/artist-spotlight`) — expand to filter by artist
- **Bar with Filter + Season 1/2** — same as V1 Configurator
- **FilterPanel** — artists, tags, price range, sort, in-stock, star rating (reused from V1)
- Virtualized **rows grouped by artist (vendor)** — two artworks per row when an artist has a pair; **vertical artist name** in the center spine (same layout as the former “both selected” merge). Odd count: one **centered** half-width card for that artist. Row building: [`experience-artwork-rows.ts`](../../../lib/shop/experience-artwork-rows.ts)
- Cards show: image, **artwork title** with **price on the line below** (artist name is **not** repeated in the card footer — it’s only on the center spine when two pieces share a row)
- **Unselected** cards show a **+** circle (top-right), matching spotlight placeholder tiles in [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) — tap the card to add to the bottom carousel; there is no separate “Add” row button
- **Numbered badges** (1, 2, 3…) on selected artworks
- Lamp position indicators (1, 2) for artworks on lamp sides
- **Unselected** — image + footer use the same **`bg-white` / `bg-[#171515]`** as the sheet. **Selected** — **brighter lift** (`#f0f9ff` light / `#2c2828` dark) on shell, image well, and title row (no ring); [`ArtworkStrip`](../../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) still uses the full-card peach **border** for **single** in-cart tiles only. **Merged same-vendor pair** (picker + strip): tinted **`#f0f9ff` / `#2c2828`** row when both selected; **no** outer border on 2-up rows; artist **spine** is text-only (no spine bg/borders). Footers: **centered** title + price; strip cards **no** border between image and meta
- **Surface tokens** (implementation): picker [`ArtworkPickerSheet.tsx`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) and strip [`ArtworkStrip.tsx`](../../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) both use [`experience-artwork-card-surfaces.ts`](../../../lib/shop/experience-artwork-card-surfaces.ts) for shell / image well / meta backgrounds, 2-up row tints, and strip meta `backdrop-filter` so colors and transitions stay in one place
- Tapping toggles selection and adds to cart
- "Done" button closes the sheet
- **Load more** — infinite scroll fetches `/api/shop/experience/collection-products` per season; when the list has no next page, a **Browse Season 1 / Season 2** button at the bottom switches the other collection (`onSeasonChange`; no extra caption)
- Theme-aware styling

**Implementation:** [`ArtworkPickerSheet.tsx`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)

### ArtworkCarouselBar

Horizontal tappable carousel at the bottom of the Spline view:

- Shows **one thumbnail per product** even when `cartOrder` lists the same artwork multiple times (quantity); dedupe uses first-seen order — [`experience-carousel-cart.ts`](../../../lib/shop/experience-carousel-cart.ts). **Trash** on a carousel tile removes **all** cart lines for that product. **OrderBar** quantity −1 still removes a single line via `handleRemoveCartOrderItemAtIndex`
- Shows selected artworks as thumbnails (`w-24` aspect 4/5); the strip renders **at most 7** at a time so the bar does not crowd the fixed **+** and viewport. When there are more than seven, a sliding window keeps **`activeIndex`** in view (center-biased); tap/remove still use the real collection index
- First two display on lamp (green numbered badges)
- Tapping rotates lamp to show that artwork
- **Picker entry:** **Empty collection** — “Choose your first artwork” lives on [`ExperienceCheckoutStickyBar`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) (first control; disappears after the first artwork). **No sticky bar** fallback (e.g. watchlist empty): same CTA can still appear above the strip in [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) when `!reserveCheckoutBar`. **≥1 artwork:** add is the **center overlay FAB** on the sticky bar; strip **+** stays hidden while `reserveCheckoutBar`
- Bar show/hide uses CSS `transition-transform` (no Framer Motion on this overlay)
- Theme-aware styling; **bottom gradient fade** (`bg-gradient-to-t` from the same `#F5F5F5` / `#171515` as the Spline column) lifts the strip off the 3D preview without a hard shadow

**Implementation:** [`ArtworkCarouselBar.tsx`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx)

### ArtworkDetail + EditionBadge

- **`ArtworkDetail`** — full-screen sheet, desktop slideout, or inline panel; scarcity bar, artist spotlight, add-to-order CTA.
- **`EditionBadge`** — minimal “gallery label” block: stage pill, subline, and CTA copy driven by sold count vs edition size. Shown when the product has **`custom.edition_size`** and Shopify reports **`quantityAvailable`** on the first variant; **hidden** for lamp/bundle rows (`productIncludes` set). Sold count = `edition_size - quantityAvailable` (capped to edition size).
- Stage bands match a 44-edition reference run but **scale by sold/total ratio** for other sizes; the **last two units** use the `final` band only when `totalEditions >= 3` and `sold >= total - 2` (avoids calling a 2-piece launch “final” at 0 sold).

**Implementation:** [`ArtworkDetail.tsx`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) · [`EditionBadge.tsx`](../../../app/(store)/shop/experience-v2/components/EditionBadge.tsx) · [`edition-stages.ts`](../../../lib/shop/edition-stages.ts)

**Tests:** No dedicated unit tests yet; verify manually on an artwork with edition metafield and inventory.

## Lamp Side Assignment Logic

The lamp has two sides (A and B). With `swapLampSides=true`:

- `image1` renders on Side B object
- `image2` renders on Side A object

When tapping a carousel item, `handleLampSelect` **toggles** lamp assignment (see [`ExperienceV2Client.tsx`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)): if the artwork is **not** on the lamp yet, it is placed in a free slot (or replaces the hidden side when both slots are full); if it **is** already on the lamp, it is **removed** from `lampPreviewOrder` so that side’s textures clear and the Spline model shows its **base** mesh for that side. The artwork stays in the cart.

Persisted carts: if `lampPreviewOrder` is present in `localStorage` (including as an empty array), that value is honored on load; older saves without the key still default preview to the first two cart IDs.

## Cart Integration

- Artworks are added to cart when selected in the picker
- Cart persisted to `localStorage` under key `sc-experience-cart-v2`
- Default lamp quantity is 1 (can adjust in OrderBar)
- GA4 `add_to_cart` events fire on selection
- OrderBar shows full checkout with Stripe integration
- Header shows ExperienceCartChip with order total

## Performance Notes

- `experience-v2/layout.tsx` does not preload `scene.splinecode` in HTML anymore.
- `SplineFullScreen` keeps the facade-first behavior and only mounts Spline after idle/tap.
- **Idle turntable drift** on the lamp model is enabled only when **no** artwork is on the lamp preview (`lampPreviewOrder` empty). As soon as one artwork is placed, `idleSpinEnabled` is false so the scene stays steady ([`SplineFullScreen.tsx`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) via `lampPreviewCount`).
- `ExperienceV2Client` now reads `sc-experience-cart-v2` once at mount instead of parsing localStorage on every render.

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ExperienceV2Client                            │
│  productsSeason1/2, pageInfoSeason1/2, activeSeason, filters         │
│  spotlightData (from /api/shop/artist-spotlight)                     │
│  cartOrder[], lampQuantity, activeCarouselIndex, rotateToSide        │
│  ↓ setOrderBarProps() → ExperienceOrderContext                       │
└────────────┬────────────────────┬────────────────────────────────────┘
             │                    │
             ▼                    ▼
┌────────────────────┐   ┌─────────────────────────┐
│  SplineFullScreen  │   │    ArtworkCarouselBar   │
│  (image1, image2)  │◄──┤  (tap → handleTapItem)  │
│  + ArtworkInfoBar  │   └────────────┬────────────┘
│  (top bar)         │
└────────────────────┘
                                      │ onOpenPicker()
                                      ▼
                         ┌─────────────────────────┐
                         │   ArtworkPickerSheet    │
                         │  ArtistSpotlightBanner  │
                         │  Filter + Season 1/2   │
                         │  (toggle → adds to cart)│
                         └─────────────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │     ArtworkDetail       │
                         │     FilterPanel         │
                         │     OrderBar            │
                         └─────────────────────────┘
```

## Key Differences from Experience V1

| Aspect | V1 (`/shop/experience`) | V2 (`/shop/experience-v2`) |
|--------|-------------------------|----------------------------|
| Spline position | Split view with selector | Full viewport |
| Artwork selection | Inline cards with Add button | Slide-up sheet (same cards; + badge on unselected tiles, no row Add button) |
| Artist spotlight | Yes (above ArtworkStrip) | Yes (above grid in picker) |
| Seasons (1/2) | Yes (tabs in bar) | Yes (tabs in picker bar) |
| Filters | Yes (FilterPanel) | Yes (FilterPanel in picker) |
| Load more | Yes (per season) | Yes (per season) |
| Spline config | Same | Same (exact reuse) |
| Cart integration | Yes | Yes (same OrderBar, same contexts) |
| Header/Menu | ExperienceSlideoutMenu | ExperienceSlideoutMenu (reused) |
| Selection model | lampPreviewOrder + cartOrder | Unified cartOrder |

## Reused from Experience V1

- `ExperienceOrderProvider`, `ExperienceThemeProvider`, `ExperienceAuthProvider` contexts
- `ExperienceSlideoutMenu` header with hamburger menu and cart chip
- `Spline3DPreview` with same texture/rotation configuration
- `ArtworkDetail` drawer
- `OrderBar` checkout
- `ArtistSpotlightBanner` — artist spotlight at top of picker
- `FilterPanel` — artists, tags, price, sort, in-stock, star rating
- `applyFilters`, `FilterState` — filtering logic
- Image position settings from localStorage
- Analytics tracking (`trackAddToCart`)

## Testing

Navigate to `/shop/experience-v2` in the dev server:

```bash
npm run dev
# Open http://localhost:3001/shop/experience-v2
```

## Version

- Created: 2026-03
- Status: Experimental / Testing branch
- Updated: 2026-03-19 — Reduced initial load contention by removing eager Spline scene preload and minimizing repeated localStorage reads.
- Updated: 2026-03-20 — Centralized artwork card / 2-up row background classes in [`experience-artwork-card-surfaces.ts`](../../../lib/shop/experience-artwork-card-surfaces.ts) (picker + strip).
- Updated: 2026-03-20 — Smaller selection UI: picker numbered badge **`w-4`/`text-[9px]`**; strip lamp badge **`w-4`/`text-[9px]`**; strip footer controls **`h-5`/`w-4`**; softer **scale** pulses on wizard highlights and add check.
- Updated: 2026-03-20 — **EditionBadge** in artwork detail action areas (desktop inline/slideout + mobile sticky bar); copy + thresholds in [`edition-stages.ts`](../../../lib/shop/edition-stages.ts).
- Updated: 2026-03-24 — Picker [`ArtworkPickerSheet`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx): **+** affordance on unselected artwork thumbnails (aligned with carousel spotlight placeholders).
- Updated: 2026-03-27 — **Cart / checkout artwork USD** matches the Street ladder from [`/api/shop/edition-states`](../../../app/api/shop/edition-states/route.ts): [`experienceArtworkUnitUsd`](../../../lib/shop/experience-artwork-unit-price.ts) in [`OrderBar`](../../../app/(store)/shop/experience-v2/components/OrderBar.tsx) (lock → ladder → storefront) drives line subtotals, Stripe [`create-checkout-session`](../../../app/api/checkout/create-checkout-session/route.ts) line `price` fields, and header totals in both [`ExperienceV2Client`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) entry points.
- Updated: 2026-03-27 — **Experience checkout sticky bar**: [`ExperienceCheckoutStickyBar`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) shows **lamp + artwork thumbnails** in cart order (`+` separators, overflow `+N`); thumbnails match carousel **`aspect-[14/20]`** / **`rounded-[15px]`**; shared [`ExperienceOrderLampIcon`](../../../app/(store)/shop/experience-v2/components/ExperienceOrderLampIcon.tsx) with [`OrderBar`](../../../app/(store)/shop/experience-v2/components/OrderBar.tsx); both [`ExperienceV2Client`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) routes pass `lamp` + `lampQuantity`.
- Updated: 2026-03-28 — [`ExperienceCheckoutStickyBar`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx): **`stripMode`**; **empty collection** = only “Choose your first artwork” (no checkout on bar); **≥1 artwork** = thumbnails + checkout + centered **`onOpenPicker`** FAB; clients pass **`stripMode`**, **`reserveCheckoutBar`**, **`handleOpenPicker`**.
- Updated: 2026-03-28 — [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx): strip shows **at most 7** thumbnails with a window that follows **`activeIndex`** when the collection is larger.
- Updated: 2026-03-28 — [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx): strip **+** hidden when **`reserveCheckoutBar`** (picker add moves to sticky bar).
- Updated: 2026-03-27 — [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx): empty collection uses a **labeled primary CTA** (“Choose your first artwork” + chevron) instead of an icon-only **+** to open the picker.
- Updated: 2026-03-27 — **Picker Street ladder UI** in [`ArtworkPickerSheet`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx): ladder cards show **list price** in the footer and **`N more · then $X`** / **`N more · edition ends`** directly **under** the price (no “Still wide open” edition chip on those cards). Non-ladder cards keep [`EditionBadgeForProduct`](../../../app/(store)/shop/experience-v2/components/EditionBadge.tsx) `chipOnly` on the **image** bottom. Early-access strikethrough unchanged. [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) does not show ladder captions on thumbnails.
- Updated: 2026-03-27 — **Street pricing ladder** (S1/S2): [`StreetPricingChip`](../../../app/(store)/shop/experience-v2/components/StreetPricingChip.tsx) + [`street-collector-pricing-stages.ts`](../../../lib/shop/street-collector-pricing-stages.ts) (**granular bands** — same five stages, multiple USD rungs per stage keyed on sold count), data from [`GET /api/shop/edition-states`](../../../app/api/shop/edition-states/route.ts). **The Reserve**: [`/shop/reserve`](../../../app/(store)/shop/reserve/page.tsx), Stripe subscription + lock APIs under [`app/api/shop/reserve/`](../../../app/api/shop/reserve/), schema [`20260327183000_street_collector_reserve.sql`](../../../supabase/migrations/20260327183000_street_collector_reserve.sql), [`OrderBar`](../../../app/(store)/shop/experience-v2/components/OrderBar.tsx) honors active locks; lock expiry reminder cron [`street-reserve-reminders`](../../../app/api/cron/street-reserve-reminders/route.ts) (see [`vercel.json`](../../../vercel.json)). Watchlist stage emails add ladder line in [`edition-watchlist-notifications.ts`](../../../lib/shop/edition-watchlist-notifications.ts). Collector JSON adds `streetReserveLocks` in [`collector/dashboard/route.ts`](../../../app/api/collector/dashboard/route.ts).
- Updated: 2026-03-27 — **Artist filter / spotlight vendor matching**: [`applyFilters`](../../../app/(store)/shop/experience-v2/components/FilterPanel.tsx) and both [`ExperienceV2Client`](../../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) spotlight handlers use [`experienceVendorsLooselyEqual`](../../../lib/shop/experience-spotlight-match.ts) so Shopify `vendor` strings align with spotlight/API labels (e.g. **Jack J.C. Art** vs **Jack AC Art**, **Kymo** vs **Kymo One**, **Tiago** vs **Tiagi** typo). [`productMatchesSpotlight`](../../../lib/shop/experience-spotlight-match.ts) delegates to the same helper for non–product-id matches.
- Updated: 2026-03-27 — **Edition-states for full catalog**: [`ExperienceV2Client`](../../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) (both entry points) loads [`GET /api/shop/edition-states`](../../../app/api/shop/edition-states/route.ts) in **batches** of [`EDITION_STATES_MAX_IDS_PER_REQUEST`](../../../lib/shop/street-edition-states.ts) via [`fetchStreetEditionStatesMap`](../../../lib/shop/fetch-street-edition-states-client.ts), so Season 2 (and beyond) products are not limited to the first 120 IDs; picker ladder rows no longer fall back to image [`EditionBadge`](../../../app/(store)/shop/experience-v2/components/EditionBadge.tsx) solely due to the cap.
- Updated: 2026-03-28 — **Supabase `products` for edition-states**: Shopify product webhooks ([`app/api/webhooks/shopify/products/route.ts`](../../../app/api/webhooks/shopify/products/route.ts)) call [`upsertShopifyProductIntoSupabaseProducts`](../../../lib/shop/upsert-shopify-product-to-supabase-products.ts) after barcode processing so `public.products` stays aligned with Shopify (`product_id`, `edition_size` from metafields, `edition_counter` unchanged on update). Bulk backfill: `npm run sync:shopify-products-to-supabase` ([`scripts/sync-shopify-products-with-metafields.js`](../../../scripts/sync-shopify-products-with-metafields.js); needs `SHOPIFY_SHOP`, `SHOPIFY_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`).
- Updated: 2026-03-27 — **Scarcity bar + detail** mirror picker ladder copy: [`buildStreetLadderForScarcity`](../../../lib/shop/experience-street-ladder-display.ts), [`ScarcityBadge`](../../../app/(store)/shop/experience-v2/components/ScarcityBadge.tsx) `streetLadder` + [`StreetLadderScarcityAddon`](../../../app/(store)/shop/experience-v2/components/StreetLadderScarcityAddon.tsx); [`experienceEarlyAccessForProduct`](../../../lib/shop/experience-spotlight-match.ts). Wired from both [`ExperienceV2Client`](../../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) entry points into [`SplineFullScreen`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx), [`ArtworkAccordions`](../../../app/(store)/shop/experience/components/ArtworkAccordions.tsx), and [`ArtworkDetail`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx).

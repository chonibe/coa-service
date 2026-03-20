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
    └── ArtworkCarouselBar.tsx  # Bottom carousel overlay
```

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
- **No Add button** — tap card/Eye to toggle selection
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
- Shows selected artworks as thumbnails (`w-24` aspect 4/5)
- First two display on lamp (green numbered badges)
- Tapping rotates lamp to show that artwork
- **+** opens the picker: **always centered above** the horizontal strip — **glassmorphism** circular control (`backdrop-blur-xl`, translucent fill, light border, inset highlight + soft shadow). When the cart is **empty**, **“Start your Collection”** appears centered under that button. The strip holds **only** selected artworks and spotlight placeholders (no add tile in the row)
- Animated with Framer Motion `AnimatePresence`
- Theme-aware styling; **bottom gradient fade** (`bg-gradient-to-t` from the same `#F5F5F5` / `#171515` as the Spline column) lifts the strip off the 3D preview without a hard shadow

**Implementation:** [`ArtworkCarouselBar.tsx`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx)

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
| Artwork selection | Inline cards with Add button | Slide-up sheet (same cards, no Add) |
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

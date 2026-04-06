# Experience V2

## Overview

Experience V2 is a redesigned artwork selection flow with a cleaner, more immersive interface. The 3D Spline lamp takes up the full viewport, artwork selection happens in an Instagram-style slide-up sheet, and selected artworks appear in a tappable carousel at the bottom.

This version reuses the same Spline 3D configuration, cart integration, contexts, and header/menu from Experience V1 while providing a streamlined selection flow.

## Route

`/shop/experience-v2`

## Admin: pair Shopify collection to an artist (experience links & bio)

The public `?artist=` parameter must match the **Shopify collection handle**. Admins can paste an **Admin collection URL** (for example `https://admin.shopify.com/store/…/collections/686811218306`), a **storefront** `/collections/your-handle` URL, or a numeric collection id on **Artist Experience Links** (`/admin/vendors/experience-links`). **Preview** checks title, handle, image, and description from Shopify; **Save link** writes `vendor_collections` (`shopify_collection_id`, `shopify_collection_handle`, `collection_title`).

- **UI:** [`app/admin/vendors/experience-links/page.tsx`](../../../app/admin/vendors/experience-links/page.tsx)
- **API:** `POST /api/admin/vendor-collections/link-collection` — [`app/api/admin/vendor-collections/link-collection/route.ts`](../../../app/api/admin/vendor-collections/link-collection/route.ts)
- **Parsing / Shopify REST:** [`lib/shopify/parse-shopify-collection-url.ts`](../../../lib/shopify/parse-shopify-collection-url.ts), [`lib/shopify/resolve-pasted-collection.ts`](../../../lib/shopify/resolve-pasted-collection.ts)

`GET /api/shop/artists` uses the paired handle as `slug` when present (see [`lib/shop/artists-list.ts`](../../../lib/shop/artists-list.ts)) so copied experience links stay aligned with the collection.

Vendor resolution for save (see [`lib/shop/admin-resolve-vendor-for-collection-link.ts`](../../../lib/shop/admin-resolve-vendor-for-collection-link.ts)): match `vendors.vendor_name`, existing `vendor_collections` by handle, slugified name vs `artistSlug` / collection handle, then **create** a minimal `vendors` row (`status: active`) if still missing (default). Set `createVendorIfMissing: false` in the POST body to only link when a vendor already exists.

**Tests:** [`lib/shopify/parse-shopify-collection-url.test.ts`](../../../lib/shopify/parse-shopify-collection-url.test.ts) (`npx jest lib/shopify/parse-shopify-collection-url.test.ts`).

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
    ├── HorizontalTwoSlideGallery.tsx  # Shared 2-panel translate gallery (Experience accordions + detail sheet)
    └── EditionBadge.tsx        # Gallery-style edition stage copy (see lib/shop/edition-stages.ts)
```

**Shared lib:** [`edition-stages.ts`](../../../lib/shop/edition-stages.ts) — stage thresholds, template interpolation, email strings.

## Journey CTA pulse (next action)

A single **priority-ordered** funnel step drives **pulse + shine** on the correct control: `animate-experience-artwork-cta-pulse` plus `.experience-journey-cta-shine` in [`app/globals.css`](../../../app/globals.css) for primary CTAs (sticky, checkout, lamp). **After the lamp is in cart**, the selector’s artwork cards use **`.experience-journey-artwork-*`** instead: occasional **card tilt** (staggered), **white/cream shine** only on the **glass title chip** (matching the chip), and a **slower pulse only on the `+`** — not the purple full-card pulse or the bottom-row Add button. **`@media (prefers-reduced-motion: reduce)`** applies globally to animations.

- **Resolver:** [`lib/shop/experience-journey-next-action.ts`](../../../lib/shop/experience-journey-next-action.ts) — `resolveExperienceNextAction`, `EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS`
- **Tests:** [`lib/shop/experience-journey-next-action.test.ts`](../../../lib/shop/experience-journey-next-action.test.ts) (`npx jest lib/shop/experience-journey-next-action.test.ts`)
- **Context:** [`ExperienceOrderContext.tsx`](../../../app/(store)/shop/experience-v2/ExperienceOrderContext.tsx) — `pickerEngaged` / `setPickerEngaged` (picker open paths, Configurator mount), `orderDrawerOpen` / `setOrderDrawerOpen` (OrderBar drawer)
- **Wired UI:** [`ExperienceCheckoutStickyBar.tsx`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx), [`ArtworkCarouselBar.tsx`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx), [`Configurator.tsx`](../../../app/(store)/shop/experience-v2/components/Configurator.tsx), [`ArtworkStrip.tsx`](../../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx), [`ArtworkPickerSheet.tsx`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx), [`ArtworkDetail.tsx`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx), [`ExperienceV2Client.tsx`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx), [`LampGridCard.tsx`](../../../app/(store)/shop/experience-v2/components/LampGridCard.tsx), [`LampSelectorPromoBanner.tsx`](../../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.tsx), [`OrderBar.tsx`](../../../app/(store)/shop/experience-v2/components/OrderBar.tsx)

## Components

### ExperienceV2Client

Main orchestrator that manages all state:

- `cartOrder: string[]` — product IDs in cart (persisted to localStorage)
- `lampQuantity: number` — number of lamps (**default 0** from [`loadExperienceCart`](../../../lib/shop/experience-cart-persistence.ts); user adds the Street Lamp explicitly)
- `activeCarouselIndex: number` — which carousel item is currently active
- `isPickerOpen: boolean` — controls the slide-up sheet
- `rotateToSide: 'A' | 'B' | null` — which lamp side to show
- `rotateTrigger: number` — counter to force rotation animation
- `detailProduct: ShopifyProduct | null` — artwork for detail drawer

Integrates with:
- `ExperienceOrderContext` for header cart chip and OrderBar
- `ArtworkDetail` drawer for artwork info
- `OrderBar` for checkout
- `ExperienceCheckoutStickyBar` — fixed bottom bar: **empty collection** (`stripMode === 'collection'`, no artworks yet) shows only **“Choose your first artwork”** (blue CTA, opens picker; no checkout on this row — use header cart if needed). **≥1 artwork:** thumbnails in cart order at **all breakpoints** — **one tile per `lampQuantity`** (0 = no lamp tile) **+** each selected artwork, `+` separators between tiles, overflow `+N`. **Checkout · $total →** and **centered overlay** glass add FAB (`onOpenPicker`). Thumbnails match [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) **`aspect-[14/20]`** / **`rounded-[15px]`**. **Watchlist** with zero artworks does **not** render this bar. [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) sets `reserveCheckoutBar` when the sticky bar is present (empty collection or ≥1 artwork) so the strip clears the bar; carousel **choose** CTA and strip **+** stay off when reserved

**Implementation:** [`components/ExperienceV2Client.tsx`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)

### SplineFullScreen

Wrapper around `Spline3DPreview` using **exact same configuration** as Experience V1:

- **No cursor/touch orbit** on the lamp (`interactive={false}` in [`SplineFullScreen`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx)); idle turntable and UI rotation only. The v2 shell’s [`Configurator`](../../../app/(store)/shop/experience-v2/components/Configurator.tsx) also leaves `interactive` off.
- **Featured artist bundle**: [`FeaturedArtistBundleSection`](../../../app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx) below the 3D preview when the server has a **non-null offer** and **lamp + two resolved spotlight prints**; the **Add to cart** button respects **`offer.disabled`** when the trio is already in cart or prints are not purchasable.
- Same object IDs: `side1ObjectId="2de1e7d2-4b53-4738-a749-be197641fa9a"`, `side2ObjectId="2e33392b-21d8-441d-87b0-11527f3a8b70"`
- Same texture settings: `swapLampSides`, `flipForSide="B"`, `flipForSideB="horizontal"`
- Loads image position from localStorage via `loadImagePosition()`
- Theme-aware (light/dark mode toggle)
- Rotate/quarter-turn controls
- Shared minimal canvas framing: `translateY(-3%)` with quarter-turn rotation in [`spline-3d-preview.tsx`](../../../app/template-preview/components/spline-3d-preview.tsx) (see [Experience README](../experience/README.md#spline-viewport-sizing-2026-03-19))

**Implementation:** [`components/SplineFullScreen.tsx`](../../../app/(store)/shop/experience-v2/components/SplineFullScreen.tsx)

Accepts optional `topBarContent` for custom top bar content (e.g. ArtworkInfoBar).

### ArtworkInfoBar

Top bar component showing artwork name and artist for the last clicked artwork in the carousel:

- Displays artwork title and artist (vendor) in the Spline top bar
- When 2 artworks are on the lamp: segmented control (1 | 2) to switch between them
- Defaults to the last clicked carousel item when it's one of the two on the lamp
- Tapping the **title** (desktop header center or mobile hero) or the **info** control opens the ArtworkDetail drawer; **`handleViewDetail`** also advances the vertical reel to the **details** section so the accordion lines up with the slideout
- **Right-rail stack** (`thumbnailPlacement="right"`, portaled to `#spline-thumbnail-slot`): Spline, Info, then **one** product-gallery thumbnail (no separate edition jump thumb — edition lives in the details scarcity card). Tap jumps to that gallery reel slide; the thumb stays highlighted while the reel is on **any** extra gallery image slide. If there are more than two images total, a small **`+N`** badge counts additional gallery slides beyond the first extra. Inline placement still shows **one thumb per** gallery image and may show the edition jump when `editionLeadBeforeSpline`.
- Theme-aware (light/dark)
- Rendered inside SplineFullScreen via `topBarContent` prop

**Implementation:** [`ArtworkInfoBar.tsx`](../../../app/(store)/shop/experience/components/ArtworkInfoBar.tsx)

### ArtworkPickerSheet

Slide-up artwork selector using **same card design** as V1 ArtworkStrip:

- Full-screen bottom sheet with drag handle
- **Top promo:** When **`lampQuantity === 0`**, [`LampSelectorPromoBanner`](../../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.tsx) replaces the artist spotlight — short line **“Start with the lamp, then add your artworks.”**, product title, primary CTA **“Add lamp to cart — $X”** (live lamp price), and a tappable header that opens [`ArtworkDetail`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) (bottom sheet on mobile, side panel on desktop). When the lamp is in the cart, the **artist spotlight banner** returns (from `/api/shop/artist-spotlight`) — expand to filter by artist
- **Bar with Filter + Season 1/2** — same as V1 Configurator
- **FilterPanel** — artists, tags, price range, sort, in-stock, star rating (reused from V1). **`productsForFilterPanel`** is the **union of Season 1 + Season 2** (deduped by Shopify product id) for tags/fallback. **Artist checklist** prefers **`artistCatalog`** from [`GET /api/shop/experience/collection-vendors`](../../../app/api/shop/experience/collection-vendors/route.ts), which **paginates both collections** with minimal Storefront fields so every vendor appears even when the SSR bundle only loads the first page of products (e.g. `first: 24` per season).
- Virtualized **rows grouped by artist (vendor)** — two artworks per row when an artist has a pair; **vertical artist name** in the center spine (same layout as the former “both selected” merge). Odd count: one **centered** half-width card for that artist. Row building: [`experience-artwork-rows.ts`](../../../lib/shop/experience-artwork-rows.ts)
- Cards show: image with **artwork title** in a glass chip at the **bottom** of the image; **price** stays in the footer below the image (artist name is **not** repeated in the card footer — it’s only on the center spine when two pieces share a row)
- **Unselected** cards show a **+** at the **end of the title chip** (same glass row as the artwork title); tap the card to add to the bottom carousel. Spotlight placeholder tiles in [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) use the same layout on the image
- **Numbered badges** (1, 2, 3…) on selected artworks
- Lamp position indicators (1, 2) for artworks on lamp sides
- **Unselected** — image + footer use the same **`bg-white` / `bg-[#171515]`** as the sheet. **Selected** — **brighter lift** (`#f0f9ff` light / `#2c2828` dark) on shell, image well, and footer (no ring); [`ArtworkStrip`](../../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) still uses the full-card peach **border** for **single** in-cart tiles only. **Merged same-vendor pair** (picker + strip): tinted **`#f0f9ff` / `#2c2828`** row when both selected; **no** outer border on 2-up rows; artist **spine** is text-only (no spine bg/borders). **Title** on image (bottom chip); footers: **price** (+ ladder copy when applicable); strip cards **no** border between image and meta
- **Surface tokens** (implementation): picker [`ArtworkPickerSheet.tsx`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) and strip [`ArtworkStrip.tsx`](../../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) both use [`experience-artwork-card-surfaces.ts`](../../../lib/shop/experience-artwork-card-surfaces.ts) for shell / image well / meta backgrounds, 2-up row tints, and strip meta `backdrop-filter` so colors and transitions stay in one place
- Tapping toggles selection and adds to cart
- "Done" button closes the sheet
- **Load more** — infinite scroll fetches `/api/shop/experience/collection-products` per season; when the list has no next page, a **Browse Season 1 / Season 2** button at the bottom switches the other collection (`onSeasonChange`; no extra caption)
- Theme-aware styling

**Implementation:** [`ArtworkPickerSheet.tsx`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) · [`LampSelectorPromoBanner.tsx`](../../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.tsx)

**Tests:** [`LampSelectorPromoBanner.test.tsx`](../../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.test.tsx)

### ArtworkCarouselBar

Horizontal tappable carousel at the bottom of the Spline view:

- Shows **one thumbnail per product** even when `cartOrder` lists the same artwork multiple times (quantity); dedupe uses first-seen order — [`experience-carousel-cart.ts`](../../../lib/shop/experience-carousel-cart.ts). **Trash** on a carousel tile removes **all** cart lines for that product. **OrderBar** quantity −1 still removes a single line via `handleRemoveCartOrderItemAtIndex`
- Shows selected artworks as thumbnails (`w-24` aspect 4/5); the strip renders **at most 7** at a time so the bar does not crowd the fixed **+** and viewport. When there are more than seven, a sliding window keeps **`activeIndex`** in view (center-biased); tap/remove still use the real collection index
- First two display on lamp (green numbered badges)
- Tapping rotates lamp to show that artwork
- **Picker entry:** **Empty collection** — “Choose your first artwork” lives on [`ExperienceCheckoutStickyBar`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) (first control; disappears after the first artwork). **No sticky bar** fallback (e.g. watchlist empty): same CTA can still appear above the strip in [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) when `!reserveCheckoutBar`. **≥1 artwork:** add is the **center overlay FAB** on the sticky bar; strip **+** stays hidden while `reserveCheckoutBar`
- Bar show/hide uses CSS `transition-transform` (no Framer Motion on this overlay)
- Theme-aware styling; **bottom gradient fade** (`bg-gradient-to-t` from the same `#F5F5F5` / `#171515` as the Spline column) lifts the strip off the 3D preview without a hard shadow
- **Mini 3D strip tile** — first slot in **collection** mode: **smaller** than artwork thumbs (`w-14` vs `w-24`), **on by default** (same spirit as spotlight “+” placeholders). **Trash** removes the tile from the strip; **+** on the dimmed placeholder adds it back. Tap the tile to jump the reel to the main Spline (`scrollIntoView` on [`data-experience-reel-spline-section`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) + `onJumpToSpline`). **Turntable:** continuous **Y spin** via `.experience-carousel-mini-turntable` in [`globals.css`](../../../app/globals.css) (tile has **no hover** styling; `prefers-reduced-motion` disables animation). Visual: optional Spline **embed** iframe when `NEXT_PUBLIC_EXPERIENCE_CAROUSEL_MINI_SPLINE_EMBED_URL` is set; otherwise the static lamp facade (`/internal.webp`). Visibility is persisted in **`sessionStorage`** — [`experience-carousel-mini-spline.ts`](../../../lib/shop/experience-carousel-mini-spline.ts)

**Implementation:** [`ArtworkCarouselBar.tsx`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx)

### ArtworkDetail + EditionBadge

- **`ArtworkDetail`** — full-screen sheet, desktop slideout, or inline panel; scarcity bar, artist spotlight, **Add to cart** CTA (price on the button; selected state **Added to cart — Tap to remove**). **Header:** artwork **title** first, **artist (vendor)** on the line below. **Lamp / bundle base products** (`productIncludes` set): no artist line, no artist spotlight fetch or banner, no artwork+artist gallery; **Product details** (description) under the hero in the scroll column on **mobile**, or with the details panel in the **desktop / inline** right column; **What's included** and **Specifications** are a **single** combined panel ([`LampIncludesSpecsPanel`](../../../app/(store)/shop/experience-v2/components/LampIncludesSpecsPanel.tsx)) — on **mobile** that panel sits in the **sticky sheet bar directly under the title** with its own max-height scroll; on **desktop / inline** it sits below the description in the scrollable column (no accordions). Hero image uses **3:4** aspect (mobile sheet, desktop slideout, inline panel). Prints keep fixed-height hero + collapsible **Artwork details** / artist blocks. When both **Artwork details** (description) and **artist spotlight** are available, those two blocks use shared **`HorizontalTwoSlideGallery`**: chevrons only; CSS `translate3d` (not overflow scroll) so navigation works inside `overflow-x-hidden` parents. Edition story + watch: [`EditionWatchWithNarrative`](../../../app/(store)/shop/experience-v2/components/EditionWatchWithNarrative.tsx) under the scarcity bar ([`ScarcityBadge`](../../../app/(store)/shop/experience-v2/components/ScarcityBadge.tsx) **`belowStreetLadder`** when the Street ladder shows, or below the bar when it does not). The separate **Artwork edition** framed block ([`ArtworkEditionUnifiedSection`](../../../app/(store)/shop/experience-v2/components/ArtworkEditionUnifiedSection.tsx) + [`EditionBadgeForProduct`](../../../app/(store)/shop/experience-v2/components/EditionBadge.tsx)) is **not** used in `ArtworkDetail` so copy is not duplicated.
- **`EditionBadge`** — minimal “gallery label” block: stage pill, subline, and CTA copy driven by sold count vs edition size. Shown when the product has **`custom.edition_size`** and Shopify reports **`quantityAvailable`** on the first variant; **hidden** for lamp/bundle rows (`productIncludes` set). Sold count = `edition_size - quantityAvailable` (capped to edition size).
- Stage bands match a 44-edition reference run but **scale by sold/total ratio** for other sizes; the **last two units** use the `final` band only when `totalEditions >= 3` and `sold >= total - 2` (avoids calling a 2-piece launch “final” at 0 sold).

**Product video + photos:** When the product has **Shopify video** (or external embed), [`ProductStandaloneVideoEmbed`](../../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx) renders it **outside** the swipe carousel (native `<video controls>` / HLS via `hls.js` when needed / iframe for external). [`ProductDetailCarousel`](../../../app/(store)/shop/experience-v2/components/ProductDetailCarousel.tsx) is **images only** ([`splitProductCarouselMediaSlides`](../../../lib/shop/product-carousel-slides.ts) splits slides from [`buildProductCarouselSlides`](../../../lib/shop/product-carousel-slides.ts)).

**Implementation:** [`ArtworkDetail.tsx`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) · [`ProductStandaloneVideoEmbed.tsx`](../../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx) · [`ProductDetailCarousel.tsx`](../../../app/(store)/shop/experience-v2/components/ProductDetailCarousel.tsx) · [`LampIncludesSpecsPanel.tsx`](../../../app/(store)/shop/experience-v2/components/LampIncludesSpecsPanel.tsx) · [`EditionWatchWithNarrative.tsx`](../../../app/(store)/shop/experience-v2/components/EditionWatchWithNarrative.tsx) · [`EditionBadge.tsx`](../../../app/(store)/shop/experience-v2/components/EditionBadge.tsx) (picker/strip/chip contexts) · [`edition-stages.ts`](../../../lib/shop/edition-stages.ts)

**Tests:** No dedicated unit tests yet; verify manually on an artwork with edition metafield and inventory.

## Lamp Side Assignment Logic

The lamp has two sides (A and B). With `swapLampSides=true`:

- `image1` renders on Side B object
- `image2` renders on Side A object

When tapping a carousel item, `handleLampSelect` **toggles** lamp assignment (see [`ExperienceV2Client.tsx`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)): if the artwork is **not** on the lamp yet, it is placed in a free slot (or replaces the hidden side when both slots are full); if it **is** already on the lamp, it is **removed** from `lampPreviewOrder` so that side’s textures clear and the Spline model shows its **base** mesh for that side. The artwork stays in the cart.

Persisted carts: if `lampPreviewOrder` is present in `localStorage` (including as an empty array), that value is honored on load; older saves without the key still default preview to the first two cart IDs.

## Featured artist bundle ($159)

When the current **artist spotlight** from [`/api/shop/artist-spotlight`](../../../app/api/shop/artist-spotlight/route.ts) has at least two resolvable prints in catalog order:

- **Empty artwork cart** (no `cartOrder` lines yet): both [`ExperienceV2Client`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) entry points set **`lampPreviewOrder`** to the two spotlight prints for Spline preview only (**not** added to `cartOrder` until the user selects them or applies the bundle). Lamp is **not** auto-added; **`lampQuantity`** starts at **0** unless the user adds a lamp or taps the featured bundle (which sets lamp + both prints).
- **Bundle pricing**: If `lampQuantity === 1`, the cart is **exactly two distinct lines** matching the **first two** spotlight `productIds`, and every line is `availableForSale`, the **displayed subtotal** and **Stripe line items** total **$159.00** before promos. Amounts are **allocated** across one lamp line and two artwork lines proportionally to natural prices (lamp ladder + [`experienceArtworkUnitUsd`](../../../lib/shop/experience-artwork-unit-price.ts)), adjusted to **15900** cents — see [`experience-featured-bundle.ts`](../../../lib/shop/experience-featured-bundle.ts).
- **UI**: [`FilterPanel`](../../../app/(store)/shop/experience-v2/components/FilterPanel.tsx) optional CTA — primary **“Get [vendor] bundle — $159”** and strikethrough **regular** subtotal for the same trio (computed). **[`FeaturedArtistBundleSection`](../../../app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx)** under the 3D lamp in [`SplineFullScreen`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) uses the same visibility rule (empty collection **or** actionable CTA). [`ExperienceCheckoutStickyBar`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) shows **Featured artist bundle · {vendor}** when the bundle is **active** in cart. Onboarding [`Configurator`](../../../app/(store)/shop/experience-v2/components/Configurator.tsx) receives the same offer via banner + filters.
- **Fulfillment**: Shopify variants are unchanged; only **checkout** amounts reflect the bundle.

**Tests:** [`lib/shop/experience-featured-bundle.test.ts`](../../../lib/shop/experience-featured-bundle.test.ts)

## Cart Integration

- Artworks are added to cart when selected in the picker
- Cart persisted to `localStorage` under key `sc-experience-cart-v2` ([`experience-cart-persistence.ts`](../../../lib/shop/experience-cart-persistence.ts)); **`cartVersion` 3** — default **`lampQuantity` 0** (no implicit Street Lamp; legacy v2 “force lamp” migration removed)
- Lamp quantity is adjusted in OrderBar or via lamp promos / **Add lamp to cart** in detail
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
                         │  Lamp promo or spotlight│
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
| Artist spotlight | Yes (above ArtworkStrip); lamp promo when no lamp in cart in picker | Yes (above grid in picker); lamp promo when no lamp in cart |
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
- Updated: 2026-03-28 — [`ExperienceCheckoutStickyBar`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx): below Tailwind **`md`**, checkout row shows **lamp thumbnail** (numeric badge when `lampQuantity` > 1), **`+` separator**, then **“N artwork(s) added”** instead of artwork thumbs; **`md` and up**, full lamp + artwork strip unchanged.
- Updated: 2026-03-28 — [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx): strip shows **at most 7** thumbnails with a window that follows **`activeIndex`** when the collection is larger.
- Updated: 2026-03-28 — **+** at the **end** of the title chip on picker cards, strip cards when not in cart, and [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) spotlight placeholders — no separate corner **+** on those surfaces.
- Updated: 2026-03-28 — Picker + strip: **artwork title** glass chip on the **bottom** of the image ([`ArtworkPickerSheet`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx), [`ArtworkStrip`](../../../app/(store)/shop/experience-v2/components/ArtworkStrip.tsx)); edition chip (picker, non-ladder) sits **above** the title on the image. Carousel spotlight tiles match.
- Updated: 2026-03-28 — [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx): strip **+** hidden when **`reserveCheckoutBar`** (picker add moves to sticky bar).
- Updated: 2026-03-27 — [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx): empty collection uses a **labeled primary CTA** (“Choose your first artwork” + chevron) instead of an icon-only **+** to open the picker.
- Updated: 2026-03-27 — **Picker Street ladder UI** in [`ArtworkPickerSheet`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx): ladder cards show **list price** in the footer and **`N more · then $X`** / **`N more · edition ends`** directly **under** the price (no “Still wide open” edition chip on those cards). Non-ladder cards keep [`EditionBadgeForProduct`](../../../app/(store)/shop/experience-v2/components/EditionBadge.tsx) `chipOnly` on the **image** bottom. Early-access strikethrough unchanged. [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) does not show ladder captions on thumbnails.
- Updated: 2026-03-27 — **Street pricing ladder** (S1/S2): [`StreetPricingChip`](../../../app/(store)/shop/experience-v2/components/StreetPricingChip.tsx) + [`street-collector-pricing-stages.ts`](../../../lib/shop/street-collector-pricing-stages.ts) (**granular bands** — same five stages, multiple USD rungs per stage keyed on sold count), data from [`GET /api/shop/edition-states`](../../../app/api/shop/edition-states/route.ts). **The Reserve**: [`/shop/reserve`](../../../app/(store)/shop/reserve/page.tsx), Stripe subscription + lock APIs under [`app/api/shop/reserve/`](../../../app/api/shop/reserve/), schema [`20260327183000_street_collector_reserve.sql`](../../../supabase/migrations/20260327183000_street_collector_reserve.sql), [`OrderBar`](../../../app/(store)/shop/experience-v2/components/OrderBar.tsx) honors active locks; lock expiry reminder cron [`street-reserve-reminders`](../../../app/api/cron/street-reserve-reminders/route.ts) (see [`vercel.json`](../../../vercel.json)). Watchlist stage emails add ladder line in [`edition-watchlist-notifications.ts`](../../../lib/shop/edition-watchlist-notifications.ts). Collector JSON adds `streetReserveLocks` in [`collector/dashboard/route.ts`](../../../app/api/collector/dashboard/route.ts).
- Updated: 2026-03-27 — **Artist filter / spotlight vendor matching**: [`applyFilters`](../../../app/(store)/shop/experience-v2/components/FilterPanel.tsx) and both [`ExperienceV2Client`](../../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) spotlight handlers use [`experienceVendorsLooselyEqual`](../../../lib/shop/experience-spotlight-match.ts) so Shopify `vendor` strings align with spotlight/API labels (e.g. **Jack J.C. Art** vs **Jack AC Art**, **Kymo** vs **Kymo One**, **Tiago** vs **Tiagi** typo). [`productMatchesSpotlight`](../../../lib/shop/experience-spotlight-match.ts) delegates to the same helper for non–product-id matches.
- Updated: 2026-03-27 — **Edition-states for full catalog**: [`ExperienceV2Client`](../../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) (both entry points) loads [`GET /api/shop/edition-states`](../../../app/api/shop/edition-states/route.ts) in **batches** of [`EDITION_STATES_MAX_IDS_PER_REQUEST`](../../../lib/shop/street-edition-states.ts) via [`fetchStreetEditionStatesMap`](../../../lib/shop/fetch-street-edition-states-client.ts), so Season 2 (and beyond) products are not limited to the first 120 IDs; picker ladder rows no longer fall back to image [`EditionBadge`](../../../app/(store)/shop/experience-v2/components/EditionBadge.tsx) solely due to the cap.
- Updated: 2026-03-28 — **Supabase `products` for edition-states**: Shopify product webhooks ([`app/api/webhooks/shopify/products/route.ts`](../../../app/api/webhooks/shopify/products/route.ts)) call [`upsertShopifyProductIntoSupabaseProducts`](../../../lib/shop/upsert-shopify-product-to-supabase-products.ts) after barcode processing so `public.products` stays aligned with Shopify (`product_id`, `edition_size` from metafields, `edition_counter` unchanged on update). Bulk backfill: `npm run sync:shopify-products-to-supabase` ([`scripts/sync-shopify-products-with-metafields.js`](../../../scripts/sync-shopify-products-with-metafields.js); needs `SHOPIFY_SHOP`, `SHOPIFY_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`).
- Updated: 2026-03-28 — **Spline minimal canvas**: [`spline-3d-preview.tsx`](../../../app/template-preview/components/spline-3d-preview.tsx) `translateY` **-10%** → **-6%** (lamp sits slightly lower in the experience viewport).
- Updated: 2026-03-28 — **Artwork detail headers**: [`ArtworkAccordions`](../../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) artwork card and [`ArtworkDetail`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) show **title** then **artist** (vendor) below.
- Updated: 2026-03-28 — **HorizontalTwoSlideGallery** ([`HorizontalTwoSlideGallery.tsx`](../../../app/(store)/shop/experience-v2/components/HorizontalTwoSlideGallery.tsx)) for **ArtworkDetail** description + artist and **Experience** [`ArtworkAccordions`](../../../app/(store)/shop/experience/components/ArtworkAccordions.tsx) artwork card + artist (transform-based, not scroll-snap).
- Updated: 2026-03-27 — [`ArtworkInfoBar`](../../../app/(store)/shop/experience/components/ArtworkInfoBar.tsx): **right-rail** gallery thumbnails collapse to **one** stacked image (first extra photo) with optional **`+N`** badge; active while reel is on any extra gallery slide; inline `thumbnailPlacement` unchanged.
- Updated: 2026-03-29 — [`ArtworkInfoBar`](../../../app/(store)/shop/experience/components/ArtworkInfoBar.tsx): **right-rail** stack **omits** the edition-status (Award) thumb; inline strip still shows it when `editionLeadBeforeSpline`.
- Updated: 2026-03-27 — **Scarcity bar + detail** mirror picker ladder copy: [`buildStreetLadderForScarcity`](../../../lib/shop/experience-street-ladder-display.ts), [`ScarcityBadge`](../../../app/(store)/shop/experience-v2/components/ScarcityBadge.tsx) `streetLadder` + [`StreetLadderScarcityAddon`](../../../app/(store)/shop/experience-v2/components/StreetLadderScarcityAddon.tsx); [`experienceEarlyAccessForProduct`](../../../lib/shop/experience-spotlight-match.ts). Wired from both [`ExperienceV2Client`](../../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) entry points into [`SplineFullScreen`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx), [`ArtworkAccordions`](../../../app/(store)/shop/experience/components/ArtworkAccordions.tsx), and [`ArtworkDetail`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx).
- Updated: 2026-03-29 — [`ArtworkDetail`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx): [`EditionWatchWithNarrative`](../../../app/(store)/shop/experience-v2/components/EditionWatchWithNarrative.tsx) under scarcity / Street ladder; removed duplicate **Artwork edition** section.
- Updated: 2026-03-29 — **Experience reel** [`ArtworkAccordions`](../../../app/(store)/shop/experience/components/ArtworkAccordions.tsx): **`editionOnly`** slot empty; no separate edition card — [`EditionWatchWithNarrative`](../../../app/(store)/shop/experience-v2/components/EditionWatchWithNarrative.tsx) in the artwork details scarcity card only.
- Updated: 2026-03-29 — [`ExperienceCheckoutStickyBar`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx): mobile row copy **`N artwork` / `N artworks`** (drop “added”).
- Updated: 2026-03-29 — **Open detail from title**: [`ExperienceV2Client`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) **`handleViewDetail`** sets **`previewSlideIndex`** to the reel’s **details** section (slide **1**) when opening [`ArtworkDetail`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) (same path as header title, mobile title, info thumb, strip “details” taps).
- Updated: 2026-04-06 — **Picker / wizard filters**: [`FilterPanel`](../../../app/(store)/shop/experience-v2/components/FilterPanel.tsx) artist (and tag) options use **both seasons’ loaded products** via **`productsForFilterPanel`** in [`ExperienceV2Client`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) (experience-v2 + legacy experience) and [`Configurator`](../../../app/(store)/shop/experience-v2/components/Configurator.tsx) onboarding; grid + `applyFilters` still follow the active season tab.
- Updated: 2026-04-06 — **Full artist list in filters**: [`collection-vendors` API](../../../app/api/shop/experience/collection-vendors/route.ts) + [`useExperienceArtistCatalog`](../../../lib/shop/use-experience-artist-catalog.ts) supply **`artistCatalog`** / **`artistCatalogForFilters`** so the filter sheet lists **all** vendors in Season 1 + 2025 edition collections, not only artists on the first loaded product page (fixes “24 of 25” when SSR uses `first: 24`).
- Updated: 2026-04-06 — **Featured artist bundle ($159)**: [`experience-featured-bundle.ts`](../../../lib/shop/experience-featured-bundle.ts), seed + pricing in both experience clients + Configurator; [`OrderBar`](../../../app/(store)/shop/experience-v2/components/OrderBar.tsx) + context checkout overrides; [`SplineFullScreen`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) / [`FeaturedArtistBundleSection`](../../../app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx) + filter CTA + spotlight banner; legacy [`ArtworkPickerSheet`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) forwards `featuredBundleOffer`.
- Updated: 2026-04-06 — **Spotlight API + bundle CTA visibility**: [`artist-spotlight/route.ts`](../../../app/api/shop/artist-spotlight/route.ts) `trySeason2LatestSpotlight` and `tryShopifySpotlight` now include `products` (like collection spotlight) so clients can resolve the two-print pair and show the Filters bundle block without waiting for pagination. Filter CTA stays visible but **disabled** when either print is not `availableForSale`.
- Updated: 2026-04-06 — **Default spotlight order**: [`artist-spotlight/route.ts`](../../../app/api/shop/artist-spotlight/route.ts) resolves **Season 2 → Shopify newest → Supabase** first; **Jack J.C. Art** runs only as a **fallback** when those paths do not return a spotlight (so “new drop” wins over a fixed Jack collection).
- Updated: 2026-04-06 — **Checkout sticky bar**: [`ExperienceCheckoutStickyBar`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) uses the same **slot** strip on mobile as desktop — **no lamp thumbnail when `lampQuantity === 0`** (fixes stray lamp icon with artwork-only cart).
- Updated: 2026-04-06 — **Bundle CTA placement**: Same offer as Filters — [`ArtistSpotlightBanner`](../../../app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx) (collapsed row + expanded card in picker / Configurator grid). On the main experience, the **lamp + two print** block and **Add to cart** live **under the Spline preview** in the reel via [`FeaturedArtistBundleSection`](../../../app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx) ([`ExperienceCheckoutStickyBar`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx) does not duplicate the bundle promo).
- Updated: 2026-04-06 — **Featured bundle under Spline**: [`SplineFullScreen`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) accepts `featuredBundleOffer`, `bundlePreviewLamp`, `bundlePreviewArtworks`; [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) no longer renders the inline bundle card.
- Updated: 2026-04-06 — **Early access bundle UI**: [`isFeaturedBundleSpotlightPrintsPurchasable`](../../../lib/shop/experience-featured-bundle.ts) enables the featured-bundle CTA when **`?token=`** is present and/or the spotlight is **unlisted** (prints often have `availableForSale: false` on Storefront). [`SplineFullScreen`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) shows the under-Spline section whenever the offer exists (button reflects `disabled`). [`ExperienceV2Client`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) passes **`unlisted=1`** to [`artist-spotlight`](../../../app/api/shop/artist-spotlight/route.ts) when the page URL includes **`unlisted`** (aligned with legacy experience).
- Updated: 2026-04-06 — **Admin “lamp volume discount” visible in experience**: When [`shop_discount_flags`](../../../lib/shop/shop-discount-flags.ts) **`lampArtworkVolume`** is on, [`ExperienceV2Client`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) shows a **volume discount** strip (copy + progress + savings) between Spline and the carousel; [`Configurator`](../../../app/(store)/shop/experience-v2/components/Configurator.tsx) shows the promo chip and the same progress block (previously gated behind `false` or a `hidden` lamp card). **Under-Spline featured bundle** also shows when the cart is **not** empty but the bundle CTA is still **not** disabled (restored sessions with art no longer hide the block by default).
- Updated: 2026-04-06 — **Featured bundle reliability**: [`artist-spotlight`](../../../app/api/shop/artist-spotlight/route.ts) Supabase path now merges **Storefront `products`** via `getProductsByVendor` so [`getSpotlightPairProducts`](../../../lib/shop/experience-featured-bundle.ts) can resolve the two-print pair when SSR seasons omit those SKUs. Vendor/season fallbacks request more artworks (`first: 8–12`). Cart lines resolve catalog products with [`normalizeExperienceProductKey`](../../../lib/shop/experience-artwork-unit-price.ts) (numeric vs gid). [`SplineFullScreen`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) always renders the bundle card when offer + lamp + pair exist (CTA `disabled` when not actionable); 3D block uses **`max-h-[min(72svh,820px)]`** so the card often sits in the first scroll viewport.
- Updated: 2026-04-06 — **Lamp promo in selector**: When **`lampQuantity === 0`**, [`LampSelectorPromoBanner`](../../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.tsx) replaces the artist spotlight in [`ArtworkPickerSheet`](../../../app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) and above the strip in onboarding [`Configurator`](../../../app/(store)/shop/experience-v2/components/Configurator.tsx) (when the lamp paywall is not active). Header opens [`ArtworkDetail`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx); CTA adds the lamp. **Tests:** [`LampSelectorPromoBanner.test.tsx`](../../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.test.tsx).
- Updated: 2026-04-06 — **`ArtworkDetail`** for **lamp / bundle** rows (`productIncludes`): hide artist header line, skip artist-spotlight API, omit artist spotlight blocks and artwork+artist gallery; use **Product details** for the description accordion.
- Updated: 2026-04-06 — **No auto lamp in cart**: [`loadExperienceCart`](../../../lib/shop/experience-cart-persistence.ts) defaults **`lampQuantity` 0** (`cartVersion` 3); **Create your own bundle** / empty flow no longer restores an implicit lamp. **[`ArtworkDetail`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx)** in both [`ExperienceV2Client`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) entry points shows the **Add to cart** / **Add lamp to cart** CTA (`hideCta` removed).
- Updated: 2026-04-06 — [`LampSelectorPromoBanner`](../../../app/(store)/shop/experience-v2/components/LampSelectorPromoBanner.tsx) selector CTA: **Add lamp to cart — $X** (formatted unit price); duplicate price line under title removed.
- Updated: 2026-04-06 — [`ArtworkDetail`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) **Street Lamp** sheet/panel: **3:4** image frame; **flat** product copy / included / specs (no chevron accordions); mobile stacks details directly under the hero.
- Updated: 2026-04-06 — **Lamp includes + specs**: [`LampIncludesSpecsPanel`](../../../app/(store)/shop/experience-v2/components/LampIncludesSpecsPanel.tsx) — one combined panel; **mobile** sticky bar shows it **under the title** with nested scroll; **desktop / inline** keeps it under **Product details** in the column.
- Updated: 2026-04-06 — **Lamp detail + Shopify video**: List/SSR `lamp` has no Storefront **`media`**. [`ExperienceV2Client`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) no longer short-circuits `detailProductFull` to the list product when `detailProduct.id === lamp.id`; it always uses cache or **`GET /api/shop/products/[handle]`** (full [`PRODUCT_FRAGMENT`](../../../lib/shopify/storefront-queries.ts)) so [`buildProductCarouselSlides`](../../../lib/shop/product-carousel-slides.ts) can emit **Video** slides. Legacy [`experience/components/ExperienceV2Client.tsx`](../../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) **warms** the same cache for `lamp.handle` on mount. [`Configurator`](../../../app/(store)/shop/experience-v2/components/Configurator.tsx) already prefetches the lamp handle for the drawer.
- Updated: 2026-04-06 — **Product video outside carousel**: [`ArtworkDetail`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) uses [`ProductStandaloneVideoEmbed`](../../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx) for **inline**, **desktop slideout**, and **mobile sheet** (no video-in-carousel toggle); [`ProductDetailCarousel`](../../../app/(store)/shop/experience-v2/components/ProductDetailCarousel.tsx) shows **images only**.
- Updated: 2026-04-06 — **Journey CTA pulse**: [`resolveExperienceNextAction`](../../../lib/shop/experience-journey-next-action.ts) + context flags [`pickerEngaged` / `orderDrawerOpen`](../../../app/(store)/shop/experience-v2/ExperienceOrderContext.tsx); pulse/shine on sticky bar, carousel, selector, picker sheet, lamp detail, and OrderBar checkout steps (see [Journey CTA pulse](#journey-cta-pulse-next-action)).
- Updated: 2026-04-06 — **Carousel mini 3D tile**: [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) first-slot **3D preview** (+ / trash, session-persisted); optional [`NEXT_PUBLIC_EXPERIENCE_CAROUSEL_MINI_SPLINE_EMBED_URL`](../../../lib/shop/experience-carousel-mini-spline.ts); both [`ExperienceV2Client`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) entry points wire scroll-to-Spline on thumb tap.
- Updated: 2026-04-06 — **Mini strip tile polish**: no hover styling on the lamp/Spline thumb; **continuous** CSS turntable spin (`.experience-carousel-mini-turntable`); reel targets [`data-experience-reel-spline-section`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) for smooth scroll.

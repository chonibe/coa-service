# Commit Log

## Commit: feat(shop): admin tiered standard shipping free over $70 / $10 below (2026-04-06)

**Ref:** `014cf0d52`

### Summary
New boolean **`shippingFreeOver70`** in **`system_settings.shop_discount_flags`** (admin **Shop discounts**). When enabled, Stripe Checkout standard shipping is **$10** under **$70** merchandise subtotal and **free** at or above $70; express stays **$15**. When disabled, behavior matches legacy (**free** standard + express). Shared builder [`lib/shop/stripe-checkout-shipping.ts`](lib/shop/stripe-checkout-shipping.ts) wires [`app/api/checkout/stripe/route.ts`](app/api/checkout/stripe/route.ts) and [`app/api/checkout/create/route.ts`](app/api/checkout/create/route.ts). Public [`GET /api/shop/shipping-promo`](app/api/shop/shipping-promo/route.ts) and [`lib/shop/CartContext.tsx`](lib/shop/CartContext.tsx) align the product page and [`components/shop/navigation/NavCart.tsx`](components/shop/navigation/NavCart.tsx).

### Implementation Checklist

- [x] [lib/shop/shop-discount-flags.ts](lib/shop/shop-discount-flags.ts)
- [x] [app/api/admin/shop/discount-flags/route.ts](app/api/admin/shop/discount-flags/route.ts)
- [x] [lib/shop/stripe-checkout-shipping.ts](lib/shop/stripe-checkout-shipping.ts)
- [x] [lib/shop/stripe-checkout-shipping.test.ts](lib/shop/stripe-checkout-shipping.test.ts)
- [x] [app/api/checkout/stripe/route.ts](app/api/checkout/stripe/route.ts)
- [x] [app/api/checkout/create/route.ts](app/api/checkout/create/route.ts)
- [x] [app/api/shop/shipping-promo/route.ts](app/api/shop/shipping-promo/route.ts)
- [x] [lib/shop/CartContext.tsx](lib/shop/CartContext.tsx)
- [x] [app/(store)/shop/[handle]/page.tsx](app/(store)/shop/[handle]/page.tsx)
- [x] [components/shop/navigation/NavCart.tsx](components/shop/navigation/NavCart.tsx)
- [x] [lib/shop/shop-discount-flags.test.ts](lib/shop/shop-discount-flags.test.ts)
- [x] [docs/features/admin-portal/README.md](docs/features/admin-portal/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: feat(experience): featured artist bundle under Spline + Add to cart (2026-04-06)

**Ref:** `150849227`

### Summary
The **featured artist bundle** moved from **[`ArtworkCarouselBar`](app/(store)/shop/experience/components/ArtworkCarouselBar.tsx)** to **[`FeaturedArtistBundleSection`](app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx)** under the 3D preview in **[`SplineFullScreen`](app/(store)/shop/experience/components/SplineFullScreen.tsx)** (thumbnails, pricing, **Add to cart**). Both experience **[`ExperienceV2Client`](app/(store)/shop/experience/components/ExperienceV2Client.tsx)** shells pass **`featuredBundleOffer`**, **`bundlePreviewLamp`**, **`bundlePreviewArtworks`**. **[`docs/features/experience-v2/README.md`](docs/features/experience-v2/README.md)** updated.

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx](app/(store)/shop/experience/components/FeaturedArtistBundleSection.tsx)
- [x] [app/(store)/shop/experience/components/SplineFullScreen.tsx](app/(store)/shop/experience/components/SplineFullScreen.tsx)
- [x] [app/(store)/shop/experience/components/ArtworkCarouselBar.tsx](app/(store)/shop/experience/components/ArtworkCarouselBar.tsx)
- [x] [app/(store)/shop/experience/components/ExperienceV2Client.tsx](app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: feat(shop): admin featured bundle modes + cart extras keep bundle pricing (2026-04-06)

**Ref:** `2811092fd`

### Summary
**Featured artist bundle** is configurable in **`/admin/shop/discounts`**: enable/disable, **fixed total (USD)**, **percent off** regular lamp+2-prints subtotal, or **dollar amount off**. Stored in **`system_settings.shop_discount_flags`** as **`featuredBundleEnabled`**, **`featuredBundleMode`**, **`featuredBundleValue`**. Bundle **eligibility** no longer requires exactly two cart lines: with lamp qty 1 and at least one of each spotlight print, **extras bill at natural ladder/lock prices** while the first unit of each spotlight print stays in the bundle total ([**`lib/shop/experience-bundle-order-pricing.ts`**](lib/shop/experience-bundle-order-pricing.ts)). [**`OrderBar`**](app/(store)/shop/experience-v2/components/OrderBar.tsx) uses **cart indices** for bundle unit prices and splits **Stripe line items** when the same SKU mixes bundle vs extra pricing. Server load via [**`getShopDiscountSettings()`**](lib/shop/get-shop-discount-flags.ts); [**`ShopDiscountFlagsContext`**](app/(store)/shop/experience-v2/components/ShopDiscountFlagsContext.tsx) exposes **`useShopDiscountSettings()`**. API [**`/api/admin/shop/discount-flags`**](app/api/admin/shop/discount-flags/route.ts) GET/PATCH updated. Docs: [**`docs/features/admin-portal/README.md`**](docs/features/admin-portal/README.md).

### Implementation Checklist

- [x] [lib/shop/shop-discount-flags.ts](lib/shop/shop-discount-flags.ts)
- [x] [lib/shop/experience-featured-bundle.ts](lib/shop/experience-featured-bundle.ts)
- [x] [lib/shop/experience-bundle-order-pricing.ts](lib/shop/experience-bundle-order-pricing.ts)
- [x] [lib/shop/get-shop-discount-flags.ts](lib/shop/get-shop-discount-flags.ts)
- [x] [app/api/admin/shop/discount-flags/route.ts](app/api/admin/shop/discount-flags/route.ts)
- [x] [app/admin/shop/discounts/page.tsx](app/admin/shop/discounts/page.tsx)
- [x] [app/(store)/shop/experience-v2/components/ShopDiscountFlagsContext.tsx](app/(store)/shop/experience-v2/components/ShopDiscountFlagsContext.tsx)
- [x] [app/(store)/shop/experience-v2/components/OrderBar.tsx](app/(store)/shop/experience-v2/components/OrderBar.tsx)
- [x] [app/(store)/shop/experience-v2/components/Configurator.tsx](app/(store)/shop/experience-v2/components/Configurator.tsx)
- [x] [app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience/components/ExperienceV2Client.tsx](app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [docs/features/admin-portal/README.md](docs/features/admin-portal/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: fix(experience): disable Spline lamp cursor/touch orbit globally (2026-04-06)

**Ref:** `6268d429b`

### Summary
The 3D lamp no longer tracks the pointer for yaw/pitch. **[`SplineFullScreen`](app/(store)/shop/experience/components/SplineFullScreen.tsx)** always passes **`interactive={false}`** to **`Spline3DPreview`**; **[`Configurator`](app/(store)/shop/experience-v2/components/Configurator.tsx)** no longer enables **`interactive`**. **`collectionArtworkCount`** still controls **idle turntable** vs **`lampPreviewCount`** rules only. Docs updated in **[`docs/features/experience/README.md`](docs/features/experience/README.md)** and **[`docs/features/experience-v2/README.md`](docs/features/experience-v2/README.md)**.

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/SplineFullScreen.tsx](app/(store)/shop/experience/components/SplineFullScreen.tsx)
- [x] [app/(store)/shop/experience-v2/components/Configurator.tsx](app/(store)/shop/experience-v2/components/Configurator.tsx)
- [x] [docs/features/experience/README.md](docs/features/experience/README.md)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: feat(experience): featured bundle inline in carousel above choose-artwork sticky (2026-04-06)

**Ref:** `7542b892c`

### Summary
The **$159 featured artist bundle** is no longer promoted twice on the main experience. A **single centered card** in **[`ArtworkCarouselBar`](app/(store)/shop/experience/components/ArtworkCarouselBar.tsx)** shows **Street Lamp + two spotlight prints** (same **`w-24` / `aspect-[14/20]` / `rounded-[15px]`** as the strip), **`+` separators**, pricing, and one tap to **`onApply`**. It appears only when the **collection strip is empty**, **`reserveCheckoutBar`** is true, and the offer is enabled. **Spotlight placeholder tiles** in the strip are suppressed while this card shows. **[`ExperienceCheckoutStickyBar`](app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx)** keeps **“Choose your first artwork”** (and checkout when items exist) but **drops duplicate bundle promos**; **`featuredBundleVendorName`** when the bundle is active is unchanged.

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ArtworkCarouselBar.tsx](app/(store)/shop/experience/components/ArtworkCarouselBar.tsx)
- [x] [app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx](app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx)
- [x] [app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience/components/ExperienceV2Client.tsx](app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: fix(experience): full artist filter list via paginated collection-vendors API (2026-04-06)

**Ref:** `038459b1f`

### Summary
Experience SSR loads only **24 products per season**; the filter could show **24/25** artists when one vendor’s works were not on the first page. **[`GET /api/shop/experience/collection-vendors`](app/api/shop/experience/collection-vendors/route.ts)** paginates **season-1** + **2025-edition** with minimal Storefront fields, merges vendor counts, and sorts like **`FilterPanel`**. **[`useExperienceArtistCatalog`](lib/shop/use-experience-artist-catalog.ts)** + **`artistCatalog`** / **`artistCatalogForFilters`** wire this into the picker and Configurator.

### Implementation Checklist

- [x] [lib/shopify/storefront-client.ts](lib/shopify/storefront-client.ts)
- [x] [app/api/shop/experience/collection-vendors/route.ts](app/api/shop/experience/collection-vendors/route.ts)
- [x] [lib/shop/use-experience-artist-catalog.ts](lib/shop/use-experience-artist-catalog.ts)
- [x] [app/(store)/shop/experience-v2/components/FilterPanel.tsx](app/(store)/shop/experience-v2/components/FilterPanel.tsx)
- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)
- [x] [app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience/components/ExperienceV2Client.tsx](app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience-v2/components/Configurator.tsx](app/(store)/shop/experience-v2/components/Configurator.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: feat(shop): featured bundle CTA on experience sticky bar + spotlight banner (2026-04-06)

**Ref:** `28f473476`

### Summary
The **$159 featured artist bundle** CTA is no longer only in the filter slideout. It appears on **[`ExperienceCheckoutStickyBar`](app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx)** (main experience: above “Choose your first artwork” when the cart is empty, or above the checkout row when the bundle is not yet active) and inside **[`ArtistSpotlightBanner`](app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx)** in the selector / Configurator (collapsed footer + expanded card). **[`ArtworkPickerSheet`](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)** passes `featuredBundleOffer` into the banner.

### Implementation Checklist

- [x] [app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx](app/(store)/shop/experience-v2/components/ArtistSpotlightBanner.tsx)
- [x] [app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx](app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx)
- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)
- [x] [app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience/components/ExperienceV2Client.tsx](app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience-v2/components/Configurator.tsx](app/(store)/shop/experience-v2/components/Configurator.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: fix(shop): spotlight `products` for default bundle CTA + disabled when OOS (2026-04-06)

**Ref:** `a086d6657`

### Summary
Default **`/api/shop/artist-spotlight`** paths **`trySeason2LatestSpotlight`** and **`tryShopifySpotlight`** returned **`productIds`** without **`products`**, so the experience clients often could not **`getSpotlightPairProducts`** until those SKUs appeared on the first loaded collection page — the **Featured artist bundle** block in **Filters** never rendered. Both paths now attach **`products`** (same pattern as collection spotlight). **Filter CTA** remains visible when prints are out of stock but the button is **disabled** (`!availableForSale`).

### Implementation Checklist

- [x] [app/api/shop/artist-spotlight/route.ts](app/api/shop/artist-spotlight/route.ts)
- [x] [app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience/components/ExperienceV2Client.tsx](app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience-v2/components/Configurator.tsx](app/(store)/shop/experience-v2/components/Configurator.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: feat(shop): featured artist bundle $159 — experience checkout + filters (2026-04-06)

**Ref:** `efb2c5967`

### Summary
**Featured artist bundle** defaults empty carts to the first two **artist spotlight** prints (one-time seed), shows **$159** subtotal and **Stripe** line totals when `lampQuantity === 1` and cart matches spotlight pair (allocated across lamp + 2 SKUs via [`lib/shop/experience-featured-bundle.ts`](lib/shop/experience-featured-bundle.ts)). **FilterPanel** CTA with compare-at regular total; **ExperienceCheckoutStickyBar** bundle label; **OrderBar** / context `featuredBundleCheckout` overrides. Parity on **legacy** `/shop/experience` [`ExperienceV2Client`](app/(store)/shop/experience/components/ExperienceV2Client.tsx) + [`ArtworkPickerSheet`](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx); onboarding **Configurator** wired.

### Implementation Checklist

- [x] [lib/shop/experience-featured-bundle.ts](lib/shop/experience-featured-bundle.ts)
- [x] [lib/shop/experience-featured-bundle.test.ts](lib/shop/experience-featured-bundle.test.ts)
- [x] [app/(store)/shop/experience-v2/ExperienceOrderContext.tsx](app/(store)/shop/experience-v2/ExperienceOrderContext.tsx)
- [x] [app/(store)/shop/experience-v2/components/OrderBar.tsx](app/(store)/shop/experience-v2/components/OrderBar.tsx)
- [x] [app/(store)/shop/experience-v2/components/FilterPanel.tsx](app/(store)/shop/experience-v2/components/FilterPanel.tsx)
- [x] [app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx](app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx)
- [x] [app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience-v2/components/Configurator.tsx](app/(store)/shop/experience-v2/components/Configurator.tsx)
- [x] [app/(store)/shop/experience/components/ExperienceV2Client.tsx](app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)
- [x] [docs/features/experience/README.md](docs/features/experience/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: fix(experience): show all season artists in artwork filter panel (2026-04-06)

**Ref:** `a907ce6d0`

### Summary
The artwork picker **FilterPanel** (and onboarding **Configurator** filters) built the **artist** list from **`productsForActiveSeason`**, so users only saw artists for the **current Season 1 / Season 2 tab**. **`productsForFilterPanel`** is now a **deduped union** of all loaded products from **both seasons** (by normalized Shopify product id). **`filteredProducts`** / the grid still use the active season only, so filtering by an artist shows their works in the tab you are on (and users can switch season or use browse-other-season as before).

### Implementation Checklist

- [x] [app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience/components/ExperienceV2Client.tsx](app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience-v2/components/Configurator.tsx](app/(store)/shop/experience-v2/components/Configurator.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: fix(experience): scroll reel to details when opening ArtworkDetail from title (2026-03-29)

**Ref:** `cab274faf`

### Summary
**[`handleViewDetail`](app/(store)/shop/experience/components/ExperienceV2Client.tsx)** in both experience entry points now sets **`previewSlideIndex`** to the reel section that shows the **artwork details accordion** (same indices as [`ArtworkInfoBar`](app/(store)/shop/experience/components/ArtworkInfoBar.tsx) **`detailSlide`**: lamp **1**, non-lamp artwork with edition-before-Spline **2**). **experience-v2** client uses slide **1** for its 3-section reel. Fixes the case where tapping the **header title** or **mobile hero title** opened the information slideout while the vertical reel stayed on Spline.

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ExperienceV2Client.tsx](app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)
- [x] [docs/features/experience/README.md](docs/features/experience/README.md)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: fix(shop): remove redundant Edition of from artwork headers (2026-03-21)

**Ref:** `5c2d31806`

### Summary
Removed **Edition of N** / **Limited Edition of N** from product header rows in [`ArtworkDetail.tsx`](app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) (inline desktop, slideout desktop, mobile sticky bar); edition size remains in scarcity bar and edition badge. **[`ArtworkAccordions.tsx`](app/(store)/shop/experience/components/ArtworkAccordions.tsx)** artwork details card now shows **artist** (uppercase label) + **title** only; dropped edition line and release date from that card.

### Implementation Checklist

- [x] [app/(store)/shop/experience-v2/components/ArtworkDetail.tsx](app/(store)/shop/experience-v2/components/ArtworkDetail.tsx)
- [x] [app/(store)/shop/experience/components/ArtworkAccordions.tsx](app/(store)/shop/experience/components/ArtworkAccordions.tsx)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: fix(experience-v2): scarcity bar in image/detail column; watch stays on edition badge (2026-03-21)

**Ref:** `851c6519b`

### Summary
**[`ScarcityBadge.tsx`](app/(store)/shop/experience-v2/components/ScarcityBadge.tsx)** — bar + remaining copy only (no watch UI). **[`EditionBadge.tsx`](app/(store)/shop/experience-v2/components/EditionBadge.tsx)** — **`afterCta`** passes **`EditionWatchControl`** under edition story. **[`ArtworkDetail.tsx`](app/(store)/shop/experience-v2/components/ArtworkDetail.tsx)** — scarcity in bordered card under **left** thumbnails (inline + slideout desktop) and after **mobile** carousel; removed from **`ArtworkEditionUnifiedSection`**. **[`ArtworkAccordions.tsx`](app/(store)/shop/experience/components/ArtworkAccordions.tsx)** — scarcity inside **Artwork Details** card; edition block is badge-only.

### Implementation Checklist

- [x] [app/(store)/shop/experience-v2/components/ScarcityBadge.tsx](app/(store)/shop/experience-v2/components/ScarcityBadge.tsx)
- [x] [app/(store)/shop/experience-v2/components/EditionBadge.tsx](app/(store)/shop/experience-v2/components/EditionBadge.tsx)
- [x] [app/(store)/shop/experience-v2/components/ArtworkDetail.tsx](app/(store)/shop/experience-v2/components/ArtworkDetail.tsx)
- [x] [app/(store)/shop/experience/components/ArtworkAccordions.tsx](app/(store)/shop/experience/components/ArtworkAccordions.tsx)
- [x] [docs/COMMIT_LOG.md](docs/COMMIT_LOG.md)

---

## Commit: feat(watchlist): edition watchlist badge, API, emails, collector page (2026-03-21)

**Ref:** `6f30d470c`

### Summary
**Branch:** `feature/wishlist-edition`. **Watch button** on [`EditionBadgeForProduct`](app/(store)/shop/experience-v2/components/EditionBadge.tsx) via [`EditionWatchControl.tsx`](app/(store)/shop/experience-v2/components/EditionWatchControl.tsx): labels per stage (incl. sold out), auth via [`AuthSlideupMenu`](components/shop/auth/AuthSlideupMenu.tsx) + `onAuthenticated` + `sessionStorage` for OAuth return. **API** [`/api/shop/watchlist`](app/api/shop/watchlist/route.ts) GET/POST/DELETE with service role + session. **Supabase** tables in [`20260321120000_edition_watchlist.sql`](supabase/migrations/20260321120000_edition_watchlist.sql). **Stage emails:** [`edition-watchlist-notifications.ts`](lib/shop/edition-watchlist-notifications.ts) on Shopify product webhook (cold start = no blast); Resend/Gmail via [`sendEmail`](lib/email/client.ts). **Conversion:** [`edition-watchlist-conversion.ts`](lib/shop/edition-watchlist-conversion.ts) on paid order webhook + PostHog. **Collector UI:** [`/collector/watchlist`](app/collector/watchlist/page.tsx). **PostHog:** client `captureFunnelEvent` + server `capturePostHogServerEvent`; names in [`FunnelEvents`](lib/posthog.ts).

### Implementation Checklist

- [x] [supabase/migrations/20260321120000_edition_watchlist.sql](supabase/migrations/20260321120000_edition_watchlist.sql)
- [x] [app/api/shop/watchlist/route.ts](app/api/shop/watchlist/route.ts)
- [x] [lib/shop/edition-watchlist-notifications.ts](lib/shop/edition-watchlist-notifications.ts)
- [x] [lib/shop/edition-watchlist-conversion.ts](lib/shop/edition-watchlist-conversion.ts)
- [x] [lib/shop/admin-product-edition-state.ts](lib/shop/admin-product-edition-state.ts)
- [x] [app/(store)/shop/experience-v2/components/EditionWatchControl.tsx](app/(store)/shop/experience-v2/components/EditionWatchControl.tsx)
- [x] [app/(store)/shop/experience-v2/components/EditionBadge.tsx](app/(store)/shop/experience-v2/components/EditionBadge.tsx)
- [x] [app/collector/watchlist/page.tsx](app/collector/watchlist/page.tsx)
- [x] [components/shop/auth/AuthSlideupMenu.tsx](components/shop/auth/AuthSlideupMenu.tsx)
- [x] [app/api/webhooks/shopify/products/route.ts](app/api/webhooks/shopify/products/route.ts)
- [x] [app/api/webhooks/shopify/orders/route.ts](app/api/webhooks/shopify/orders/route.ts)
- [x] [types/supabase.ts](types/supabase.ts)
- [x] [lib/posthog.ts](lib/posthog.ts)

---

## Commit: feat(experience-v2): EditionBadge in ArtworkDetail + edition stage lib (2026-03-20)

**Ref:** `1621dd51e`

### Summary
**[`lib/shop/edition-stages.ts`](lib/shop/edition-stages.ts)** — `editionStages` copy (badge, subline, CTA, email), `getEditionStageKey` (ratio-scaled bands + last-two guard for `total >= 3`), `getEditionCopyForStage` / `interpolateEditionTemplate`. **[`EditionBadge.tsx`](app/(store)/shop/experience-v2/components/EditionBadge.tsx)** — gallery-style UI. **[`ArtworkDetail.tsx`](app/(store)/shop/experience-v2/components/ArtworkDetail.tsx)** — sold count = `edition_size - quantityAvailable`; hidden when `productIncludes` (lamp/bundle); placed above scarcity / near mobile CTA (`compact` on mobile). [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md) architecture + **ArtworkDetail + EditionBadge** section.

### Implementation Checklist

- [x] [lib/shop/edition-stages.ts](lib/shop/edition-stages.ts)
- [x] [app/(store)/shop/experience-v2/components/EditionBadge.tsx](app/(store)/shop/experience-v2/components/EditionBadge.tsx)
- [x] [app/(store)/shop/experience-v2/components/ArtworkDetail.tsx](app/(store)/shop/experience-v2/components/ArtworkDetail.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)

---

## Commit: style(experience): smaller selection badges and strip action chrome (2026-03-20)

**Ref:** `96eda5159`

### Summary
**Picker** [`ArtworkPickerSheet.tsx`](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx): selection badge **`w-4 h-4`**, **`text-[9px]`**, **`top-1.5`**. **Strip** [`ArtworkStrip.tsx`](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx): green lamp number **`w-4`/`text-[9px]`**; eye / footer info / add row **`w-4`/`h-5`**; **`SparkleCheck`** tick pulse **`1.12`**; wizard **scale** pulses **`1.08`/`1.05`**. [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md) version note.

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)
- [x] [app/(store)/shop/experience-v2/components/ArtworkStrip.tsx](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)

---

## Commit: refactor(experience): centralize artwork card surfaces (picker + strip) (2026-03-20)

**Ref:** `0d99abd23`

### Summary
Introduced [`lib/shop/experience-artwork-card-surfaces.ts`](lib/shop/experience-artwork-card-surfaces.ts): **`getPickerArtworkCardSurfaces`**, **`getStripArtworkCardSurfaces`**, and **`experienceArtistRowMergeClass` / `experienceArtistRowDefaultClass`** for 2-up artist rows. **V1** [`ArtworkPickerSheet.tsx`](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) and **V2** [`ArtworkStrip.tsx`](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) consume these instead of repeating hex pairs and transition strings on shell, image well, and meta/footer.

### Implementation Checklist

- [x] [lib/shop/experience-artwork-card-surfaces.ts](lib/shop/experience-artwork-card-surfaces.ts)
- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)
- [x] [app/(store)/shop/experience-v2/components/ArtworkStrip.tsx](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)

---

## Commit: style(experience): picker full selected fill in light, half-tint in dark (2026-03-20)

**Ref:** _(after commit)_

### Summary
**ArtworkPickerSheet** `ArtworkCardV2`: **light** mode selected restores **full** `#f0f9ff` on **outer shell + image well** (no half-overlay). **Dark** mode keeps **lower-half only** wash (`#2c2828`/90%) on the image well; shell stays without that outer tint.

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)

---

## Commit: style(experience): picker selected tint on lower half of image only (2026-03-20)

**Ref:** `4c7cb56a0`

### Summary
**ArtworkPickerSheet** `ArtworkCardV2`: removed full-card and full-image-well selected fill. When selected, a **semi-opaque wash** (`#f0f9ff` / `#2c2828` at 90%) covers only the **bottom half** of the image area (`top-1/2` → `bottom`); image/skeleton sit above (`z-[2]`). Footer title row still uses full selected background.

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)

---

## Commit: fix(experience): dedupe artwork carousel when quantity >1 (2026-03-20)

**Ref:** `998613df7`

### Summary
`cartOrder` may repeat the same product ID (line-item quantity). The bottom **ArtworkCarouselBar** now receives **`carouselArtworks`** (one tile per product, first-seen order). **Carousel trash** clears **all** lines for that product. **OrderBar** −1 still removes one line via **`handleRemoveCartOrderItemAtIndex`**. Shared helpers: [`lib/shop/experience-carousel-cart.ts`](lib/shop/experience-carousel-cart.ts). Applied to **V1** and **V2** `ExperienceV2Client`; carousel item **`key={artwork.id}`**.

### Implementation Checklist

- [x] [lib/shop/experience-carousel-cart.ts](lib/shop/experience-carousel-cart.ts)
- [x] [app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx](app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience/components/ExperienceV2Client.tsx](app/(store)/shop/experience/components/ExperienceV2Client.tsx)
- [x] [app/(store)/shop/experience/components/ArtworkCarouselBar.tsx](app/(store)/shop/experience/components/ArtworkCarouselBar.tsx)
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)

---

## Commit: style(experience): merged pair cards closer (2026-03-20)

**Ref:** `0297537d6`

### Summary
When **both** artworks in a row are selected / in-cart (**`shouldMerge`**): **`-mr-1` / `-ml-1`** on card wrappers pulls tiles toward the center spine; spine uses **`px-0`**, shorter label **`py`**, and **`tracking-wide`** vs `tracking-widest`; picker merge row **`mx-1` → `mx-0.5`**. Unmerged pairs keep previous spine padding.

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)
- [x] [app/(store)/shop/experience-v2/components/ArtworkStrip.tsx](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx)

---

## Commit: style(experience): tighter footer under card images (2026-03-20)

**Ref:** `f5c3f167c`

### Summary
Reduced **top/bottom padding** on picker and strip card footers so **title + price** sit closer to the image; strip **text vs actions** gap `1.5` → `1`.

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) – `ArtworkCardV2` footer `pt-0.5 pb-1` / merged `pt-0 pb-0.5`
- [x] [app/(store)/shop/experience-v2/components/ArtworkStrip.tsx](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) – same padding pattern, `gap-1`

---

## Commit: fix(experience): snappier tap, tween selection badge (2026-03-20)

**Ref:** `8f3b924ee`

### Summary
Removes **spring** on `whileTap` (replaced with **0.12s easeOut** + **0.99** scale) so tap doesn’t “bounce” against CSS background transitions. Picker **selection badge** uses **AnimatePresence** with **140ms tween** (no spring). State **CSS transitions** shortened to **200ms ease-out** (cards, footers, merge row, Add button).

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)
- [x] [app/(store)/shop/experience-v2/components/ArtworkStrip.tsx](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx)

---

## Commit: style(experience): smoother on/off transitions for cards (2026-03-20)

**Ref:** `ecbc52b5b`

### Summary
**Picker** and **strip** artwork cards use **300ms** eased transitions for backgrounds, borders, inset shadow, and footer colors; tap feedback uses a **spring** (`whileTap` 0.97). Picker **selection number** badge enters/exits with **AnimatePresence** + spring. **2-up artist rows** animate background when merge (both in cart) toggles.

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx)
- [x] [app/(store)/shop/experience-v2/components/ArtworkStrip.tsx](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx)

---

## Commit: style(experience): center footers, remove row/spine borders (2026-03-20)

**Ref:** `af72f76ce`

### Summary
Picker and strip: **centered** artwork title and price under each image; removed **border between image and footer** on strip cards; removed **outer border** on 2-up artist rows; center **artist spine** is text-only (**no** background or vertical borders).

### Implementation Checklist

- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) – footer layout, row wrapper, spine
- [x] [app/(store)/shop/experience-v2/components/ArtworkStrip.tsx](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) – footer layout, row wrapper, spine
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md)

---

## Commit: feat(experience): artist-grouped rows, center spine, title+price footers (2026-03-20)

**Ref:** `df1826a02`

### Summary
Picker and configurator strip now lay out **virtual rows by artist (Shopify `vendor`)**: pairs in one row share a **vertical artist label** in the center (same structure as the old “both selected” merge). Picker cards no longer show the artist in the footer—only **artwork title** with **price on the line below**. Odd per-artist counts use one **half-width centered** card. Shared row builder lives in `lib/shop/experience-artwork-rows.ts`; scroll-to-product and prefetch use the new row model.

### Implementation Checklist

- [x] [lib/shop/experience-artwork-rows.ts](lib/shop/experience-artwork-rows.ts) – `buildArtworkRowsByArtist`, `rowIndexForProductId`
- [x] [app/(store)/shop/experience/components/ArtworkPickerSheet.tsx](app/(store)/shop/experience/components/ArtworkPickerSheet.tsx) – artist rows, always-on spine for pairs, `spinePairLayout` + `flushToSpine` rounding on `ArtworkCardV2`, footer title + stacked price
- [x] [app/(store)/shop/experience-v2/components/ArtworkStrip.tsx](app/(store)/shop/experience-v2/components/ArtworkStrip.tsx) – same row model, spine for pairs, centered single-card rows, prefetch + `scrollToProductId` via `rowIndexForProductId`
- [x] [docs/features/experience-v2/README.md](docs/features/experience-v2/README.md) – picker / grid documentation updated

---

## Commit: Lighthouse Performance and Best Practices (2026-03-10)

**Ref:** `70813b0a82`  
**Deployed:** https://app.thestreetcollector.com

### Summary
Improves Lighthouse Performance and Best Practices for the street-collector landing page: lazy-load videos, hero preload in head, deferred PostHog/GA, proxy-video cache, bfcache-friendly revalidate, explicit poster dimensions.

### Implementation Checklist

- [x] [components/LazyVideo.tsx](components/LazyVideo.tsx) – Intersection Observer lazy video
- [x] [app/layout.tsx](app/layout.tsx) – Hero poster preload, font preconnect, deferred GA
- [x] [app/api/proxy-video/route.ts](app/api/proxy-video/route.ts) – Long-lived cache headers
- [x] [app/shop/street-collector/page.tsx](app/shop/street-collector/page.tsx) – `revalidate = 60`
- [x] [components/google-analytics.tsx](components/google-analytics.tsx) – Deferred GA/Ads
- [x] See [docs/features/lighthouse-performance/README.md](docs/features/lighthouse-performance/README.md) for full details

---

## Commit: feat(theme): add #1c0202 to base and #FFBA94 highlight palette (2026-03-06)

**Ref:** `d9179ccd6`

### Summary
Added subtle `#1c0202` warmth to the dark mode base and introduced the `#FFBA94` highlight palette for section headers, labels, and accent text across the experience and shop components.

### Implementation Checklist

- [x] [app/globals.css](app/globals.css) – Base moved to `#171515` (with `#1c0202` warmth); added `--experience-highlight`, `--experience-highlight-muted`, `--experience-highlight-soft` tokens
- [x] [tailwind.config.ts](tailwind.config.ts) – Added `experience.highlight`, `experience.highlight-muted`, `experience.highlight-soft`; fixed `require()` → ES import for tailwindcss-animate
- [x] [app/shop/experience/components/ArtworkDetail.tsx](app/shop/experience/components/ArtworkDetail.tsx) – Section headers (Includes, Specifications, About the Artist) use highlight color
- [x] [app/shop/experience/components/ArtworkInfo.tsx](app/shop/experience/components/ArtworkInfo.tsx) – Artist name uses highlight color
- [x] [app/shop/experience/components/OrderBar.tsx](app/shop/experience/components/OrderBar.tsx) – Labels (Shipping, Total, Checkout) use highlight color
- [x] [app/shop/experience/components/Configurator.tsx](app/shop/experience/components/Configurator.tsx) – Selected “Artworks” tab uses highlight color
- [x] Experience, shop, gift-cards, Spline, PolarisSheet – Replaced `dark:bg-neutral-*` with stepped palette (`#171515`, `#1a1616`, `#201c1c`, etc.)

### Palette Reference
| Token | Hex | Use |
|-------|-----|-----|
| Base | `#171515` | Page background, dialogs, menus |
| Highlight | `#FFBA94` | Section headers, labels, accent text |
| Surface steps | `#1a1616`–`#4a4444` | Cards, panels, borders |

### Verification
- Dark mode components use new palette; highlight text visible and consistent

---

## Standardize on order_line_items_v2 (YYYY-MM-DD)

### Summary
Migrated all application routes (`app/`, `lib/`) from the legacy `order_line_items` table to `order_line_items_v2` to fix silent data mismatches and broken flows (NFC pairing, certificates, collector portal).

### Implementation Checklist

- [x] **Phase 1 – NFC Pairing Flow (P0)**  
  - [app/api/nfc-tags/assign/route.ts](app/api/nfc-tags/assign/route.ts): Table name + added `request` param to `POST`  
  - [app/api/nfc-tags/verify/route.ts](app/api/nfc-tags/verify/route.ts): Join `order_line_items(*)` → `order_line_items_v2(*)` + added `request` param to `GET`  
  - [app/api/nfc-tags/create/route.ts](app/api/nfc-tags/create/route.ts): Table name + added `request` param to `POST`  
  - [app/api/nfc-tags/get-programming-data/route.ts](app/api/nfc-tags/get-programming-data/route.ts): Table name + added `request` param to `GET`

- [x] **Phase 2 – Certificate Flow (P0)**  
  - [app/api/certificate/generate/route.ts](app/api/certificate/generate/route.ts): Both read and write to v2  
  - [app/api/certificate/delete/route.ts](app/api/certificate/delete/route.ts): Table name + added `request` param  
  - [app/api/customer/certificates/route.ts](app/api/customer/certificates/route.ts): Table name + added `request` param  

- [x] **Phase 3 – Collector Portal (P1)**  
  - [app/api/collector/story/[productId]/route.ts](app/api/collector/story/[productId]/route.ts)  
  - [app/api/collector/artists/[name]/route.ts](app/api/collector/artists/[name]/route.ts)  
  - [app/api/collector/series/[id]/route.ts](app/api/collector/series/[id]/route.ts)  
  - [app/api/benefits/claim/route.ts](app/api/benefits/claim/route.ts)  
  - [app/api/benefits/collector/route.ts](app/api/benefits/collector/route.ts)

- [x] **Phase 4 – Vendor/Admin Routes (P2)**  
  - [app/api/vendor/stats/sales/route.ts](app/api/vendor/stats/sales/route.ts)  
  - [app/api/vendor/collectors/route.ts](app/api/vendor/collectors/route.ts)  
  - [app/api/vendor/announcements/route.ts](app/api/vendor/announcements/route.ts)  
  - [lib/payout-validator.ts](lib/payout-validator.ts)  
  - [app/admin/certificates/bulk/page.tsx](app/admin/certificates/bulk/page.tsx)

- [x] **Phase 5 – Sync Routes (P2)**  
  - [app/api/shopify/manual-sync/route.ts](app/api/shopify/manual-sync/route.ts)  
  - [app/api/shopify/sync-missing-order/route.ts](app/api/shopify/sync-missing-order/route.ts)  
  - [app/api/shopify/sync-fulfillments/route.ts](app/api/shopify/sync-fulfillments/route.ts)  
  - [app/api/shopify/check-missing-orders/route.ts](app/api/shopify/check-missing-orders/route.ts)  
  - [app/api/shopify/sync-status/route.ts](app/api/shopify/sync-status/route.ts)  
  - [app/api/sync-vendor-names/route.ts](app/api/sync-vendor-names/route.ts)  
  - [app/api/sync-all-products/route.ts](app/api/sync-all-products/route.ts)  
  - [app/api/editions/resequence/route.ts](app/api/editions/resequence/route.ts)

- [x] **Phase 6 – Utility/Other + gaps**  
  - [app/api/supabase-proxy/route.ts](app/api/supabase-proxy/route.ts)  
  - [app/api/products/list/route.ts](app/api/products/list/route.ts)  
  - [app/api/test-connections/route.ts](app/api/test-connections/route.ts)  
  - [app/api/update-line-item-status/route.ts](app/api/update-line-item-status/route.ts) – already v2  
  - [app/api/debug/route.ts](app/api/debug/route.ts)  
  - [app/api/debug/schema/route.ts](app/api/debug/schema/route.ts)  
  - [app/api/sync-vendor-names-single/route.ts](app/api/sync-vendor-names-single/route.ts) *(gap)*  
  - [app/api/warehouse/orders/auto-fulfill/route.ts](app/api/warehouse/orders/auto-fulfill/route.ts) *(gap)*  

### Verification
- `rg 'from\("order_line_items"\)' app/ lib/` returns **zero** matches

### Not Changed (per plan)
- `scripts/` – maintenance scripts  
- `db/` – SQL reference files  
- Database schema – no migrations  
- Legacy table – kept for backward compatibility  

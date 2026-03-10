# Analytics events map: Shop & Experience

Map of GA4 and **PostHog** events by page and component so we can track user activity, journeys, and funnel drop-off. **Tracked** = event is sent today; **Not tracked** = opportunity to add.

---

## PostHog: journeys, funnels, session replay, heatmaps

PostHog is initialized in [`app/providers.tsx`](../../app/providers.tsx) with **session replay**, **heatmaps**, **autocapture**, **pageleave**, **dead clicks**, and **rageclick**. Logged-in shop users are **identified** via `PostHogIdentify` (same file). E-commerce events are mirrored from GA4 to PostHog in [`lib/google-analytics.ts`](../../lib/google-analytics.ts); funnel events are in [`lib/posthog.ts`](../../lib/posthog.ts).

### Funnel events (for drop-off analysis)

| Event | When | Implementation |
|-------|------|----------------|
| `vendor_onboarding_started` | Vendor opens onboarding wizard | [`app/vendor/components/onboarding-wizard.tsx`](../../app/vendor/components/onboarding-wizard.tsx) |
| `vendor_onboarding_step_completed` | Vendor completes a step (Next) | Same |
| `vendor_onboarding_completed` | Vendor completes onboarding | Same |
| `collector_onboarding_started` | Collector opens onboarding | [`app/collector/components/onboarding-wizard.tsx`](../../app/collector/components/onboarding-wizard.tsx) |
| `collector_onboarding_step_completed` | Collector leaves a step (time spent) | Same |
| `collector_onboarding_completed` | Collector completes onboarding | Same |
| `collector_onboarding_skipped` | Collector skips onboarding | Same |
| `experience_quiz_started` | User sees experience intro quiz | [`app/shop/experience/components/IntroQuiz.tsx`](../../app/shop/experience/components/IntroQuiz.tsx) |
| `experience_quiz_completed` | User completes or skips quiz | Same |
| `experience_started` | Configurator is shown | [`app/shop/experience/components/ExperienceClient.tsx`](../../app/shop/experience/components/ExperienceClient.tsx) |
| `experience_filter_applied` | User applies filter (artist, tag, price, sort, etc.) | [`app/shop/experience/components/FilterPanel.tsx`](../../app/shop/experience/components/FilterPanel.tsx) |

In PostHog you can build **funnels** (e.g. `experience_quiz_started` → `experience_quiz_completed` → `experience_started` → `add_to_cart` → `begin_checkout` → `purchase`) and **paths** to find blockages and improve conversion.

---

## Global (all pages)

| Event | Source | Status | Notes |
|-------|--------|--------|--------|
| `page_view` | Root layout → [`components/google-analytics.tsx`](../../components/google-analytics.tsx) (init + `trackPageView` on load and `popstate`) | **Tracked** | Automatic for every route. |

---

## Shop: Product listing & discovery

| Route / component | Event | Status | Implementation |
|-------------------|--------|--------|----------------|
| `/shop` (home) | `page_view` | **Tracked** | Global. |
| `/shop` (home) | `view_item` (product card click to PDP) | **Tracked** | [`HomeProductCard`](../../app/shop/home/HomeProductCard.tsx) — `trackViewItem` on card click via `onCardClick`. |
| `/shop` (home) | `add_to_cart` (quick add) | **Tracked** | [`HomeProductCard`](../../app/shop/home/HomeProductCard.tsx) — `trackAddToCart(storefrontProductToItem(...))` after `cart.addItem`. |
| `/shop/products` | `page_view` | **Tracked** | Global. |
| `/shop/products` | `view_item` (grid cards click to PDP) | **Tracked** | [`ProductCardItem`](../../app/shop/components/ProductCardItem.tsx) — `trackViewItem` on card click. |
| `/shop/products` | `add_to_cart` (quick add) | **Tracked** | [`ProductCardItem`](../../app/shop/components/ProductCardItem.tsx) — `trackAddToCart(storefrontProductToItem(...))` after `cart.addItem`. |
| `/shop/products` | `search` (if search UI exists) | **Not tracked** | No search bar on products page; collection/sort only. |

---

## Shop: Product detail (PDP)

| Route / component | Event | Status | Implementation |
|-------------------|--------|--------|----------------|
| `/shop/[handle]` | `page_view` | **Tracked** | Global. |
| `/shop/[handle]` | `view_item` | **Tracked** | [`app/shop/[handle]/page.tsx`](../../app/shop/[handle]/page.tsx) — `trackViewItem(storefrontProductToItem(product, selectedVariant))` in useEffect when product loads. |
| `/shop/[handle]` | `add_to_cart` | **Tracked** | Same page — `trackAddToCart(storefrontProductToItem(...))` in `handleAddToCart` after `cart.addItem`. |

---

## Shop: Cart & checkout

| Route / component | Event | Status | Implementation |
|-------------------|--------|--------|----------------|
| `/shop/cart` | `page_view` | **Tracked** | Global. |
| `/shop/cart` | `begin_checkout` | **Tracked** | [`app/shop/cart/page.tsx`](../../app/shop/cart/page.tsx) — `trackBeginCheckout(cartItemsToProductItems(items), subtotal)` in `handleCheckout`. |
| Experience checkout (OrderBar) | `add_payment_info` | **Tracked** | [`OrderBar`](../../app/shop/experience/components/OrderBar.tsx) — `trackAddPaymentInfo(...)` in `onPaymentMethodChange`. |
| `/shop/checkout/success` | `page_view` | **Tracked** | Global. |
| `/shop/checkout/success` | `purchase` | **Not tracked** (here) | Purchase is tracked on [`/track/[token]`](../../app/track/[token]/page.tsx) when user lands with order token. |

---

## Shop: Artists

| Route / component | Event | Status | Implementation |
|-------------------|--------|--------|----------------|
| `/shop/artists` | `page_view` | **Tracked** | Global. |
| `/shop/artists/[slug]` | `page_view` | **Tracked** | Global. |
| `/shop/artists/[slug]` | `add_to_cart` (artist’s products) | **Tracked** | [`app/shop/artists/[slug]/page.tsx`](../../app/shop/artists/[slug]/page.tsx) — `trackAddToCart(storefrontProductToItem(...))` in `onQuickAdd`. |
| `/shop/artists/[slug]` | `view_item` (card click to PDP) | **Tracked** | [`VinylProductCard`](../../components/shop/VinylProductCard.tsx) — `trackViewItem` on card click. |

---

## Experience (lamp configurator)

| Route / component | Event | Status | Implementation |
|-------------------|--------|--------|----------------|
| `/shop/experience` | `page_view` | **Tracked** | Global. |
| `/shop/experience` (Intro quiz) | Custom (e.g. `quiz_start` / `quiz_complete`) | **Not tracked** | [`app/shop/experience/components/IntroQuiz.tsx`](../../app/shop/experience/components/IntroQuiz.tsx) — optional for funnel. |
| Configurator – artwork strip | `view_item` (preview / detail) | **Tracked** | [`Configurator`](../../app/shop/experience/components/Configurator.tsx) — `trackViewItem(storefrontProductToItem(previewed))` in `useEffect` when `previewed` changes. |
| Configurator – artwork strip | `add_to_cart` (add to order) | **Tracked** | Configurator `handleAddToCart` — `trackAddToCart(storefrontProductToItem(product))` when adding. |
| Configurator – search | `search` | **Tracked** | Configurator search input — `trackSearch(searchQuery)` on Enter. |
| Configurator – filter | Custom (e.g. `filter_apply`) | **Not tracked** | FilterPanel / filters — optional. |
| Order bar – open drawer | `begin_checkout` | **Tracked** | [`OrderBar`](../../app/shop/experience/components/OrderBar.tsx) — `trackBeginCheckout(...)` when drawer opens with items. |
| Order bar – payment | `add_payment_info` | **Tracked** | OrderBar — `trackAddPaymentInfo(...)` in `onPaymentMethodChange`. |
| Configurator – lamp paywall | `experience_lamp_paywall_add_to_cart` | **Tracked** | Configurator — when user clicks "Add Street Lamp" on paywall (`trackEnhancedEvent`, params: `source: 'configurator'`). |
| Configurator – lamp paywall | `experience_lamp_paywall_skip` | **Tracked** | Configurator — when user clicks "Skip — browse artworks without lamp" (`trackEnhancedEvent`, params: `source: 'configurator'`). |
| Experience – A/B test | `experience_ab_assigned` | **Tracked** | [`ExperienceClient`](../../../app/shop/experience/components/ExperienceClient.tsx) — when visitor is assigned to variant `onboarding` or `skip` (50/50). Params: `variant`, `test: 'experience_onboarding'`. User property `experience_ab_variant` is also set for segmenting all subsequent events. |
| Experience → success | `purchase` | **Not tracked** (on success page) | Same as shop: purchase tracked on `/track/[token]` when user has order token. |

---

## Collector & post-purchase

| Route / component | Event | Status | Implementation |
|-------------------|--------|--------|----------------|
| `/collector/artwork/[id]` | `page_view` | **Tracked** | Global. |
| `/collector/artwork/[id]` | `view_item` | **Tracked** | [`app/collector/artwork/[id]/page.tsx`](../../app/collector/artwork/[id]/page.tsx) — `useShopifyAnalytics()` → `trackProductView`. |
| `/track/[token]` | `page_view` | **Tracked** | Global. |
| `/track/[token]` | `purchase` | **Tracked** | [`app/track/[token]/page.tsx`](../../app/track/[token]/page.tsx) — `trackPurchaseFromOrder(orderId)` after order load. |

---

## Other pages (affiliate, vendor, etc.)

All of these use the root layout, so they get **`page_view`** automatically from the global `GoogleAnalytics` component.

| Route / component | Event | Status | Notes |
|-------------------|--------|--------|--------|
| `/shop/collab` | `page_view` | **Tracked** | Affiliate program marketing page. Global. |
| `/vendor/*` (dashboard, profile, analytics, onboarding, etc.) | `page_view` | **Tracked** | Vendor app — all routes under root layout. Global. |
| `/shop/artists/[slug]?ref=...` | `page_view` | **Tracked** | Artist page when arrived via affiliate link; ref is in URL. Global. |
| `/shop/experience?artist=...` | `page_view` | **Tracked** | Experience with artist pre-filter (e.g. affiliate). Global. |
| `/r/[slug]` | (no view) | **Redirect** | Short affiliate link; server redirects to `/shop/artists/[slug]?ref=...` so no HTML is rendered — GA sees the destination page_view only. |
| Affiliate landing | `affiliate_landing` | **Tracked** | Fired once when user lands with `?ref=` on [`/shop/artists/[slug]`](../../app/shop/artists/[slug]/page.tsx) or with `?artist=` on experience ([`ExperienceClient`](../../app/shop/experience/components/ExperienceClient.tsx)). Params: `affiliate_ref`/`affiliate_slug`, `page` (`artist` | `experience`), optional `artist_slug`. |

---

## Summary: e-commerce events wired

E-commerce events are connected via [`lib/analytics-ecommerce.ts`](../../lib/analytics-ecommerce.ts) (helpers to build GA4 `ProductItem` from storefront products and cart items) and the following call sites:

| Area | Status |
|------|--------|
| **Shop PDP** | `view_item` on load; `add_to_cart` in `handleAddToCart`. |
| **Shop product cards** (home, products, artists) | `add_to_cart` in quick-add. Optional: `view_item` on card view/click. |
| **Shop cart** | `begin_checkout` when user clicks checkout. |
| **Experience** | `view_item` on preview change; `add_to_cart` when adding to order; `search` on Enter; `begin_checkout` when order drawer opens; `add_payment_info` when payment method selected. |
| **Purchase** | Tracked on `/track/[token]` when user lands with order token. |

---

## Implementation references

- GA helpers: [`lib/google-analytics.ts`](../../lib/google-analytics.ts)
- E-commerce item builders: [`lib/analytics-ecommerce.ts`](../../lib/analytics-ecommerce.ts)
- Shopify-shaped tracking: [`lib/shopify-analytics.ts`](../../lib/shopify-analytics.ts)
- Hooks: [`hooks/use-analytics.ts`](../../hooks/use-analytics.ts) — `useAnalytics()`, `useShopifyAnalytics()`, `usePurchaseTracking()`

Use this map to add any remaining events (e.g. `view_item` on product grid, quiz events) or to verify tracking in GA4.

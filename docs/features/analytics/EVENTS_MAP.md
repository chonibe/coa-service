# Analytics events map: Shop & Experience

Map of GA4 and **PostHog** events by page and component so we can track user activity, journeys, and funnel drop-off. **Tracked** = event is sent today; **Not tracked** = opportunity to add.

---

## PostHog: journeys, funnels, session replay, heatmaps

PostHog is initialized in [`app/providers.tsx`](../../app/providers.tsx) with **session replay**, **heatmaps**, **autocapture**, **pageleave**, **dead clicks**, and **rageclick**. Logged-in shop users are **identified** via `PostHogIdentify` (same file). E-commerce events are mirrored from GA4 to PostHog in [`lib/google-analytics.ts`](../../lib/google-analytics.ts); funnel events are in [`lib/posthog.ts`](../../lib/posthog.ts).

### Experience v2 shell vs onboarding (where events fire)

- **Live configurator:** `/shop/experience` and `/shop/experience-v2` load [`ExperienceV2Client`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx). That shell fires `experience_started` (once per tab), A/B resolution, affiliate/direct entry, picker/carousel events, and artwork preview tracking.
- **Onboarding quiz:** `/shop/experience-v2/onboarding/...` uses [`ExperienceOnboardingClient`](../../app/(store)/shop/experience-v2/components/ExperienceOnboardingClient.tsx) → [`IntroQuiz`](../../app/(store)/shop/experience-v2/components/IntroQuiz.tsx) for quiz funnel events and quiz person properties.
- **Legacy:** [`ExperienceClient`](../../app/(store)/shop/experience-v2/components/ExperienceClient.tsx) under `experience-v2/components` is **not** mounted by the main experience routes today; do not assume its-only events run on production URLs unless you embed that component elsewhere.

### Funnel events (for drop-off analysis)

| Event | When | Properties | Implementation |
|-------|------|------------|----------------|
| `vendor_onboarding_started` | Vendor opens onboarding wizard | | [`app/vendor/components/onboarding-wizard.tsx`](../../app/vendor/components/onboarding-wizard.tsx) |
| `vendor_onboarding_step_completed` | Vendor completes a step (Next) | | Same |
| `vendor_onboarding_completed` | Vendor completes onboarding | | Same |
| `collector_onboarding_started` | Collector opens onboarding | `total_steps` | [`app/collector/components/onboarding-wizard.tsx`](../../app/collector/components/onboarding-wizard.tsx) |
| `collector_onboarding_step_completed` | Collector transitions away from any step (incl. step 0) | `step`, `step_name`, `time_spent_seconds` | Same |
| `collector_onboarding_completed` | Collector completes all steps | `total_steps` | Same |
| `collector_onboarding_skipped` | Collector skips onboarding | | Same |
| `experience_quiz_started` | User sees experience intro quiz | | [`IntroQuiz.tsx`](../../app/(store)/shop/experience-v2/components/IntroQuiz.tsx) (onboarding route) |
| `experience_quiz_step_completed` | User answers quiz step 1 or 2 | `step`, `answer`, `time_spent_seconds` | Same |
| `experience_quiz_completed` | User completes step 3 (name + continue) | `owns_lamp`, `purpose`, `provided_name` | Same |
| `experience_quiz_skipped` | User clicks "Skip for now" | `at_step` | Same |
| `experience_onboarding_login_clicked` | User clicks "Already have an account? Log in" | `step` | Same |
| `experience_redirected_to_onboarding` | Legacy: user sent from old experience client to onboarding | `reason`, `ab_variant` | [`ExperienceClient.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceClient.tsx) (not on main v2 URLs unless embedded) |
| `experience_ab_variant_known` | A/B variant resolved (new or from cookie) | `variant`, `is_new_assignment` | [`ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) |
| `experience_started` | Configurator or quiz context shown | v2 shell: `surface`, `device_type`, `initial_artist_slug`, `direct_entry`, quiz fields from storage | [`ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) via `trackExperienceV2ConfiguratorEntry` in [`lib/posthog.ts`](../../lib/posthog.ts) |
| `experience_picker_opened` | Artwork picker sheet opens | context | `ExperienceV2Client.tsx` |
| `experience_picker_closed` | Artwork picker sheet closes | context | Same |
| `experience_carousel_navigated` | Carousel navigation in v2 shell | direction / index (as implemented) | Same |
| `experience_artwork_previewed` | Artwork detail opened in v2 | product fields | Same + [`ArtworkDetail`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) |
| `experience_filter_applied` | User applies filter in picker | artist, tag, etc. | [`FilterPanel.tsx`](../../app/(store)/shop/experience-v2/components/FilterPanel.tsx) |
| `experience_filter_interaction` | Filter panel opened (v2) | `action`, `filter_type`, `context` | Same |

### Micro-interaction events (granular step-level tracking)

| Event | When | Properties | Implementation |
|-------|------|------------|----------------|
| `onboarding_step_viewed` | Any onboarding step becomes visible | `step`, `context` (`experience_quiz` \| `collector_onboarding`) | [`IntroQuiz.tsx`](../../app/(store)/shop/experience-v2/components/IntroQuiz.tsx), [`onboarding-wizard.tsx`](../../app/collector/components/onboarding-wizard.tsx) |
| `onboarding_step_interaction` | User taps a choice button | `step`, `button_type`, `context` | `IntroQuiz.tsx` |
| `onboarding_step_abandoned` | User leaves a step without completing | `step`, `context`, `time_spent_seconds` | `IntroQuiz.tsx`, `onboarding-wizard.tsx` |
| `onboarding_field_focused` | User focuses a form input | `field_name`, `step`, `context` | `IntroQuiz.tsx`, `onboarding-wizard.tsx` |
| `onboarding_field_error` | Validation error shown | `field_name`, `error_message` | `onboarding-wizard.tsx` |
| `checkout_step_viewed` | Address or payment step completed | `step_name`, `payment_method` | `CheckoutLayout.tsx`, `OrderBar.tsx` |

### E-commerce events (PostHog + GA4 mirror)

| Event | When | Properties | Implementation |
|-------|------|------------|----------------|
| `view_cart` | Cart page loads with items | `items`, `value`, `currency` | [`app/(store)/shop/cart/page.tsx`](../../app/(store)/shop/cart/page.tsx) |
| `view_item` | User views a product | item fields | `lib/google-analytics.ts` + PostHog mirror |
| `add_to_cart` | User adds item | item fields | Same |
| `begin_checkout` | Checkout session created successfully | `items`, `value`, `currency` | `cart/page.tsx` (after API success) |
| `add_shipping_info` | Shipping address saved | `items`, `value`, `country`, `currency` | `CheckoutLayout.tsx`, `OrderBar.tsx` |
| `add_payment_info` | Payment method selected | `payment_type`, `items`, `value`, `currency` | `CheckoutLayout.tsx` |
| `purchase` | Order completed | `transaction_id`, `value`, `currency`, `items` | Client: `lib/google-analytics.ts` + PostHog; server: Stripe webhook → [`capturePostHogServerEvent`](../../lib/posthog-server.ts) with `$set` `has_purchased` when email is known |
| `promo_code_applied` | Valid promo code applied | `code`, `discount_amount` | `CheckoutLayout.tsx` |
| `checkout_cancelled` | User returns from Stripe with `?cancelled=true` | `item_count`, `subtotal` | `cart/page.tsx` |

### Error & session events

| Event | When | Properties | Implementation |
|-------|------|------------|----------------|
| `checkout_error` | Checkout API or form error | `error_message`, `source` | `cart/page.tsx`, `OrderBar.tsx` |
| `payment_error` | Payment step or webhook error | `error_message`, `source` | `OrderBar.tsx`, `checkout-success-content.tsx` |
| `session_context` | PostHog init (once per session) | `referrer`, `device_type`, `is_returning_user`, `screen_width`, `screen_height`, `language` | `lib/posthog.ts` via `providers.tsx` |
| `session_tagged` | Critical drop-off point | `tag` (`checkout-error` \| `payment-error`) | `lib/posthog.ts` → `tagSessionForReplay()` |

### Collector claim flow events

| Event | When | Properties | Implementation |
|-------|------|------------|----------------|
| `collector_claim_page_viewed` | Guest purchaser opens claim page | `profile_exists` | [`app/collector/welcome/welcome-client.tsx`](../../app/collector/welcome/welcome-client.tsx) |
| `collector_claim_google_clicked` | User clicks "Sign in with Google" on claim page | | Same |
| `collector_claim_continue_shopping` | User clicks "Continue Shopping" on claim page | | Same |

In PostHog you can build **funnels** (e.g. `experience_quiz_started` → `experience_quiz_step_completed` → `experience_quiz_completed` → `experience_started` → `add_to_cart` → `begin_checkout` → `purchase`) and **paths** to find blockages and improve conversion.

### Feature flags (PostHog)

| Flag Key | Purpose | Variants |
|----------|---------|---------|
| `experience_onboarding_variant` | A/B test onboarding vs skip (planned migration from cookie) | `onboarding` \| `skip` |

See `hooks/use-posthog-feature-flag.ts` for the `usePostHogFeatureFlag` and `usePostHogFeatureFlagEnabled` hooks.

### User properties (set via PostHog `setPersonProperties`)

| Property | Type | When set | Implementation |
|----------|------|----------|----------------|
| `preferred_device` | `mobile` \| `tablet` \| `desktop` | Session init | [`lib/posthog.ts`](../../lib/posthog.ts) → `captureSessionContext()` |
| `experience_ab_variant` | `onboarding` \| `skip` | A/B assignment | [`ExperienceV2Client.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) |
| `quiz_owns_lamp`, `quiz_purpose` | boolean, `gift` \| `self` | Quiz finished (all steps) | [`IntroQuiz.tsx`](../../app/(store)/shop/experience-v2/components/IntroQuiz.tsx) |
| `experience_quiz_completed_flag`, `experience_quiz_skipped_flag` | boolean | Quiz completed vs “Skip for now” | `IntroQuiz.tsx`; merged on identify from `sc-experience-quiz` in `lib/posthog.ts` |
| `experience_configurator_visited`, `last_experience_surface` | boolean, string | First v2 configurator entry this tab | `trackExperienceV2ConfiguratorEntry` in [`lib/posthog.ts`](../../lib/posthog.ts) |
| `experience_started_count` | number | Each v2 configurator tab entry (localStorage-backed) | Same |
| `experience_redirected_to_onboarding_flag` | boolean | Onboarding opened with referrer from v2 configurator (not `/onboarding`) | [`ExperienceOnboardingClient.tsx`](../../app/(store)/shop/experience-v2/components/ExperienceOnboardingClient.tsx) |
| `has_added_to_cart` | boolean | First `add_to_cart` in browser | [`lib/posthog.ts`](../../lib/posthog.ts) (`captureAddToCart`) |
| `has_used_experience_v2_cart` | boolean | `add_to_cart` with experience list name | Same |
| `has_saved_shipping_address` | boolean | Successful `add_shipping_info` | Same |
| `has_checkout_error` | boolean | Checkout error captured | `captureCheckoutError` in [`lib/posthog.ts`](../../lib/posthog.ts) |
| `has_used_promo_code` | boolean | Valid promo applied | [`CheckoutLayout.tsx`](../../components/shop/checkout/CheckoutLayout.tsx) |
| `visited_collector_claim` | boolean | Claim page view | [`welcome-client.tsx`](../../app/collector/welcome/welcome-client.tsx) |
| `visited_order_tracking` | boolean | Track page loaded with orders | [`app/track/[token]/page.tsx`](../../app/track/[token]/page.tsx) |
| `collector_onboarding_completed_flag`, `collector_onboarding_skipped_flag` | boolean | Collector wizard complete / skip | [`onboarding-wizard.tsx`](../../app/collector/components/onboarding-wizard.tsx) |
| `shop_authenticated` | boolean | Shop user identified | [`app/providers.tsx`](../../app/providers.tsx) |
| `last_shop_login_at` | ISO string | Last shop identify with email | Same |
| `has_purchased` | boolean | Thank-you, Stripe webhook `$set`, or tracking page | `capturePurchase` / server capture; [`app/api/stripe/webhook/route.ts`](../../app/api/stripe/webhook/route.ts); `app/track/[token]/page.tsx` |
| `total_purchases` | number | Order tracking page | `app/track/[token]/page.tsx` |
| `first_purchase_at` | ISO date string | Order tracking page | Same |

### Stage / source (which artworks, from where)

`view_item` and `add_to_cart` include **`item_list_name`** (stage) so you can segment by where the user saw or added the artwork:

| Stage        | Where |
|-------------|--------|
| `home`      | Home page grid |
| `products`  | Shop products grid |
| `artist`    | Artist profile page |
| `pdp`       | Product detail page (view or add) |
| `experience`| Experience configurator (preview or add to order) |

In PostHog or GA4, filter or break down by `item_list_name` to see which artworks are selected or added at each stage.

---

## Global (all pages)

| Event | Source | Status | Notes |
|-------|--------|--------|--------|
| `page_view` | Root layout → [`components/google-analytics.tsx`](../../components/google-analytics.tsx) (init + `trackPageView` on load and client route changes via History API + `popstate`) | **Tracked** | Automatic for every route transition, including client navigation. |

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
| **Purchase** | Client on `/track/[token]` and thank-you flows; server `purchase` + `$set` from Stripe webhook when email is known ([`lib/posthog-server.ts`](../../lib/posthog-server.ts)). |

---

## Implementation references

- GA helpers: [`lib/google-analytics.ts`](../../lib/google-analytics.ts)
- E-commerce item builders: [`lib/analytics-ecommerce.ts`](../../lib/analytics-ecommerce.ts)
- Shopify-shaped tracking: [`lib/shopify-analytics.ts`](../../lib/shopify-analytics.ts)
- Hooks: [`hooks/use-analytics.ts`](../../hooks/use-analytics.ts) — `useAnalytics()`, `useShopifyAnalytics()`, `usePurchaseTracking()`

Use this map to add any remaining events (e.g. `view_item` on product grid, quiz events) or to verify tracking in GA4.

---

## Document metadata

- **lastUpdated:** 2026-03-23
- **version:** 1.1.0
- **Change log:** Experience v2 shell vs onboarding documented; funnel table paths updated; person properties expanded; server `purchase` documented.

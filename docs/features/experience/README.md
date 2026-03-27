# Shop Experience Page

## Overview

The Experience page (`/shop/experience`) lets users customize a Street Lamp with artwork. It includes an intro quiz, a 3D Spline preview, an artwork strip, filters, and checkout. When at least one artwork is in the cart, a sticky bottom bar shows a primary line item and a **Checkout** CTA (opens the same OrderBar drawer as the header cart); see [`ExperienceCheckoutStickyBar`](../../../app/(store)/shop/experience-v2/components/ExperienceCheckoutStickyBar.tsx).

**Implementation**: [`app/shop/experience/`](../../../app/shop/experience/)

## Rotation And Selection Reference

Artwork queueing, side replacement, and Spline rotate/settle behavior are documented in:

- [`ROTATION_AND_SELECTION_LOGIC.md`](./ROTATION_AND_SELECTION_LOGIC.md)

## Performance Optimizations (2026-02)

### Implemented

1. **Streaming + Suspense** – Page shell renders immediately; data streams in via `loading.tsx` and Suspense fallback.
2. **Lazy Spline 3D** – `Spline3DPreview` is loaded with `next/dynamic` only when the configurator mounts.
3. **Deferred Spline scene fetch** – experience layout no longer preloads `scene.splinecode` in the initial HTML. The 3D scene is now fetched only when `SplineFullScreen` promotes from facade to live Spline, reducing first-load network contention.
4. **Spline when visible** – `SplineWhenVisible` defers mounting Spline until the preview container is in the viewport (Intersection Observer).
3. **Lightweight product payload** – `getCollectionWithListProducts` uses `PRODUCT_LIST_FRAGMENT` (no description, media, full variants) for the artwork strip; full product fetched on-demand when opening ArtworkDetail.
4. **Virtualized ArtworkStrip** – `@tanstack/react-virtual` renders only visible rows (~10–15 cards instead of 100+).
5. **Reduced motion** – `whileHover` / `whileTap` removed from ArtworkCard to cut scroll-time JS work.
6. **Error boundaries** – Configurator and Spline wrapped in `ComponentErrorBoundary` for graceful degradation.
7. **Carousel image loading** – ArtworkStrip uses `getShopifyImageUrl(url, 500)` to request 500px-wide thumbnails from Shopify CDN, plus `priority` and `loading="eager"` for the first 6 cards to improve above-the-fold load time.
8. **Detail preload** – When cards enter the virtualized view, Configurator prefetches full product data (`/api/shop/products/[handle]`) into cache so the detail drawer opens instantly when the user taps.

### Spline Scroll / Touch Release (2026-03-19)

When the Spline 3D model captured touch for rotation, users couldn't scroll the page. Multiple fixes applied:

1. **Canvas pointer-events disabled** — The Spline canvas has `pointerEvents: 'none'` and `touchAction: 'none'` so Spline's internal event listeners never receive events. All interaction is handled by the container div which has `touchAction: 'pan-y'`.
2. **Orbit controls fully disabled** — Spline's internal orbit controls called `preventDefault()` on touch/wheel, blocking scroll. Now `controls.enableZoom = false`, `controls.enabled = false`, and `controls.dispose()` are called to remove all internal event listeners. Rotation is handled by the custom `tick()` rAF loop.
3. **Gesture direction detection** — Touch handlers on the container defer `isPointerOverRef` until gesture direction is committed. A `gestureIsVerticalRef` flag persists for the entire gesture once set, ensuring vertical swipes are never captured for rotation.
4. **touch-action: pan-y** — Applied to container so browser handles vertical scrolling natively.
5. **Passive slide tracking** — `handleScroll` picks the reel section whose vertical midpoint is closest to the viewport midpoint. **Each gallery image after the first is its own section** (refs `galleryBase + idx`) so `previewSlideIndex` matches [`ArtworkInfoBar`](../../../app/(store)/shop/experience/components/ArtworkInfoBar.tsx) thumbnails: image idx `0` → slide `1` (details), idx `≥1` → `gallerySlideOffset + idx - 1`. Parent `sectionCount` includes `galleryImages.length - 1` gallery sections when `galleryImages.length > 1`.
6. **Reel scroll-snap removed (2026-03)** — `y proximity` snap on the reel fought the Spline wheel-forward path (`scrollTop` + `preventDefault`), leaving `scrollTop` stuck while wheel deltas continued (verified via `.cursor/debug-2240e8.log`: `scrolled` with `newTop` frozen). Thumbnail navigation still uses smooth `scrollIntoView`.
7. **Bottom padding reduced** — Changed from `pb-[80svh]` to `pb-[20vh]` so gallery doesn't have excessive empty space.
8. **Accordion removed from slide system** — The accordion (artist bio, specs, description) is no longer tracked as a "slide". It's now a separate scrollable section between Spline and gallery, allowing natural interaction without the slide system interfering.
9. **Wheel: `parentScrollMode` + reel ref (2026-03-20+)** — `Spline3DPreview` (minimal) keeps a **transparent layer** above the canvas so `wheel` is not eaten by WebGL. **`contain`** ([`SplineFullScreen`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx)) passes **`reelScrollContainerRef`** to the reel’s `overflow-y-auto` node so deltas apply to the correct scroller (native wheel often never reaches that parent when the pointer is over the canvas). **`isolate`** (default; [Configurator](../../../app/(store)/shop/experience-v2/components/Configurator.tsx)) forwards to the first scrollable ancestor or visible `[data-experience-artwork-scroll]`, then `preventDefault` + `stopPropagation`. Loading overlay stays `pointer-events: none` so wheel reaches the layer while the spinner shows.
10. **Reel: top bar `pointer-events-none`** — The absolute full-width top strip (`z-10`) used to sit above the preview with default hit targets on the flex row, so **empty space** beside the title/thumbnails blocked wheel/touch from reaching the 3D area. Outer shells use `pointer-events-none`; only the title column and thumbnail column use `pointer-events-auto` so passes through elsewhere.

11. **Reel: suppress slide sync during `scrollIntoView`** — When thumbnails call `onGoToSlide`, `SplineFullScreen` runs smooth `scrollIntoView`. Mid-animation, midpoint-based `handleScroll` could report the wrong section and fight the parent `currentSlide`. `ignoreSlideSyncUntilRef` blocks `onSlideChange` from `handleScroll` until `scrollend` on the reel (where supported) or an ~850ms timeout; then `lastReportedSectionRef` is aligned to the target slide.

12. **Gallery: Back to top** — When there are multiple gallery images (`galleryImages.length > 1`), a pill button scrolls the reel to section 0 (Spline), calls `onSlideChange(0)`, and uses the same slide-sync guard as other programmatic jumps. While the Spline section is still largely in view, the button sits **below the last gallery image**. Once the user scrolls past the top reel (IntersectionObserver on section 0; when visible fraction drops below ~12% the 3D + thumbnail stack is effectively gone), the **inline** control hides and a **docked** pill appears at the **bottom of the preview column** (`absolute`) so it stays reachable without scrolling to the gallery end. Both pills use **glassmorphism** (`backdrop-blur-xl`, translucent fill, light border, inset + soft drop shadow) aligned with the bottom [`ArtworkCarouselBar`](../../../app/(store)/shop/experience/components/ArtworkCarouselBar.tsx) **+** control.

**Result** — Horizontal swipe = rotate lamp. Vertical swipe = scroll page. Reel uses native scrolling over the model; Configurator still scrolls the artwork panel from the 3D column. Thumbnail highlights stay stable during smooth section jumps.

**Files changed**:
- [`app/template-preview/components/spline-3d-preview.tsx`](../../../app/template-preview/components/spline-3d-preview.tsx) — canvas pointer-events disabled, orbit controls disabled, gesture detection on container, wheel forwarding for sibling scroll regions
- [`app/(store)/shop/experience-v2/components/Configurator.tsx`](../../../app/(store)/shop/experience-v2/components/Configurator.tsx) — `data-experience-artwork-scroll` on artwork strip
- [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — `data-experience-artwork-scroll` on desktop info column scroll
- [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — passive slide tracking, reduced padding, accordion removed from slide refs (reel scroll-snap removed — conflicts with wheel forwarding)
- [`app/(store)/shop/experience/components/ExperienceV2Client.tsx`](../../../app/(store)/shop/experience/components/ExperienceV2Client.tsx) — slide count updated, gallerySlideOffset simplified
- [`app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx`](../../../app/(store)/shop/experience-v2/components/ExperienceV2Client.tsx) — same updates for v2

### Spline Viewport Sizing (2026-03-19)

The Spline preview is responsive: the model scales down as the screen becomes smaller so it fits the viewport height and width without skewing.

1. **Fit-within-viewport sizing**: `getContainerSize()` computes a size that fits within the container while preserving the lamp aspect ratio (4:5). On smaller screens the model scales down proportionally; on wider viewports it is letterboxed to avoid distortion.

2. **Centered canvas + vertical nudge**: The container uses `flex items-center justify-center` so the canvas is centered when letterboxing occurs. The canvas uses `max-width: 100%` and `max-height: 100%` to stay within bounds. Minimal mode applies `translateY(-10%)` (with quarter-turn rotation) so the lamp sits slightly higher in the frame.

3. **Container as single source of truth**: `getContainerSize()` uses container `getBoundingClientRect()` for renderer/camera sizing (not `canvas.clientWidth/clientHeight` which can be transitional during layout settling).

4. **Stable viewport height**: `SplineFullScreen.tsx` uses `svh` (small viewport height) instead of `dvh` for scrollable carousel mode. `svh` doesn't change with mobile browser chrome, avoiding layout shifts.

5. **Artist bio section higher in reel**: When the accordion (artist bio / details) is shown, section 0 uses `min-h-[78svh]` instead of `100svh` so the second block starts sooner while scrolling; gallery-only reels (no accordion) still use `100svh`. Accordion wrapper uses lighter top padding (`pt-3` / `md:pt-4`).

6. **Debug logging**: Dev-only aspect ratio logging in `applySize()` (controlled by `NEXT_PUBLIC_SPLINE_VERBOSE=1`).

**Files changed**:
- [`app/template-preview/components/spline-3d-preview.tsx`](../../../app/template-preview/components/spline-3d-preview.tsx) — sizing logic and debug logs
- [`app/(store)/shop/experience/components/SplineFullScreen.tsx`](../../../app/(store)/shop/experience/components/SplineFullScreen.tsx) — viewport height units

### Spline Scene Optimization (Optional)

The `scene.splinecode` file is ~6.7MB. To reduce it in the Spline editor:

1. **Export > Play Settings > Compression** – Set Geometry Quality to "Performance"; enable image compression (can reduce textures up to 4x).
2. **Performance Panel** – Use Spline's built-in metrics to find heavy elements (polygons, materials, textures).
3. **Simplify** – Reduce subdivision levels, lower polygon counts on parametric objects, avoid excessive clones.

See [Spline optimization docs](https://docs.spline.design/doc/-/doczPMIye7Ko).

### Image Optimization (Optional)

Current config has `images: { unoptimized: true }` in [next.config.js](../../../next.config.js).

- **Re-enable optimization**: Set `unoptimized: false` and add `remotePatterns` for Shopify domains (e.g. `cdn.shopify.com`). Requires compatible image provider support.
- **Keep unoptimized**: If external CDN constraints apply, keep `unoptimized: true`. ArtworkStrip uses `lib/shopify/image-url.ts` to append `_500x` to Shopify CDN URLs for smaller, faster carousel thumbnails.

## Checkout & Payment (Stripe)

The experience checkout uses a **single-screen drawer flow** powered by Stripe Checkout Sessions API with embedded Payment Element (`ui_mode: "custom"`). All 4 payment methods (Credit Card, Google Pay, Link, PayPal) are supported within the OrderBar drawer.

### Checkout Flow

1. **Cart Review**: Items, lamp discount, gift note, totals, Address, Payment, Promo rows
2. **Address Modal**: Collect shipping address (email, name, country, address, city, state/province, postal code, phone); "Same as billing" when billing exists
3. **Payment Modal**: Stripe Payment Element (card/GPay/Link/PayPal), billing address ("Same as Address"), promo codes
4. **Place Order**: Submits Payment Element; redirects to success on completion

### Address Form Enhancements

- **Address Autocomplete**: Uses **Google Places** when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set. Selecting a suggestion auto-fills street, city, state, **ZIP/postal code**, and country. ZIP codes are explicitly fetched and displayed. Without Google keys, a plain address input is shown (no autocomplete).
- **ZIP / Postal code field**: Dedicated field with label "ZIP / Postal code"; populated from autocomplete selection; supports both US ZIP and international postal codes.
- **State/Province by Country**: US, CA, AU, MX show a dropdown of states/provinces; other countries show a free-text field.
- **Phone with Country Code Detection**: Pasting or typing a full international number (e.g. `+44 7911 123456`) auto-detects the country code, updates the country dropdown, and strips the code from the local number.

### Payment Methods

| Method | How it works | Redirect? |
|--------|-------------|-----------|
| **Credit Card** | Payment Element card form → `checkout.confirm()` | No |
| **Google Pay** | Payment Element shows GPay button | No |
| **Link** | Payment Element shows Link autofill; `setup_future_usage` saves for returns | No |
| **PayPal** | Payment Element shows PayPal option → redirect to PayPal | Yes (required) |

### Stripe Checkout Session Features

- `allow_promotion_codes: true` — Native Stripe promo codes in Payment Element
- `billing_address_collection: 'auto'` — Collect billing when needed
- `payment_intent_data.setup_future_usage: 'off_session'` — Save cards for Link and returning customers
- **Saved payment methods** — Stripe Customer ID stored in `collector_profiles`/`collectors` after checkout; returning users are passed `customer` instead of `customer_email` so they can reuse saved cards, Link, etc., without re-entering.
- Session expiry recovery — "Try again" fetches new session when expired

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| `IntroQuiz` | [`app/shop/experience/components/IntroQuiz.tsx`](../../../app/shop/experience/components/IntroQuiz.tsx) | 4-step onboarding: lamp ownership, purpose (gift/self), name, optional email |
| `ExperienceSlideoutMenu` | [`app/shop/experience/ExperienceSlideoutMenu.tsx`](../../../app/shop/experience/ExperienceSlideoutMenu.tsx) | Hamburger menu with auth slide-up |
| `AuthSlideupMenu` | [`components/shop/auth/AuthSlideupMenu.tsx`](../../../components/shop/auth/AuthSlideupMenu.tsx) | Login/signup slide-up (Email OTP, Google, Facebook) |
| `OrderBar` | [`app/shop/experience/components/OrderBar.tsx`](../../../app/shop/experience/components/OrderBar.tsx) | Drawer checkout with Address, Payment, Promo |
| `ExperienceQuizPrefill` | [`components/shop/checkout/ExperienceQuizPrefill.tsx`](../../../components/shop/checkout/ExperienceQuizPrefill.tsx) | Pre-fills checkout address with quiz name/email |
| `AddressModal` | [`components/shop/checkout/AddressModal.tsx`](../../../components/shop/checkout/AddressModal.tsx) | Shipping address form; "Same as billing" option |
| `PaymentMethodsModal` | [`components/shop/checkout/PaymentMethodsModal.tsx`](../../../components/shop/checkout/PaymentMethodsModal.tsx) | Payment Element + billing section |
| `PaymentStep` | [`components/shop/checkout/PaymentStep.tsx`](../../../components/shop/checkout/PaymentStep.tsx) | CheckoutProvider, Payment Element, error recovery |
| `CheckoutContext` | [`lib/shop/CheckoutContext.tsx`](../../../lib/shop/CheckoutContext.tsx) | Address, billing, sameAsShipping, promo state |

### API Endpoints (Checkout)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/checkout/create-checkout-session` | Creates Checkout Session (`ui_mode: custom`) for embedded Payment Element |
| `POST /api/checkout/create` | Checkout Session (main shop cart, credits, zero-dollar flows) |
| `POST /api/checkout/complete-order` | Legacy PaymentIntent completion (idempotent) |
| `POST /api/checkout/create-setup-intent` | SetupIntent for card + Link (legacy, main cart) |

### Stripe Configuration

- **Payment method domains** — Google Pay, Link, and PayPal require domain registration. Register via:
  - `POST /api/admin/register-payment-domains` (or `npm run register:payment-domains` with dev server running)
  - Or manually at [Stripe Dashboard → Payment method domains](https://dashboard.stripe.com/settings/payment_method_domains)
- Payment methods enabled in Stripe Dashboard: card, link, paypal, Google Pay
- Environment variables: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Google Pay not showing?** See [Google Pay troubleshooting in CHECKOUT_TEST_RUN](../../CHECKOUT_TEST_RUN.md#google-pay-not-showing).

See [docs/COMMIT_LOGS/experience-checkout-stripe-payment-methods-2026-03-01.md](../COMMIT_LOGS/experience-checkout-stripe-payment-methods-2026-03-01.md) for earlier configuration details.

## Intro Quiz Onboarding

The experience onboarding is a **4-step flow on dedicated URLs** so each step can be tracked (analytics, conversion by step):

| Step | URL | Content |
|------|-----|---------|
| 1 | `/shop/experience/onboarding` | "Let's get started" — Do you already have a Street Lamp? (Yes / I'm new here) + "Already have an account? Log in" + Skip for now |
| 2 | `/shop/experience/onboarding/2` | "Who is this for?" — For me / It's a gift |
| 3 | `/shop/experience/onboarding/3` | "Let's create an awesome gift" or "Let's get to know you" — What's your name? + Continue |
| 4 | `/shop/experience/onboarding/4` | "Hey there, [Name]! 👋" — What's your email? (optional) + Continue + Terms & Privacy links |

**Returning users (log in to skip):** On step 1, an "Already have an account? Log in" link opens the slideout auth (email OTP, Google, etc.). After successful login, the user is redirected to `/shop/experience?fromOnboardingLogin=1`. The experience page treats them as having completed the quiz with "owns lamp" and shows the configurator without re-running steps 2–4. Implemented via `ExperienceAuthContext` (open menu + auth from onboarding), `ShopSlideoutMenu` props `openAuthWhenOpened` / `onAuthOpened`, and `ExperienceClient` handling of `fromOnboardingLogin` + `useShopAuthContext().isAuthenticated`.

- **A/B test (onboarding vs skip):** Half of visitors are assigned to see the onboarding flow; half skip straight to the configurator. Assignment is random on first visit, persisted in cookie `sc_experience_ab` (30 days), and recorded in GA4 (`experience_ab_assigned` event + user property `experience_ab_variant`) and in `experience_ab_assignments` for analysis. Compare conversion and engagement by segmenting on `experience_ab_variant`. See [Experience A/B test](#experience-ab-test-onboarding-vs-skip) below.
- **Entry**: Visiting `/shop/experience` without a completed quiz: if A/B variant is **onboarding**, redirect to `/shop/experience/onboarding` (query params such as `artist`, `utm_campaign` are preserved). If variant is **skip**, show configurator with default quiz state (no redirect).
- **Flow**: Steps 1–4 navigate to the next URL; partial answers are stored in `localStorage` (`sc-experience-quiz`). After step 4, the user is sent to `/shop/experience` (configurator).
- **Lamp paywall**: If they answered "I'm new here" (no lamp), the **Add your Street Lamp** paywall is shown inside the configurator (same page). Actions are tracked via GA4: `experience_lamp_paywall_add_to_cart` when they add the lamp, `experience_lamp_paywall_skip` when they skip.
- **Completion**: After step 4, answers are saved to `experience_quiz_signups` (when email is provided).
- **Implementation**: [`app/shop/experience/onboarding/[[...step]]/page.tsx`](../../../app/shop/experience/onboarding/[[...step]]/page.tsx), [`ExperienceOnboardingClient.tsx`](../../../app/shop/experience/components/ExperienceOnboardingClient.tsx), [`IntroQuiz.tsx`](../../../app/shop/experience/components/IntroQuiz.tsx) (URL-driven via `step`, `partialAnswers`, `onNext`, `onBack`).

`QuizAnswers` includes `ownsLamp`, `purpose`, and optional `name` and `email`. Completed quiz is stored in `localStorage` for returning users.

**Checkout prefill**: When the user opens the checkout address modal, `name` and `email` from the quiz are used to pre-fill the address form (via `ExperienceQuizPrefill`). Logged-in user data takes precedence over quiz data when available.

### Experience A/B Test (onboarding vs skip)

Half of visitors see the 4-step onboarding; half skip to the configurator. This allows comparing conversion and engagement between cohorts.

| Variant | Behavior |
|--------|----------|
| `onboarding` | Redirect to `/shop/experience/onboarding` if no completed quiz (current flow). |
| `skip` | Skip onboarding; show configurator with default state (same as `?skipQuiz=1`). |

- **Assignment**: On first visit to `/shop/experience`, client reads cookie `sc_experience_ab`. If missing, assigns 50/50 (`Math.random() < 0.5 ? 'skip' : 'onboarding'`), sets cookie (30 days), fires GA4 event `experience_ab_assigned` and user property `experience_ab_variant`, and calls `POST /api/experience/ab-assignment` with `{ variant }`.
- **Persistence**: Cookie ensures the same visitor always gets the same variant. DB table `experience_ab_assignments` stores each new assignment for server-side reporting (admin-only SELECT).
- **Analysis**: In GA4, create a segment or exploration filtered by user property `experience_ab_variant` = `onboarding` vs `skip` to compare funnel (e.g. add to cart, begin_checkout, purchase). Query `experience_ab_assignments` for raw counts by variant and date.
- **Implementation**: [`ExperienceClient`](../../../app/shop/experience/components/ExperienceClient.tsx) (cookie, assignment, `effectiveSkipQuiz`), [`app/api/experience/ab-assignment/route.ts`](../../../app/api/experience/ab-assignment/route.ts), migration [`20260309200000_experience_ab_assignments.sql`](../../../supabase/migrations/20260309200000_experience_ab_assignments.sql).

### Intro Quiz Signups (Tracking & Marketing)

When the user completes the intro quiz, their responses are persisted so you can track **name**, **gift vs self**, **first time vs have lamp**, and optional email:

- **Table**: `public.experience_quiz_signups`  
  - Columns: `id`, `email` (nullable), `name`, `owns_lamp`, `purpose` (`'self'` \| `'gift'`), `source` (default `'experience'`), `affiliate_artist_slug`, `collector_user_id` (set when user logs in), `stripe_customer_id` (set when user completes checkout), `created_at`.  
  - Migrations: [`20260309000002_experience_quiz_signups.sql`](../../../supabase/migrations/20260309000002_experience_quiz_signups.sql), [`20260309000003_experience_quiz_signups_allow_insert.sql`](../../../supabase/migrations/20260309000003_experience_quiz_signups_allow_insert.sql), [`20260309100000_experience_quiz_signups_customer_id.sql`](../../../supabase/migrations/20260309100000_experience_quiz_signups_customer_id.sql), [`20260310100000_experience_quiz_signups_email_nullable.sql`](../../../supabase/migrations/20260310100000_experience_quiz_signups_email_nullable.sql) (email optional so we can record name + selections even before email is collected).
- **Client**: [`ExperienceOnboardingClient.tsx`](../../../app/(store)/shop/experience/components/ExperienceOnboardingClient.tsx) inserts into `experience_quiz_signups` on **every** quiz completion (fire-and-forget) with `name`, `owns_lamp`, `purpose`, and `email` when provided. This includes “Skip for now” (owns_lamp false, purpose self, name/email null). Admins can query the table (RLS allows `SELECT` for admin role) for exports and marketing.
- **Linking customer ID**: When the user **logs in**, [`ExperienceClient`](../../../app/(store)/shop/experience/components/ExperienceClient.tsx) calls `POST /api/experience/quiz-signup/link` (once per visit). The link API sets `collector_user_id` on any signup row(s) with matching email. When the user **completes checkout**, the Stripe webhook sets `stripe_customer_id` on matching rows by purchaser email.
- **API**: `POST /api/experience/quiz-signup` accepts `email` (optional), `name` (optional), `ownsLamp`, `purpose`; at least one of `email` or `name` is required.

## Collected Artworks (Logged-in Users)

When a user is logged in and has orders, artworks they already own are indicated:

- **Artwork selector**: A "Collected" badge (green, Package icon) appears on artwork cards the user owns.
- **OrderBar**: Artworks in the cart that the user already owns show a small collected icon and "(Collected)" label.
- **Data source**: Product IDs from `order_line_items_v2` (status = active) joined to `orders` by `customer_email`.

API: `GET /api/shop/collected-products` returns `{ productIds: string[] }` for the authenticated user.

## Artist Spotlight Banner

A banner shows the **most recent artist spotlight** — the vendor with the most recently activated product. Fetches from:
1. **Shopify** (primary): Most recently created active product via Storefront API (`CREATED_AT` desc)
2. **Supabase** (fallback): Most recently added member in `artwork_series_members`

When the banner is selected/expanded:

1. **Filter artworks** — Toggle to filter the selector to only spotlight artist's new drop.
2. **New Drop badge** — Artworks in the spotlight series show an amber "New Drop" badge.
3. **Artist info card** — Dropdown shows artist image, bio (from vendors/description), and thumbnails of artworks in the drop.

API: `GET /api/shop/artist-spotlight` returns `{ vendorName, vendorSlug, bio, image, productIds, seriesName, gifUrl?, unlisted? }`.

**Unlisted collections**: Set collection metafield `custom.unlisted` to a truthy value (e.g. `true` or `1`) so the collection is **not** chosen as the default spotlight on the experience page. It remains reachable via direct link: `/shop/experience?artist=<handle>` or `/collections/<handle>`. When `?artist=` is provided, the API returns that collection’s spotlight even if unlisted. When no `?artist=` is given, override, Shopify, and Supabase candidates are skipped if `unlisted` is true. The experience page merges the `initialArtistSlug` collection into the product list when present so unlisted collections’ products appear when opened by link. Implementation: [`app/api/shop/artist-spotlight/route.ts`](../../../app/api/shop/artist-spotlight/route.ts); [`lib/shopify/storefront-client.ts`](../../../lib/shopify/storefront-client.ts) (`unlistedMetafield`); [`app/shop/experience/page.tsx`](../../../app/shop/experience/page.tsx) (merge by `initialArtistSlug`).

**GIF overlay**: When the collection has metafield `custom.gif` set to a URL and the banner is **collapsed**, that GIF image is shown as a small overlay on the card (top-right). The API returns `gifUrl` with the metafield value; vendor and collection spotlight paths both support it. Implementation: [`ArtistSpotlightBanner.tsx`](../../../app/shop/experience/components/ArtistSpotlightBanner.tsx); [`app/api/shop/artist-spotlight/route.ts`](../../../app/api/shop/artist-spotlight/route.ts) and [`lib/shopify/storefront-client.ts`](../../../lib/shopify/storefront-client.ts) (collection fragment `gifMetafield`).

**Unlisted products (early access)**: The Storefront API omits [unlisted products](https://shopify.dev/docs/apps/build/product-merchandising/unlisted-products) from `collection.products`. To show them, the app uses the **Shopify Admin API** to read the collection’s product handles (including unlisted), then fetches each product by handle via Storefront. **Public** Storefront tokens often return `null` for unlisted products even when querying by handle; set **`SHOPIFY_STOREFRONT_PRIVATE_TOKEN`** (a private Storefront API token, server-only) so unlisted products are returned. Optional: set `custom.product_handles` on the collection to override or limit which products are shown. Implementation: [`lib/shopify/admin-collection-products.ts`](../../../lib/shopify/admin-collection-products.ts); [`lib/shopify/storefront-client.ts`](../../../lib/shopify/storefront-client.ts) (`getProductsByHandles` private-token fallback); experience page and artist-spotlight API call it when Storefront returns 0 products for a collection. **Online Store only in default experience:** Products not active on the Online Store channel (e.g. COA app channel only) are excluded from the normal experience; the default spotlight and product list use only Storefront (Online Store). Admin/COA fallback runs only for `?artist=<handle>` early-access links, so artists with no Online Store products do not appear as the default spotlight.

## Scarcity Counter (2026-03-19)

The scarcity bar on artwork detail shows remaining inventory as a percentage of edition size.

- **Data source**: `quantityAvailable` from Storefront API (full product) or fallback to `GET /api/shop/products/by-id/[id]/quantity`.
- **Quantity API**: Sums inventory across all variants (not just first variant). If `inventory_quantity` is deprecated/missing on variants, falls back to Inventory Levels API.
- **Display**: Bar width = `min(100, (available / editionSize) * 100)`; capped at 100% when data is inconsistent.
- **Implementation**: [`ScarcityBadge.tsx`](../../../app/(store)/shop/experience-v2/components/ScarcityBadge.tsx), [`quantity/route.ts`](../../../app/api/shop/products/by-id/[id]/quantity/route.ts).

## API Endpoints (Products)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/shop/products/[handle]` | Full product for ArtworkDetail (on-demand) |
| `GET /api/shop/products/by-id/[id]/quantity` | Inventory quantity for scarcity bar (Admin API + Inventory Levels fallback) |
| `GET /api/shop/artists/[slug]` | Artist bio/filter when arriving from `?artist=` link |
| `GET /api/shop/collected-products` | Product IDs user owns (for Collected badge) |
| `GET /api/shop/artist-spotlight` | Most recent vendor new drop (for spotlight banner) |
| `GET /api/shop/experience/collection-products` | Paginated products for configurator (load-more) |

## Data Flow

- **Initial load**: Lamp (`getProduct`), Season 1 & 2 collections (`getCollectionWithListProducts`) in parallel.
- **Detail drawer**: When user opens artwork detail, full product fetched via `/api/shop/products/[handle]` and cached in memory.
- **Collected IDs**: Fetched when authenticated; used for Collected badge in ArtworkStrip and OrderBar.
- **Artist spotlight**: Fetched on mount; used for banner, filter, and New Drop badge.

## Version

- Last updated: 2026-03-19
- Version: 1.14.0

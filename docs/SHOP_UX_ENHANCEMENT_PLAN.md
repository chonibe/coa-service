# Shop UX Enhancement Implementation Plan

**Created:** 2026-02-04  
**Status:** Approved - Ready for Implementation  
**Estimated Phases:** 10  
**Scope:** Comprehensive shop UX improvements with real data integration

---

## Requirements

1. **No Fake Data**: Remove all simulated metrics (viewer counters, etc.)
2. **Real Edition Data**: Show "Next available: #X of Y" using actual `line_items` data
3. **GSAP Animations**: Use existing animation system for all transitions
4. **Mobile-First**: Prioritize mobile experience and gestures
5. **Accessibility**: Keyboard navigation, screen readers, reduced motion support

---

## Architecture Overview

### Data Flow for Edition Availability

```
Shopify Product → /api/shop/products/[handle] → getEditionAvailability()
                                                         ↓
                                                  Query line_items table
                                                  (product_id, edition_number)
                                                         ↓
                                              Calculate: MAX(edition_number) + 1
                                                         ↓
                                              Return: {total, sold, nextAvailable}
                                                         ↓
                                              Display: "Next available: #13 of 50"
```

### Component Structure

```
components/
├── impact/
│   ├── LocalCartDrawer.tsx (enhanced with animations & upsells)
│   └── SearchDrawer.tsx (enhanced with filters)
├── shop/
│   ├── ProductLightbox.tsx (NEW - gallery lightbox)
│   ├── FilterPanel.tsx (NEW - advanced filtering)
│   ├── TrustBadges.tsx (NEW - real trust indicators)
│   ├── BottomNav.tsx (NEW - mobile navigation)
│   └── UrgencyIndicators.tsx (MODIFIED - remove fake data)
└── animations/
    └── PageTransition.tsx (NEW - route transitions)
```

---

## Phase 1: Cart Drawer Enhancements

**Priority:** High  
**Estimated Complexity:** Medium

### Files Modified
- [`components/impact/LocalCartDrawer.tsx`](components/impact/LocalCartDrawer.tsx)

### Implementation Tasks

1. **Add GSAP Item Animations**
   - Slide-in animation when item added (from right, with spring easing)
   - Slide-out animation when item removed (to right, fade out)
   - Stagger delay for multiple items (50ms between each)

2. **Upsell Section**
   - "Complete your collection" heading
   - Show 2-3 related products from same collection/artist
   - Quick add button for each suggestion
   - Fetch related products from current cart items

3. **Gift Wrapping Option**
   - Checkbox with label "Add gift wrapping (+$5.00)"
   - Store in cart context as `giftWrapping: boolean`
   - Include in checkout flow

4. **Order Notes**
   - Textarea with placeholder "Special instructions for your order"
   - Character counter (max 500 characters)
   - Store in cart context `orderNotes: string`

5. **Enhanced Quantity Stepper**
   - Add scale animation on button press (0.95 scale)
   - Add number change animation (fade/slide transition)
   - Haptic-like visual feedback with GSAP

### Success Criteria
- [ ] Items slide in/out smoothly with GSAP
- [ ] Upsell shows relevant products
- [ ] Gift wrapping persists in cart state
- [ ] Order notes save to localStorage
- [ ] Quantity stepper has satisfying feedback

---

## Phase 2: Product Gallery Lightbox

**Priority:** High  
**Estimated Complexity:** High

### New Files
- `components/shop/ProductLightbox.tsx`

### Files Modified
- [`app/shop/[handle]/components/ProductGallery.tsx`](app/shop/[handle]/components/ProductGallery.tsx)

### Implementation Tasks

1. **Create ProductLightbox Component**
   - Full-screen overlay with backdrop blur (blur(40px))
   - Close button (top-right)
   - Image counter (e.g., "3 / 8")
   - Keyboard navigation support

2. **Zoom & Pan Functionality**
   - Use GSAP Draggable for pan gestures
   - Pinch-to-zoom on mobile (scale 1x to 3x)
   - Double-tap to toggle zoom
   - Reset zoom when changing images

3. **Navigation**
   - Previous/Next arrows (absolute positioned)
   - Swipe gestures for mobile (left/right)
   - Keyboard arrows (ArrowLeft, ArrowRight)
   - Thumbnail filmstrip at bottom with smooth scroll

4. **Video Support**
   - Detect video URLs in image array
   - Render video player with controls
   - Auto-pause when switching away

5. **Accessibility**
   - Focus trap when open
   - Escape key to close
   - ARIA labels for all interactive elements
   - Screen reader announcements

### Success Criteria
- [ ] Lightbox opens smoothly with GSAP animation
- [ ] Zoom and pan work on desktop and mobile
- [ ] Swipe navigation feels natural
- [ ] Videos play correctly in gallery
- [ ] Keyboard navigation works perfectly
- [ ] Focus trap prevents tabbing outside

---

## Phase 3: Advanced Filtering UI

**Priority:** High  
**Estimated Complexity:** Medium

### New Files
- `components/shop/FilterPanel.tsx`

### Files Modified
- [`app/shop/products/page.tsx`](app/shop/products/page.tsx)
- [`app/shop/components/ShopFilters.tsx`](app/shop/components/ShopFilters.tsx)

### Implementation Tasks

1. **Create FilterPanel Component**
   - Slide-out panel from left side
   - GSAP animation (translateX from -100% to 0)
   - Backdrop with blur and dark overlay
   - Close button and "Apply Filters" button

2. **Price Range Slider**
   - Dual-handle range slider component
   - Min and Max price inputs
   - Update URL params on change
   - Show current range as text

3. **Multi-Select Filters**
   - Artist checkboxes (fetch from collections)
   - Collection checkboxes
   - Edition type (Limited, Open, etc.)
   - Availability (In Stock, Sold Out)

4. **Active Filter Tags**
   - Display active filters as pills/tags
   - X button to remove individual filter
   - "Clear all" button
   - Filter count badge on toggle button

5. **Layout Options**
   - Toggle between grid (2/3/4 columns) and list view
   - Persist preference in localStorage
   - Smooth transition between layouts

### Success Criteria
- [ ] Filter panel slides in/out smoothly
- [ ] Price range slider updates results
- [ ] Multi-select filters work correctly
- [ ] Active tags can be removed
- [ ] Layout toggle persists
- [ ] URL params update for shareable links

---

## Phase 4: Enhanced Edition Info (Real Data)

**Priority:** Critical  
**Estimated Complexity:** High

### New Files
- `app/api/shop/edition-availability/[productId]/route.ts`

### Files Modified
- [`app/shop/[handle]/components/EditionInfo.tsx`](app/shop/[handle]/components/EditionInfo.tsx)
- [`lib/shop/series.ts`](lib/shop/series.ts)
- [`app/api/shop/products/[handle]/route.ts`](app/api/shop/products/[handle]/route.ts)

### Implementation Tasks

1. **Create getEditionAvailability() Function**
   ```typescript
   // lib/shop/series.ts
   export async function getEditionAvailability(
     shopifyProductId: string
   ): Promise<{
     total: number
     sold: number
     nextAvailable: number
     soldNumbers: number[]
   }> {
     const supabase = await createClient()
     const numericId = extractNumericId(shopifyProductId)
     
     // Get edition_size from product submission
     const { data: submission } = await supabase
       .from('vendor_product_submissions')
       .select('product_data')
       .eq('product_data->>shopify_product_id', numericId)
       .single()
     
     const editionSize = submission?.product_data?.edition_size || 0
     
     // Query line_items for sold edition numbers
     const { data: lineItems } = await supabase
       .from('line_items')
       .select('edition_number')
       .eq('product_id', numericId)
       .eq('status', 'active')
       .not('edition_number', 'is', null)
       .order('edition_number', { ascending: true })
     
     const soldNumbers = lineItems?.map(li => li.edition_number).filter(Boolean) || []
     const sold = soldNumbers.length
     const nextAvailable = soldNumbers.length > 0 
       ? Math.max(...soldNumbers) + 1 
       : 1
     
     return {
       total: editionSize,
       sold,
       nextAvailable,
       soldNumbers
     }
   }
   ```

2. **Create API Endpoint**
   ```typescript
   // app/api/shop/edition-availability/[productId]/route.ts
   export async function GET(
     request: Request,
     context: { params: Promise<{ productId: string }> }
   ) {
     const { productId } = await context.params
     const availability = await getEditionAvailability(productId)
     return NextResponse.json(availability)
   }
   ```

3. **Update Product API**
   - Add `editionAvailability` to product response
   - Call `getEditionAvailability()` alongside existing edition info

4. **Update EditionInfo Component**
   ```tsx
   // Display format:
   // "Next available: #13 of 50"
   // With progress bar showing 12/50 sold (24%)
   
   {editionAvailability && (
     <div className="space-y-2">
       <p className="text-sm font-medium">
         Next available: <span className="text-[#2c4bce]">#{editionAvailability.nextAvailable}</span> of {editionAvailability.total}
       </p>
       <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
         <div 
           className="h-full bg-[#2c4bce] transition-all"
           style={{ width: `${(editionAvailability.sold / editionAvailability.total) * 100}%` }}
         />
       </div>
       <p className="text-xs text-gray-600">
         {editionAvailability.sold} sold • {editionAvailability.total - editionAvailability.sold} available
       </p>
     </div>
   )}
   ```

### Success Criteria
- [ ] Query returns accurate sold count from line_items
- [ ] nextAvailable calculation is correct
- [ ] Product page displays "Next available: #X of Y"
- [ ] Progress bar shows correct percentage
- [ ] Works for all products with edition data
- [ ] Handles edge cases (0 sold, all sold, etc.)

---

## Phase 5: Enhanced Search

**Priority:** Medium  
**Estimated Complexity:** Medium

### Files Modified
- [`components/impact/SearchDrawer.tsx`](components/impact/SearchDrawer.tsx)

### Implementation Tasks

1. **Trending Searches Section**
   - Static list or fetch from analytics
   - Display when search input is empty
   - Clickable pills that populate search

2. **Filter Pills**
   - Price range filter (Under $50, $50-$100, etc.)
   - Artist filter dropdown
   - Collection filter dropdown
   - Combine with search query

3. **Improved Keyboard Navigation**
   - Arrow keys to navigate results
   - Enter to select result
   - Tab through filter pills
   - Escape to clear and close

4. **Search History Management**
   - Improve storage (keep last 10 searches)
   - Delete individual searches
   - Clear all history

### Success Criteria
- [ ] Trending searches display correctly
- [ ] Filter pills combine with search
- [ ] Keyboard navigation works smoothly
- [ ] Search history is manageable

---

## Phase 6: Page Transitions

**Priority:** Medium  
**Estimated Complexity:** Medium

### New Files
- `components/animations/PageTransition.tsx`

### Files Modified
- [`lib/animations/gsap-hooks.ts`](lib/animations/gsap-hooks.ts)
- [`app/shop/layout.tsx`](app/shop/layout.tsx)

### Implementation Tasks

1. **Create PageTransition Component**
   - Fade out current page
   - Fade in new page
   - Use GSAP Timeline for orchestration

2. **GSAP Flip Integration**
   - Shared element transitions (product image to detail)
   - Use GSAP Flip plugin for layout animations

3. **Route Change Detection**
   - Listen to Next.js router events
   - Trigger transition on route change

### Success Criteria
- [ ] Pages fade smoothly on navigation
- [ ] No flash of unstyled content
- [ ] Transitions feel polished

---

## Phase 7: Mobile Bottom Navigation

**Priority:** Medium  
**Estimated Complexity:** Low

### New Files
- `components/shop/BottomNav.tsx`

### Files Modified
- [`app/shop/layout.tsx`](app/shop/layout.tsx)

### Implementation Tasks

1. **Create BottomNav Component**
   - Fixed bottom bar (mobile only, hidden on desktop)
   - Home, Search, Cart, Account icons
   - Active state indication
   - Cart badge with item count

2. **Scroll Behavior**
   - Hide on scroll down
   - Show on scroll up
   - Use scroll position detection

3. **Integration**
   - Add to shop layout
   - Ensure it doesn't overlap content
   - Safe area padding for iOS

### Success Criteria
- [ ] Bottom nav visible only on mobile
- [ ] Hides/shows based on scroll direction
- [ ] Cart badge shows correct count
- [ ] Safe area padding works on iOS

---

## Phase 8: Trust Badges & Real Stock Indicators

**Priority:** High  
**Estimated Complexity:** Low

### New Files
- `components/shop/TrustBadges.tsx`

### Files Modified
- [`components/shop/UrgencyIndicators.tsx`](components/shop/UrgencyIndicators.tsx)
- [`components/shop/VinylProductCard.tsx`](components/shop/VinylProductCard.tsx)

### Implementation Tasks

1. **Remove Fake Data**
   - Delete `ViewersCounter` component entirely
   - Remove any simulated/random data

2. **Create TrustBadges Component**
   - Free shipping badge
   - Secure checkout badge
   - Authenticity guaranteed badge
   - Static, non-animated

3. **Real Shipping Countdown**
   - Calculate based on current time and shipping cutoff
   - "Order in 2h 15m for Friday delivery"
   - Use actual shipping rules

4. **Update Stock Indicators**
   - Only show stock from real Shopify inventory
   - Remove any fabricated urgency

### Success Criteria
- [ ] ViewersCounter removed completely
- [ ] Trust badges display correctly
- [ ] Shipping countdown calculates accurately
- [ ] No fake data anywhere in shop

---

## Phase 9: Component Library Enhancements

**Priority:** Low  
**Estimated Complexity:** Low

### Files Modified
- [`components/impact/Button.tsx`](components/impact/Button.tsx)
- [`components/vinyl/VinylArtworkCard.tsx`](components/vinyl/VinylArtworkCard.tsx)
- [`lib/animations/gsap-hooks-enhanced.ts`](lib/animations/gsap-hooks-enhanced.ts)

### Implementation Tasks

1. **Magnetic Hover Effect**
   - Button follows cursor on hover
   - Use existing `useMagneticHover` hook
   - Subtle movement (max 10px offset)

2. **Loading Shimmer States**
   - Shimmer animation for loading buttons
   - Gradient sweep effect

3. **Card Glow Effect**
   - Enhance existing hover glow on vinyl cards
   - Smooth transition in/out

4. **Ripple Effect**
   - Click ripple on buttons
   - Expand from click point

### Success Criteria
- [ ] Magnetic hover feels natural
- [ ] Loading states are visible
- [ ] Card glow enhances interaction
- [ ] Ripple effect works on all buttons

---

## Phase 10: Accessibility Improvements

**Priority:** High  
**Estimated Complexity:** Medium

### Files Modified
- Multiple component files across shop

### Implementation Tasks

1. **Focus Trap**
   - Implement in cart drawer, search drawer, lightbox
   - Tab key cycles within modal
   - Shift+Tab works in reverse

2. **Keyboard Navigation**
   - Carousels navigable with arrows
   - All interactive elements reachable via Tab
   - Enter/Space activate buttons

3. **Reduced Motion Support**
   - Detect `prefers-reduced-motion` media query
   - Disable GSAP animations when enabled
   - Use instant transitions instead

4. **ARIA Labels**
   - Add to all custom components
   - Ensure screen readers understand interactions

5. **Skip to Content**
   - Add skip link at top of page
   - Jumps to main content area

6. **Screen Reader Announcements**
   - Announce cart updates ("Item added to cart")
   - Use ARIA live regions

### Success Criteria
- [ ] Focus trap works in all modals
- [ ] Keyboard-only navigation possible
- [ ] Reduced motion respected
- [ ] Screen readers announce updates
- [ ] Skip link works correctly

---

## Testing Checklist

### Desktop Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Testing
- [ ] iOS Safari (iPhone)
- [ ] Chrome (Android)
- [ ] Samsung Internet (Android)

### Accessibility Testing
- [ ] Keyboard-only navigation
- [ ] Screen reader (NVDA/JAWS)
- [ ] Reduced motion preference
- [ ] Color contrast (WCAG AA)

### Performance Testing
- [ ] Lighthouse score > 90
- [ ] No animation jank (60fps)
- [ ] Fast page transitions

---

## Documentation Requirements

After each phase completion:
1. Update component README files
2. Add JSDoc comments to new functions
3. Document new API endpoints
4. Update main README with features
5. Create commit log in `docs/COMMIT_LOGS/`

---

## Rollout Strategy

1. **Phases 1-4**: Core improvements (cart, gallery, filters, editions)
2. **Phases 5-7**: Enhanced interactions (search, transitions, mobile nav)
3. **Phases 8-10**: Polish (trust badges, component enhancements, a11y)

Each phase will be committed separately with comprehensive testing before moving to the next.

---

## Success Metrics

- Cart conversion rate improvement
- Reduced bounce rate on product pages
- Increased average session duration
- Improved mobile engagement
- Better accessibility scores
- Positive user feedback on interactions

---

**Plan Approved:** 2026-02-04  
**Implementation Start:** Immediately after approval  
**Estimated Completion:** All 10 phases in current session

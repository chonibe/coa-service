# Shop UI/UX Enhancement - Vinyl Record Artwork Interactions with GSAP

## Date: 2026-02-03

## Summary

Implemented a comprehensive vinyl record-inspired interaction system for the shop and collector experiences. This transforms the artwork browsing experience to feel like flipping through a crate of vinyl records at a record store.

## Changes Made

### 1. GSAP Animation Infrastructure (`lib/animations/`)

Created a complete GSAP animation system with:

- **`gsap-config.ts`**: Central configuration with plugin registration (ScrollTrigger, Flip, Draggable, Observer), custom eases, duration constants, and reduced motion support
- **`gsap-hooks.ts`**: React hooks including:
  - `use3DTilt`: Mouse-follow 3D tilt effect using `gsap.quickTo()` for 60fps performance
  - `useFlip`: GSAP Flip animations for state-to-state transitions
  - `useDraggable`: Drag interactions with momentum and snap
  - `useScrollTrigger`: Scroll-based animations
  - `useObserver`: Unified touch/mouse/scroll handling
  - `useCardFlip`: Vinyl card flip animation (front/back)
- **`gsap-utils.ts`**: Animation factory functions:
  - `fadeInUp`, `fadeInScale`, `staggerChildren`
  - `createParallax`, `createDrawerTimeline`
  - `badgePop`, `shake`, `pulse`, `glowPulse`
  - `createScrollReveal`
- **`framer-variants.ts`**: Standardized Framer Motion variants for component animations
- **`useScrollHeader.ts`**: Scroll-aware header effects (progressive blur, logo scale, hide/show)
- **`index.ts`**: Central exports

### 2. Vinyl Component System (`components/vinyl/`)

Created a complete vinyl record-inspired component system:

- **`VinylArtworkCard.tsx`**: Main card with 3D tilt and flip interaction
- **`VinylCardFront.tsx`**: Front face with artwork image and badges
- **`VinylCardBack.tsx`**: B-side with artist notes, edition details
- **`VinylTiltEffect.tsx`**: Reusable 3D tilt wrapper component
- **`VinylCrateBrowser.tsx`**: Horizontal crate browsing with drag/swipe
- **`VinylCrateStack.tsx`**: Stacked card visualization
- **`VinylTurntableViewer.tsx`**: Full-screen immersive detail view
- **`VinylDropZone.tsx`**: Drag target for turntable viewer
- **`useVinylCard.ts`**: Hook for card state and animations
- **`useVinylCrate.ts`**: Hook for crate navigation logic
- **`index.ts`**: Component exports

### 3. Shop Integration (`app/shop/`, `components/shop/`)

- **Updated `ProductCardItem.tsx`**: Now uses `VinylArtworkCard` with 3D tilt and flip effects
- **Created `VinylProductCard.tsx`**: Shop-specific wrapper with Shopify product data
- **Created `AddToCartToast.tsx`**: GSAP-powered toast with vinyl card preview

### 4. Collector Dashboard Enhancement

- **Updated `PremiumArtworkStack.tsx`**: Added GSAP-powered 3D tilt, improved stack animations with spring physics

### 5. Scroll Animations (`components/blocks/`)

- **Created `ScrollReveal.tsx`**: ScrollTrigger-powered reveal animations including:
  - `ScrollReveal`: Reveal children on viewport entry
  - `ParallaxLayer`: Parallax effect wrapper
  - `ScrollProgress`: Scroll progress indicator

### 6. Cart Drawer Improvements

- **Updated `CartDrawer.tsx`**: GSAP timeline for orchestrated animations (backdrop fade → drawer slide → items stagger)

## New Dependencies

```json
{
  "gsap": "^3.12.5",
  "@gsap/react": "^2.1.0"
}
```

## Files Created

### Animation Infrastructure
- `lib/animations/gsap-config.ts`
- `lib/animations/gsap-hooks.ts`
- `lib/animations/gsap-utils.ts`
- `lib/animations/framer-variants.ts`
- `lib/animations/useScrollHeader.ts`
- `lib/animations/index.ts`

### Vinyl Components
- `components/vinyl/VinylArtworkCard.tsx`
- `components/vinyl/VinylCardFront.tsx`
- `components/vinyl/VinylCardBack.tsx`
- `components/vinyl/VinylTiltEffect.tsx`
- `components/vinyl/VinylCrateBrowser.tsx`
- `components/vinyl/VinylCrateStack.tsx`
- `components/vinyl/VinylTurntableViewer.tsx`
- `components/vinyl/VinylDropZone.tsx`
- `components/vinyl/useVinylCard.ts`
- `components/vinyl/useVinylCrate.ts`
- `components/vinyl/index.ts`

### Shop Components
- `components/shop/VinylProductCard.tsx`
- `components/shop/AddToCartToast.tsx`
- `components/shop/index.ts`

### Block Components
- `components/blocks/ScrollReveal.tsx`

## Files Modified

- `package.json` (added gsap, @gsap/react)
- `app/shop/components/ProductCardItem.tsx`
- `app/collector/dashboard/components/premium/PremiumArtworkStack.tsx`
- `components/impact/CartDrawer.tsx`
- `components/blocks/index.ts`

## Usage Examples

### VinylArtworkCard

```tsx
import { VinylArtworkCard } from '@/components/vinyl'

<VinylArtworkCard
  title="Mountain Sunset"
  price="$299"
  image="/artwork.jpg"
  artistName="Jane Doe"
  artistNotes="This piece captures the fleeting beauty of sunset..."
  editionNumber={12}
  editionTotal={50}
  href="/shop/mountain-sunset"
  onQuickAdd={() => addToCart()}
/>
```

### VinylCrateBrowser

```tsx
import { VinylCrateBrowser, VinylArtworkCard } from '@/components/vinyl'

<VinylCrateBrowser
  items={artworks}
  title="Your Collection"
  showArrows
  renderItem={(item, index, isActive) => (
    <VinylArtworkCard {...item} />
  )}
/>
```

### ScrollReveal

```tsx
import { ScrollReveal } from '@/components/blocks'

<ScrollReveal animation="fadeUp" staggerAmount={0.1}>
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</ScrollReveal>
```

### GSAP Hooks

```tsx
import { use3DTilt, useCardFlip } from '@/lib/animations'

// 3D Tilt Effect
const tiltRef = use3DTilt({ maxTilt: 15, scale: 1.02 })
<div ref={tiltRef}>...</div>

// Card Flip
const { ref, isFlipped, flip } = useCardFlip()
<div ref={ref} onClick={flip}>...</div>
```

## Performance Considerations

- All tilt animations use `gsap.quickTo()` for batched RAF updates
- ScrollTrigger uses native scroll events, not polling
- Flip plugin calculates layout once, animates with transforms only
- `will-change-transform` applied to animated elements
- Reduced motion preference respected via `matchMedia`

## Testing Notes

- Verify 3D tilt works on desktop with mouse
- Test drag/swipe on mobile devices
- Confirm reduced motion is respected
- Check flip animation reveals B-side content
- Verify cart drawer GSAP timeline

## Related Documentation

- [GSAP ScrollTrigger](https://greensock.com/scrolltrigger/)
- [GSAP Flip Plugin](https://greensock.com/flip/)
- [GSAP Draggable](https://greensock.com/draggable/)
- [Framer Motion](https://www.framer.com/motion/)

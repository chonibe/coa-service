# Vinyl Components

A collection of components for vinyl record-inspired artwork interactions.

## Overview

Transform the artwork browsing experience to feel like flipping through a crate of vinyl records at a record store:

- **3D Tilt**: Artworks tilt and follow mouse movement like holding a physical record
- **Flip to Reveal**: Click to flip artwork and see the "B-side" (artist notes, edition details)
- **Crate Browsing**: Flip through stacked artworks like browsing a record crate
- **Turntable Viewer**: Immersive full-screen detail view

## Components

### VinylArtworkCard

The main component - a product/artwork card with vinyl record-inspired interactions.

```tsx
import { VinylArtworkCard } from '@/components/vinyl'

<VinylArtworkCard
  title="Mountain Sunset"
  price="$299"
  compareAtPrice="$399"
  image="/artwork.jpg"
  secondImage="/artwork-detail.jpg"
  artistName="Jane Doe"
  artistNotes="This piece captures the fleeting beauty..."
  editionNumber={12}
  editionTotal={50}
  editionType="Limited Edition"
  href="/shop/mountain-sunset"
  badges={<Badge>New</Badge>}
  showQuickAdd
  onQuickAdd={() => addToCart()}
  variant="shop" // or "collector"
/>
```

### VinylCrateBrowser

Browse artworks like flipping through a record crate with drag/swipe.

```tsx
import { VinylCrateBrowser, VinylArtworkCard } from '@/components/vinyl'

<VinylCrateBrowser
  items={artworks}
  title="Your Collection"
  subtitle="12 pieces"
  showArrows
  showDots
  showProgressBar
  cardWidth={280}
  gap={20}
  onIndexChange={(index) => console.log('Active:', index)}
  renderItem={(item, index, isActive) => (
    <VinylArtworkCard {...item} />
  )}
/>
```

### VinylCrateStack

Display multiple items as a visual stack (for grouped artworks).

```tsx
import { VinylCrateStack } from '@/components/vinyl'

<VinylCrateStack
  items={editions}
  maxStackPreview={3}
  onExpand={(items) => openModal(items)}
  renderItem={(item, index) => <ArtworkCard {...item} />}
/>
```

### VinylTurntableViewer

Full-screen immersive viewing mode.

```tsx
import { VinylTurntableViewer } from '@/components/vinyl'

<VinylTurntableViewer
  isOpen={isViewerOpen}
  onClose={() => setViewerOpen(false)}
  image="/artwork-large.jpg"
  title="Mountain Sunset"
  artistName="Jane Doe"
  artistNotes="This piece captures..."
  price="$299"
  editionNumber={12}
  editionTotal={50}
  href="/shop/mountain-sunset"
  onAddToCart={() => addToCart()}
/>
```

### VinylTiltEffect

A wrapper that adds 3D tilt to any content.

```tsx
import { VinylTiltEffect } from '@/components/vinyl'

<VinylTiltEffect maxTilt={15} scale={1.02} perspective={1000}>
  <div className="card">Any content here</div>
</VinylTiltEffect>
```

## Hooks

### useVinylCard

Manages state and animations for a card.

```tsx
import { useVinylCard } from '@/components/vinyl'

const {
  cardRef,
  isFlipped,
  isHovered,
  flip,
  setFlipped,
  handleMouseEnter,
  handleMouseLeave,
  handleClick,
} = useVinylCard({
  defaultFlipped: false,
  tiltEnabled: true,
  maxTilt: 15,
  flipDuration: 0.6,
  onFlip: (isFlipped) => console.log('Flipped:', isFlipped),
})
```

### useVinylCrate

Manages navigation for crate browsing.

```tsx
import { useVinylCrate } from '@/components/vinyl'

const {
  crateRef,
  wrapperRef,
  activeIndex,
  goTo,
  next,
  prev,
  isAnimating,
  isAtStart,
  isAtEnd,
  progress,
} = useVinylCrate({
  itemCount: items.length,
  defaultIndex: 0,
  infinite: false,
  cardWidth: 280,
  gap: 20,
  draggable: true,
})
```

## Animation Details

### 3D Tilt Effect

Uses GSAP's `quickTo()` for buttery smooth 60fps mouse-follow:

```ts
// Creates batched RAF updates
quickTiltX = gsap.quickTo(element, 'rotateY', { duration: 0.5, ease: 'power2.out' })
quickTiltY = gsap.quickTo(element, 'rotateX', { duration: 0.5, ease: 'power2.out' })

// On mouse move
quickTiltX(offsetX * maxTilt)
quickTiltY(-offsetY * maxTilt)
```

### Card Flip

Uses GSAP timeline with proper backface-visibility:

```ts
gsap.to(card, {
  rotateY: isFlipped ? 180 : 0,
  duration: 0.6,
  ease: 'power1.inOut',
})
```

### Crate Momentum

Uses GSAP Draggable with inertia:

```ts
Draggable.create(wrapper, {
  type: 'x',
  inertia: true,
  snap: (value) => Math.round(-value / cardWidth) * cardWidth,
  throwResistance: 500,
})
```

## Accessibility

- All components support keyboard navigation
- Proper ARIA roles and labels
- Respects `prefers-reduced-motion`
- Focus management for modals

## Performance Tips

1. Use `will-change-transform` on animated elements
2. Avoid animating layout properties (width, height)
3. Use `gsap.quickTo()` for mouse-follow effects
4. Clean up GSAP contexts in useEffect returns

## Related

- [GSAP Documentation](https://greensock.com/docs/)
- [lib/animations/](../../lib/animations/) - Animation utilities
- [components/blocks/ScrollReveal](../blocks/ScrollReveal.tsx) - Scroll animations

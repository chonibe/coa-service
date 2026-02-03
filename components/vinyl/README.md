# Vinyl Record Artwork Interactions

Transform artwork browsing into an engaging experience that feels like flipping through a crate of vinyl records at a record store.

## Overview

The vinyl component system provides a collection of React components and hooks for creating immersive artwork interactions with GSAP animations. All components are built for performance, accessibility, and smooth 60fps animations.

## Key Features

### 1. **3D Tilt Effect** (VinylTiltEffect)
- Mouse enters → card lifts with subtle 3D perspective
- Mouse moves → card tilts following cursor using `gsap.quickTo()`
- Smooth depth effects with shadow shifts
- Mouse leaves → card settles back with spring ease
- Buttery smooth 60fps performance

**Usage:**
```tsx
<VinylTiltEffect maxTilt={15} scale={1.02}>
  <div className="artwork-card">
    {/* Your content */}
  </div>
</VinylTiltEffect>
```

### 2. **Flip to Reveal** (VinylArtworkCard)
- Click/tap to flip card 180° on Y-axis
- Front shows artwork image
- Back shows artist notes and edition details
- Smooth animation at 90° midpoint
- Works on mobile and desktop

**Usage:**
```tsx
<VinylArtworkCard
  title="Artwork Title"
  image="/artwork.jpg"
  artistName="Artist Name"
  artistNotes="Artist statement or edition details"
  href="/shop/product-handle"
  enableFlip={true}
  enableTilt={true}
/>
```

### 3. **Crate Browser** (VinylCrateBrowser)
- Stack of artworks like records in a crate
- Drag left/right to flip through
- Momentum physics for momentum scrolling
- Snaps to nearest card
- Peek preview of next/previous cards

**Usage:**
```tsx
<VinylCrateBrowser
  items={artworks}
  enableMomentum={true}
  snapPower={0.8}
  onSelectItem={(item) => console.log(item)}
/>
```

### 4. **Turntable Viewer** (VinylTurntableViewer)
- Dedicated viewing area for focused inspection
- Drag artwork onto turntable
- Smooth GSAP Flip transitions
- Expanded detail view with all information
- Drag off to return to original position

**Usage:**
```tsx
<VinylTurntableViewer
  artworks={collection}
  onSelect={(artwork) => handleSelect(artwork)}
  allowDragAndDrop={true}
/>
```

## Components Reference

### VinylArtworkCard
Main card component with 3D tilt and flip interactions.

**Props:**
```tsx
interface VinylArtworkCardProps {
  title: string
  price?: string
  compareAtPrice?: string
  image: string
  secondImage?: string
  imageAlt: string
  href?: string
  artistName?: string
  artistNotes?: string
  badges?: React.ReactNode
  available?: boolean
  showQuickAdd?: boolean
  onQuickAdd?: () => void
  quickAddLoading?: boolean
  disableFlip?: boolean
  disableTilt?: boolean
  variant?: 'shop' | 'collector' | 'artist'
}
```

### VinylTiltEffect
Standalone 3D tilt container.

**Props:**
```tsx
interface VinylTiltEffectProps {
  children: React.ReactNode
  maxTilt?: number          // Default: 15 degrees
  scale?: number            // Default: 1.02
  perspective?: number      // Default: 1000
  transition?: number       // Default: 0.4 seconds
  disabled?: boolean
}
```

### VinylCrateBrowser
Crate-style stack browser.

**Props:**
```tsx
interface VinylCrateBrowserProps {
  items: any[]
  renderItem?: (item: any) => React.ReactNode
  enableMomentum?: boolean
  snapPower?: number
  maxVisibleCards?: number
  spacing?: number
  onSelectItem?: (item: any) => void
}
```

### VinylCrateStack
Individual stacked card display.

**Props:**
```tsx
interface VinylCrateStackProps {
  items: any[]
  activeIndex?: number
  onIndexChange?: (index: number) => void
  spacing?: number
  rotation?: number
}
```

## Hooks

### useVinylCard
Manage card state and flip animations.

```tsx
const { isFlipped, toggleFlip, rotation } = useVinylCard({
  initialFlipped: false,
})
```

### useVinylCrate
Handle crate navigation and momentum.

```tsx
const { activeIndex, next, prev, momentum, setActive } = useVinylCrate({
  items: artworks,
  snapPower: 0.8,
})
```

### useVinylTurntable
Manage turntable viewer state.

```tsx
const { selectedArtwork, isDragging, dropZoneRef } = useVinylTurntable({
  onSelect: (artwork) => console.log(artwork),
})
```

## Animation Timing

All vinyl components use GSAP with optimized timing:

| Animation | Duration | Easing | Notes |
|-----------|----------|--------|-------|
| 3D Tilt | 0.4s | power2.out | Mouse-follow batched RAF |
| Card Flip | 0.6s | power2.inOut | 90° midpoint crossfade |
| Stack Flip | 0.5s | backOut | Momentum-based momentum |
| Turntable Drop | 0.8s | elastic.out | Bounce effect |

## Performance Considerations

### Optimizations
- ✅ GPU-accelerated transforms (translate3d, rotate, scale)
- ✅ `gsap.quickTo()` batches RAF updates for 60fps
- ✅ ScrollTrigger uses RAF, not scroll events
- ✅ CSS `will-change` on animated elements
- ✅ Reduced motion respected via `prefers-reduced-motion`

### Best Practices
1. **Limit active animations**: Don't animate more than 10-15 cards simultaneously
2. **Use lazy loading**: Load images progressively for crate browsers
3. **Mobile optimization**: Disable tilt on screens < 768px
4. **Test on devices**: Verify 60fps on target devices
5. **Monitor memory**: Large crate browsers need pagination

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| 3D Transforms | ✅ | ✅ | ✅ | ✅ |
| Draggable | ✅ | ✅ | ✅ | ✅ |
| Touch Events | ✅ | ✅ | ✅ | ✅ |
| GSAP Plugins | ✅ | ✅ | ✅ | ✅ |

## Integration Examples

### Shop Product Grid
```tsx
import { ScrollReveal } from '@/components/blocks'
import { VinylArtworkCard } from '@/components/vinyl'

export function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {products.map((product, index) => (
        <ScrollReveal key={product.id} animation="fadeUp" delay={index * 0.05}>
          <VinylArtworkCard
            title={product.title}
            image={product.image}
            price={product.price}
            artistName={product.vendor}
            href={`/shop/${product.handle}`}
            onQuickAdd={() => addToCart(product)}
          />
        </ScrollReveal>
      ))}
    </div>
  )
}
```

### Collector Dashboard
```tsx
import { VinylArtworkCard } from '@/components/vinyl'
import { ScrollReveal } from '@/components/blocks'

export function CollectorGallery({ ownedArtworks }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {ownedArtworks.map((item, index) => (
        <ScrollReveal key={item.id} animation="fadeUp" delay={index * 0.05}>
          <VinylArtworkCard
            title={item.name}
            image={item.image}
            artistName={item.artist}
            artistNotes={item.certificateInfo}
            href={`/collector/artwork/${item.id}`}
            variant="collector"
          />
        </ScrollReveal>
      ))}
    </div>
  )
}
```

### Artist Portfolio
```tsx
import { VinylArtworkCard } from '@/components/vinyl'
import { VinylCrateBrowser } from '@/components/vinyl'

export function ArtistShowcase({ series, artworks }) {
  return (
    <div className="space-y-12">
      {series.map((s) => (
        <div key={s.id}>
          <h2>{s.title}</h2>
          <VinylCrateBrowser
            items={s.artworks}
            renderItem={(artwork) => (
              <VinylArtworkCard
                title={artwork.title}
                image={artwork.image}
                artistName={s.artistName}
              />
            )}
          />
        </div>
      ))}
    </div>
  )
}
```

## Configuration

### GSAP Settings
Vinyl components use GSAP configuration from `lib/animations/gsap-config.ts`:

```tsx
// Custom eases
customEases: {
  smooth: 'power2.inOut',
  snappy: 'back.out(1.2)',
  smooth: 'elastic.out(1, 0.5)',
}

// Animation durations
durations: {
  fast: 0.3,
  normal: 0.6,
  slow: 0.9,
}
```

### Responsive Behavior
- **Mobile** (<768px): Disable 3D tilt, enable touch drag
- **Tablet** (768px-1024px): Enable tilt, constrain to moderate angles
- **Desktop** (>1024px): Full 3D tilt, high precision mouse-follow

## Troubleshooting

### 3D Tilt Not Working
- Check browser support for 3D transforms
- Verify `--enable-gpu-rasterization` on Chrome
- Check for conflicting CSS `transform` properties

### Animations Stuttering
- Reduce number of animated elements
- Enable hardware acceleration: `transform: translateZ(0)`
- Check for heavy JavaScript on scroll
- Profile with DevTools Performance tab

### Cards Not Flipping
- Ensure `enableFlip={true}` prop is set
- Check z-index conflicts with other elements
- Verify touch event propagation on mobile

## Migration Guide

### From ProductCard to VinylArtworkCard
```tsx
// Before
<ProductCard
  title="Artwork"
  price="$99"
  image="/img.jpg"
  href="/shop/handle"
/>

// After
<VinylArtworkCard
  title="Artwork"
  price="$99"
  image="/img.jpg"
  href="/shop/handle"
  enableTilt={true}
  enableFlip={true}
/>
```

## API Reference

See individual component documentation:
- [`VinylArtworkCard`](./VinylArtworkCard.tsx)
- [`VinylCardFront`](./VinylCardFront.tsx)
- [`VinylCardBack`](./VinylCardBack.tsx)
- [`VinylTiltEffect`](./VinylTiltEffect.tsx)
- [`VinylCrateBrowser`](./VinylCrateBrowser.tsx)
- [`VinylTurntableViewer`](./VinylTurntableViewer.tsx)

## Contributing

When adding new vinyl components:
1. Use GSAP for complex animations
2. Test on mobile, tablet, desktop
3. Ensure 60fps performance
4. Add TypeScript types
5. Document props and examples
6. Update this README

## Version History

- **v1.0.0** (Feb 2026): Initial vinyl components release
  - VinylArtworkCard, VinylTiltEffect, VinylCrateBrowser
  - useVinylCard, useVinylCrate hooks
  - GSAP animation infrastructure

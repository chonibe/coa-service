# Enhanced Shop Experience (home-v2)

## Overview

This directory contains the **enhanced version** of the shop homepage with immersive GSAP-powered animations and interactions. This is a **side-by-side comparison** version that does not replace the original `/shop/home`.

**Access URLs:**
- Original: `/shop/home`
- Enhanced: `/shop/home-v2` ← **This version**

---

## What's Enhanced?

### 1. **Hero Video with Scroll Parallax**
- Video zooms from 1.15x to 1.0x as you scroll (cinematic zoom-out)
- Text splits into characters/words and animates in with 3D rotation
- CTA button springs in with elastic easing
- Progressive overlay fade for smooth transition to content

**Component:** [`VideoPlayerEnhanced.tsx`](../../../components/sections/VideoPlayerEnhanced.tsx)

---

### 2. **Gallery-Walk Product Reveals**
- Products start at 85% scale with -5° rotation
- Scale to 100% and correct rotation as they enter viewport
- Magnetic hover effect: cards follow cursor subtly within bounds
- Staggered reveal with smooth timing

**Component:** [`GalleryReveal.tsx`](../../../components/shop/GalleryReveal.tsx)

---

### 3. **Stacked Card Carousel**
- Card stack carousel inspired by Osmo design
- Active card centered and flat
- Cards behind fan out with rotation (like playing cards)
- Click or drag to navigate
- Clean, intuitive interaction (no complex 3D effects)

**Component:** [`StackedCarousel.tsx`](../../../components/shop/StackedCarousel.tsx)

---

### 4. **Horizontal Artist Showcase**
- Section pins when it enters viewport (desktop only)
- Vertical scroll translates to horizontal movement
- Artist cards have staggered 3D depth
- Images reveal with clip-path animation (left to right wipe)
- Progress bar synced with scroll position

**Component:** [`HorizontalArtistsSection.tsx`](../../../components/sections/HorizontalArtistsSection.tsx)

---

### 5. **Kinetic Typography Quotes**
- Quote text animates word-by-word with 3D rotation
- Author name slides in character-by-character
- Auto-advances between quotes with smooth transitions
- Star ratings animate in

**Component:** [`KineticPressQuotes.tsx`](../../../components/sections/KineticPressQuotes.tsx)

---

### 6. **Smooth Scrolling**
- Buttery-smooth scroll experience using ScrollSmoother
- Velocity-based effects (optional)
- Disabled on mobile for better performance

**Component:** [`ScrollSmootherProvider.tsx`](../../../components/providers/ScrollSmootherProvider.tsx)

---

## New Components Created

All components are **additions**, not replacements:

### Core Components
| File | Purpose |
|------|---------|
| [`app/shop/home-v2/page.tsx`](./page.tsx) | Enhanced homepage with all GSAP effects |
| [`components/sections/VideoPlayerEnhanced.tsx`](../../../components/sections/VideoPlayerEnhanced.tsx) | Hero video with scroll parallax |
| [`components/sections/HorizontalArtistsSection.tsx`](../../../components/sections/HorizontalArtistsSection.tsx) | Pinned horizontal scroll |
| [`components/sections/KineticPressQuotes.tsx`](../../../components/sections/KineticPressQuotes.tsx) | Animated typography quotes |
| [`components/shop/GalleryReveal.tsx`](../../../components/shop/GalleryReveal.tsx) | Gallery-style grid wrapper |
| [`components/shop/StackedCarousel.tsx`](../../../components/shop/StackedCarousel.tsx) | Stacked card carousel |
| [`components/providers/ScrollSmootherProvider.tsx`](../../../components/providers/ScrollSmootherProvider.tsx) | Smooth scroll wrapper |

### Utilities
| File | Purpose |
|------|---------|
| [`lib/animations/text-animations.ts`](../../../lib/animations/text-animations.ts) | Text split and kinetic typography utilities |
| [`lib/animations/gsap-hooks-enhanced.ts`](../../../lib/animations/gsap-hooks-enhanced.ts) | Enhanced GSAP React hooks |

---

## Technical Details

### GSAP Plugins Used
- **ScrollTrigger**: Scroll-based animations
- **ScrollSmoother**: Smooth scrolling (optional, desktop only)
- **Draggable**: Crate carousel drag interaction
- **Observer**: Touch/flick gesture support
- **Flip**: Smooth layout transitions

### Performance Optimizations
- `gsap.quickTo()` for 60fps magnetic hover
- `will-change: transform` on animated elements
- Mobile detection: Complex effects disabled on touch devices
- Reduced motion support: Respects user preferences

### Accessibility
- All animations respect `prefers-reduced-motion`
- Keyboard navigation preserved
- ARIA labels on interactive elements
- Semantic HTML maintained

---

## Testing the Enhanced Experience

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit the enhanced page:**
   ```
   http://localhost:3000/shop/home-v2
   ```

3. **Compare with original:**
   ```
   http://localhost:3000/shop/home
   ```

### What to Look For

**Hero Section:**
- Scroll down and watch the video zoom out
- Notice the text animating character-by-character on load

**New Releases:**
- Watch products scale and rotate into view as you scroll
- Hover over cards and see the magnetic effect

**Best Sellers:**
- Click cards or use arrows to navigate
- Notice cards rotating and fanning out behind the active card
- Drag left/right to browse

**Featured Artists (Desktop):**
- Scroll vertically and watch the section move horizontally
- See the staggered depth parallax
- Watch images reveal with clip-path

**Press Quotes:**
- Watch quotes animate word-by-word
- Auto-advances every 6 seconds

---

## Integration into Production

Once approved, you can cherry-pick individual components:

### Option 1: Replace Original
```tsx
// In app/shop/home/page.tsx
- import { VideoPlayer } from '@/components/sections'
+ import { VideoPlayerEnhanced as VideoPlayer } from '@/components/sections/VideoPlayerEnhanced'
```

### Option 2: A/B Test with Toggle
Create a feature flag to switch between versions.

### Option 3: Gradual Rollout
Start with one component (e.g., GalleryReveal) and add others incrementally.

---

## Browser Support

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support (iOS 14+)
- **Mobile:** Simplified animations for performance

---

## Known Limitations

1. **ScrollSmoother:** May interfere with some third-party scripts. Test thoroughly before production.
2. **Horizontal Scroll:** Desktop-only. Falls back to vertical grid on mobile.
3. **Performance:** Heavy animations may impact lower-end devices. Mobile optimizations in place.

---

## Credits

Built using:
- [GSAP 3.14.2](https://greensock.com/gsap/)
- [@gsap/react 2.1.2](https://greensock.com/react/)
- Shopify Storefront API
- Next.js 14 App Router

---

## Questions?

Check the main [animations documentation](../../../lib/animations/README.md) or reach out to the development team.

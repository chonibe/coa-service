# Animation Library

Comprehensive GSAP-based animation infrastructure for building performant, smooth interactions.

## Overview

This library provides:
- GSAP plugin registration and configuration
- React hooks for common animation patterns
- Animation factory functions
- Framer Motion variants for component animations
- Scroll-aware header effects

## Core Modules

### gsap-config.ts

GSAP configuration with all plugins registered globally.

**Plugins Included:**
- ScrollTrigger - Scroll-based animations
- Flip - State-to-state animations
- Draggable - Drag interactions with momentum
- Observer - Unified input handling
- quickTo() - High-performance mouse-follow

**Usage:**
```tsx
import { gsap, ScrollTrigger, Flip } from '@/lib/animations'

// All plugins pre-registered
gsap.to('.element', { duration: 1, y: 100 })
ScrollTrigger.create({...})
Flip.getState('.card')
```

### gsap-hooks.ts

React hooks for GSAP animations with proper cleanup.

#### useGSAP
Core hook for GSAP animations in React.

```tsx
import { useGSAP } from '@/lib/animations'

export function MyComponent() {
  const containerRef = useRef(null)
  
  useGSAP(() => {
    gsap.from('.item', { 
      duration: 1, 
      y: 50, 
      opacity: 0,
      stagger: 0.1 
    })
  }, { scope: containerRef })
  
  return <div ref={containerRef}>...</div>
}
```

#### use3DTilt
3D tilt effect following mouse.

```tsx
import { use3DTilt } from '@/lib/animations'

export function TiltCard() {
  const { ref, isHovering } = use3DTilt({
    maxTilt: 15,
    scale: 1.02,
    perspective: 1000,
  })
  
  return <div ref={ref}>Card with tilt</div>
}
```

#### useFlip
FLIP animation for layout changes.

```tsx
import { useFlip } from '@/lib/animations'

export function CardGrid() {
  const { ref, animate } = useFlip()
  
  const handleSort = async () => {
    // Record initial state
    Flip.getState(ref.current)
    
    // Change DOM
    setItems(sortedItems)
    
    // Animate to new position
    animate()
  }
  
  return (
    <div ref={ref} className="grid">
      {/* Cards */}
    </div>
  )
}
```

#### useDraggable
Drag interactions with momentum and bounds.

```tsx
import { useDraggable } from '@/lib/animations'

export function DragSlider() {
  const { ref, x, isDragging } = useDraggable({
    bounds: { minX: -500, maxX: 0 },
    momentum: true,
    snap: 100,
  })
  
  return <div ref={ref}>Drag me!</div>
}
```

#### useScrollTrigger
Scroll-based animation triggers.

```tsx
import { useScrollTrigger } from '@/lib/animations'

export function ScrollRevealSection() {
  const { ref, progress } = useScrollTrigger({
    trigger: ref,
    start: 'top center',
    end: 'bottom center',
    scrub: true,
  })
  
  return (
    <div ref={ref}>
      <motion.div style={{ opacity: progress }}>
        Content fades in on scroll
      </motion.div>
    </div>
  )
}
```

#### useStagger
Staggered animations for multiple elements.

```tsx
import { useStagger } from '@/lib/animations'

export function StaggerList() {
  const { containerRef, animate } = useStagger({
    stagger: 0.1,
    duration: 0.5,
  })
  
  useEffect(() => {
    animate([
      { selector: '.item', from: { y: 50, opacity: 0 }, to: { y: 0, opacity: 1 } },
    ])
  }, [])
  
  return (
    <div ref={containerRef}>
      {items.map((item) => <div className="item">{item}</div>)}
    </div>
  )
}
```

### gsap-utils.ts

Animation factory functions for common patterns.

#### fadeInUp
Fade and translate up animation.

```tsx
import { fadeInUp } from '@/lib/animations'

gsap.from('.element', fadeInUp({
  duration: 0.6,
  delay: 0.2,
  y: 50,
}))
```

#### staggerChildren
Stagger animation for multiple elements.

```tsx
import { staggerChildren } from '@/lib/animations'

gsap.from('.item', staggerChildren({
  stagger: 0.05,
  duration: 0.5,
  y: 20,
  opacity: 0,
}))
```

#### createParallax
Parallax scroll effect.

```tsx
import { createParallax } from '@/lib/animations'

const parallax = createParallax('.bg', {
  speed: 0.5,
  start: 'top center',
})
```

#### createDrawerTimeline
Orchestrated drawer open/close animation.

```tsx
import { createDrawerTimeline } from '@/lib/animations'

const timeline = createDrawerTimeline({
  duration: 0.3,
  ease: 'power2.out',
})

// Open
timeline.play()

// Close
timeline.reverse()
```

#### badgePop
Elastic pop animation for badges.

```tsx
import { badgePop } from '@/lib/animations'

gsap.from('.badge', badgePop({
  scale: 0,
  transformOrigin: 'center center',
}))
```

### framer-variants.ts

Pre-configured Framer Motion variants for common animations.

#### Basic Variants
```tsx
import { fade, fadeUp, scaleFade } from '@/lib/animations'
import { motion } from 'framer-motion'

<motion.div variants={fade} initial="initial" animate="animate">
  Fades in
</motion.div>

<motion.div variants={fadeUp} initial="initial" animate="animate">
  Fades and slides up
</motion.div>

<motion.div variants={scaleFade} initial="initial" animate="animate">
  Fades and scales
</motion.div>
```

#### Drawer Variants
```tsx
import { drawerRight, backdrop } from '@/lib/animations'

<motion.div
  variants={backdrop}
  initial="hidden"
  animate="visible"
  exit="exit"
/>

<motion.nav
  variants={drawerRight}
  initial="hidden"
  animate="visible"
  exit="exit"
/>
```

#### Stagger Container
```tsx
import { createStaggerContainer, staggerItem } from '@/lib/animations'

<motion.div
  variants={createStaggerContainer()}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

#### Interactive Variants
```tsx
import { cardHover, buttonHover } from '@/lib/animations'

<motion.div variants={cardHover} whileHover="hover" whileTap="tap">
  Interactive card
</motion.div>

<motion.button variants={buttonHover} whileHover="hover" whileTap="tap">
  Click me
</motion.button>
```

### useScrollHeader.ts

Scroll-aware header effects.

```tsx
import { useScrollHeader } from '@/lib/animations'

export function Header() {
  const { headerRef, isScrolling, scrollDirection } = useScrollHeader()
  
  return (
    <header
      ref={headerRef}
      className={`transition-all ${isScrolling ? 'shadow-lg' : ''}`}
    >
      {/* Header content */}
    </header>
  )
}
```

## Common Patterns

### Scroll Reveal
```tsx
import { ScrollReveal } from '@/components/blocks'

<ScrollReveal animation="fadeUp" delay={0.2} duration={0.6}>
  <YourComponent />
</ScrollReveal>
```

### 3D Tilt Card
```tsx
import { use3DTilt } from '@/lib/animations'

function Card() {
  const { ref } = use3DTilt({ maxTilt: 15 })
  return <div ref={ref}>Card</div>
}
```

### Staggered Grid
```tsx
function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {products.map((product, i) => (
        <ScrollReveal key={product.id} delay={i * 0.05}>
          <ProductCard {...product} />
        </ScrollReveal>
      ))}
    </div>
  )
}
```

### Drawer Animation
```tsx
import { createDrawerTimeline } from '@/lib/animations'

function Drawer() {
  const timelineRef = useRef(null)
  
  useEffect(() => {
    timelineRef.current = createDrawerTimeline()
  }, [])
  
  const open = () => timelineRef.current?.play()
  const close = () => timelineRef.current?.reverse()
}
```

## Performance Tips

### Do's
- ✅ Use `gsap.quickTo()` for mouse-follow effects
- ✅ Batch animations with `stagger`
- ✅ Use `will-change` CSS on animated elements
- ✅ Cleanup animations in useEffect
- ✅ Test on actual devices
- ✅ Use `prefers-reduced-motion`

### Don'ts
- ❌ Animate too many elements simultaneously (limit to 10-15)
- ❌ Use `left/top` for animations (use `transform` instead)
- ❌ Animate on every pixel of scroll (use `ScrollTrigger`)
- ❌ Leave animations running after unmount
- ❌ Ignore performance on mobile devices

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| GSAP Core | ✅ | ✅ | ✅ | ✅ |
| ScrollTrigger | ✅ | ✅ | ✅ | ✅ |
| Flip | ✅ | ✅ | ✅ | ✅ |
| Draggable | ✅ | ✅ | ✅ | ✅ |
| 3D Transforms | ✅ | ✅ | ✅ | ✅ |
| Touch Events | ✅ | ✅ | ✅ | ✅ |

## Troubleshooting

### Animations Not Running
- Check `useGSAP` scope ref
- Verify selectors match DOM elements
- Check for CSS `pointer-events: none`

### Performance Issues
- Profile with DevTools
- Reduce animated element count
- Enable GPU acceleration
- Use `will-change` CSS

### Mobile Doesn't Work
- Test touch events
- Check viewport scaling
- Verify touch event handlers
- Test on actual device

## API Reference

### gsap-config.ts
- `initializeGSAP()` - Initialize GSAP
- `prefersReducedMotion()` - Check reduced motion preference
- `createResponsiveAnimation()` - Responsive animation creation
- `cleanupGSAP()` - Cleanup animations
- `killScrollTriggers()` - Cleanup scroll triggers

### gsap-hooks.ts
- `useGSAP()` - Core GSAP hook
- `use3DTilt()` - 3D tilt effect
- `useFlip()` - FLIP animations
- `useDraggable()` - Drag interactions
- `useScrollTrigger()` - Scroll triggers
- `useObserver()` - Input observer
- `useStagger()` - Stagger animations
- `useCardFlip()` - Card flip interaction

### gsap-utils.ts
- `fadeInUp()` - Fade and slide up
- `fadeInScale()` - Fade and scale
- `staggerChildren()` - Stagger multiple elements
- `createParallax()` - Parallax effect
- `createDrawerTimeline()` - Drawer animation
- `badgePop()` - Elastic pop
- `animateCounter()` - Number counter
- `shake()` - Shake effect
- `pulse()` - Pulse effect
- `glowPulse()` - Glow pulse effect

## Version

- **Current**: 1.0.0
- **Last Updated**: February 2026
- **GSAP Version**: ^3.14.0
- **Framer Motion Version**: ^11.0.0

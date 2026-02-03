# Animation Library

A comprehensive animation system built on GSAP and Framer Motion.

## Overview

This library provides:

- **GSAP Configuration**: Plugin registration, custom eases, defaults
- **React Hooks**: Declarative animation hooks for common patterns
- **Animation Utilities**: Factory functions for reusable animations
- **Framer Motion Variants**: Standardized variants for React components

## Architecture

```
lib/animations/
├── gsap-config.ts      # GSAP setup and configuration
├── gsap-hooks.ts       # React hooks for GSAP
├── gsap-utils.ts       # Animation factory functions
├── framer-variants.ts  # Framer Motion variants
├── useScrollHeader.ts  # Scroll-aware header effects
└── index.ts            # Central exports
```

## GSAP vs Framer Motion

### Use GSAP For

| Animation Type | Why GSAP |
|---------------|----------|
| Mouse-follow 3D tilt | `quickTo()` batches RAF updates, guaranteed 60fps |
| Scroll-triggered | ScrollTrigger has scrubbing, pinning, parallax |
| Drag with momentum | Draggable has inertia, bounds, snap-to-grid |
| Complex orchestration | Timeline with labels, callbacks, pause/resume |
| Stagger animations | Grid stagger, from-center, random, custom |
| Layout transitions | Flip plugin for state-to-state FLIP |

### Use Framer Motion For

| Animation Type | Why Framer |
|---------------|------------|
| `AnimatePresence` | React lifecycle hooks |
| `layoutId` shared elements | Automatic FLIP on layout change |
| Simple `whileHover`/`whileTap` | Less boilerplate for basics |
| Route transitions | Next.js App Router compatibility |

## Usage

### GSAP Hooks

```tsx
import { 
  use3DTilt, 
  useFlip, 
  useDraggable, 
  useScrollTrigger 
} from '@/lib/animations'

// 3D Tilt Effect
function TiltCard() {
  const ref = use3DTilt({ maxTilt: 15, scale: 1.02 })
  return <div ref={ref}>Tilts on hover!</div>
}

// GSAP Flip Animation
function FlipLayout() {
  const { captureState, animateFlip } = useFlip()
  
  const handleToggle = () => {
    captureState('.items')
    setLayout(prev => !prev)
    animateFlip('.items')
  }
  
  return <div onClick={handleToggle}>...</div>
}

// Draggable
function DraggableCard() {
  const { ref, enable, disable } = useDraggable({
    type: 'x',
    bounds: '.container',
    inertia: true,
    snap: 100,
  })
  
  return <div ref={ref}>Drag me!</div>
}

// Scroll Trigger
function ScrollReveal() {
  const ref = useScrollTrigger(
    () => gsap.from(ref.current, { y: 50, opacity: 0 }),
    { start: 'top 80%', once: true }
  )
  
  return <div ref={ref}>Appears on scroll</div>
}
```

### Animation Utilities

```tsx
import { 
  fadeInUp, 
  staggerChildren, 
  createParallax,
  createDrawerTimeline 
} from '@/lib/animations'

// Fade in from below
fadeInUp('.elements', { y: 30, stagger: 0.1 })

// Stagger children
staggerChildren('.container', '> *', {
  y: 20,
  staggerAmount: 0.3,
  staggerFrom: 'center',
})

// Parallax effect
createParallax('.hero-image', {
  y: '-20%',
  speed: 0.5,
  scrub: true,
})

// Drawer animation timeline
const tl = createDrawerTimeline(
  '.drawer',
  '.backdrop',
  '.drawer-items',
  { direction: 'right' }
)
tl.play() // Open
tl.reverse() // Close
```

### Framer Motion Variants

```tsx
import { 
  fadeUp, 
  scaleFade, 
  drawerRight,
  createStaggerContainer,
  staggerItem 
} from '@/lib/animations'

// Page transition
<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={fadeUp}
>
  Content
</motion.div>

// Stagger container
<motion.ul variants={createStaggerContainer(0.05)}>
  {items.map(item => (
    <motion.li key={item.id} variants={staggerItem}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>

// Drawer
<AnimatePresence>
  {isOpen && (
    <motion.div variants={drawerRight}>
      Drawer content
    </motion.div>
  )}
</AnimatePresence>
```

### Scroll-Aware Header

```tsx
import { useScrollHeader, useCartBadgeAnimation } from '@/lib/animations'

function Header() {
  const { headerRef, logoRef, isScrolled, isHidden } = useScrollHeader({
    threshold: 50,
    hideOnScroll: true,
    progressiveBlur: true,
    logoScale: true,
  })
  
  const { badgeRef, triggerPop } = useCartBadgeAnimation()
  
  return (
    <header 
      ref={headerRef}
      className={cn(
        'fixed top-0 transition-transform',
        isHidden && '-translate-y-full'
      )}
    >
      <img ref={logoRef} src="/logo.svg" />
      <span ref={badgeRef}>{cartCount}</span>
    </header>
  )
}
```

## Configuration

### Custom Eases

```ts
export const customEases = {
  vinylLift: 'power2.out',
  vinylFlip: 'power1.inOut',
  crateMomentum: 'power3.out',
  tiltReturn: 'elastic.out(1, 0.5)',
  badgePop: 'elastic.out(1.2, 0.4)',
  drawerSlide: 'power2.out',
}
```

### Duration Constants

```ts
export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.35,
  slow: 0.5,
  flip: 0.6,
  drawerOpen: 0.4,
  stagger: 0.05,
}
```

## Reduced Motion Support

All animations respect `prefers-reduced-motion`:

```ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

if (prefersReducedMotion.matches) {
  gsap.globalTimeline.timeScale(0)
  ScrollTrigger.defaults({ animation: false })
}
```

## Plugins (All Free!)

As of 2024, all GSAP plugins are free:

- **ScrollTrigger**: Scroll-based animations, parallax, pinning
- **Flip**: State-to-state FLIP animations
- **Draggable**: Drag interactions with momentum, bounds, snap
- **Observer**: Unified input handling (touch, mouse, scroll)

## Best Practices

1. **Use `gsap.context()`** for React cleanup:
   ```ts
   useGSAP(() => {
     // animations
   }, { dependencies: [] })
   ```

2. **Batch mouse-move animations** with `quickTo()`:
   ```ts
   const quickX = gsap.quickTo(el, 'x', { duration: 0.5 })
   element.onmousemove = (e) => quickX(e.clientX)
   ```

3. **Avoid layout thrashing** - animate transforms only:
   ```ts
   // Good
   gsap.to(el, { x: 100, scale: 1.1 })
   
   // Avoid
   gsap.to(el, { width: 200, height: 150 })
   ```

4. **Use will-change sparingly**:
   ```css
   .animated { will-change: transform; }
   ```

5. **Clean up ScrollTriggers**:
   ```ts
   return () => {
     ScrollTrigger.getAll().forEach(st => st.kill())
   }
   ```

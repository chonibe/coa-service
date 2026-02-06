# Osmo-Inspired Components

Implementation of 4 key components inspired by [Osmo's](https://www.osmo.supply/) design system, adapted for Street Collector shop.

## 📦 Components Created

### 1. ButtonRotate
**File:** `components/impact/ButtonRotate.tsx`

**Features:**
- 3D rolling text effect on hover
- Smooth GSAP animations
- Multiple label copies for seamless rotation
- CSS custom properties for dynamic positioning
- 7 variant styles (primary, secondary, outline, neutral, electric, purple, coral)

**Usage:**
```tsx
import { ButtonRotate } from '@/components/impact'

<ButtonRotate variant="electric" size="lg" shape="pill">
  Explore Collection
</ButtonRotate>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'neutral' | 'electric' | 'purple' | 'coral'
- `size`: 'sm' | 'md' | 'lg' | 'full'
- `shape`: 'square' | 'rounded' | 'pill'
- `href`: Optional link URL
- `onClick`: Optional click handler

---

### 2. FlickCards
**File:** `components/shop/FlickCards.tsx`

**Features:**
- Cards flip/rotate on hover with 3D perspective
- Magnetic hover effect (cards follow mouse subtly)
- Staggered entrance reveal animation
- Tag system for "New", "Limited Edition", etc.
- Content slides up on hover with gradient overlay
- Shine effect on interaction

**Usage:**
```tsx
import { FlickCards } from '@/components/shop/FlickCards'

const cards = [
  {
    id: '1',
    title: 'Product Name',
    description: 'Product description',
    imageUrl: '/image.jpg',
    href: '/shop/product',
    tag: 'New',
    tagVariant: 'new',
  },
]

<FlickCards
  cards={cards}
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="lg"
  enableMagnetic={true}
  enableFlip={true}
/>
```

**Props:**
- `cards`: Array of card data
- `columns`: Responsive grid columns
- `gap`: 'sm' | 'md' | 'lg'
- `enableMagnetic`: Enable mouse-follow effect
- `enableFlip`: Enable 3D rotation on hover

---

### 3. AccordionFAQ
**File:** `components/sections/AccordionFAQ.tsx`

**Features:**
- Smooth GSAP expand/collapse animations
- Categorized FAQ groups with toggle buttons
- Auto-close siblings option
- Rotating plus/minus icons
- Accessible ARIA attributes
- Height animation with scroll measurement

**Usage:**
```tsx
import { AccordionFAQ } from '@/components/sections'

const categories = [
  {
    id: 'shipping',
    title: 'Shipping',
    items: [
      {
        id: '1',
        question: 'Do you ship internationally?',
        answer: 'Yes! We ship worldwide.',
        defaultOpen: true,
      },
    ],
  },
]

<AccordionFAQ
  categories={categories}
  defaultCategory="shipping"
  closeSiblings={true}
/>
```

**Props:**
- `categories`: Array of FAQ categories
- `defaultCategory`: Initially active category
- `closeSiblings`: Auto-close other items when opening one

---

### 4. ModalSystem
**File:** `components/sections/ModalSystem.tsx`

**Features:**
- Portal-based rendering (appends to document.body)
- GSAP-powered open/close animations
- Backdrop blur effect
- Scale + fade transition
- Close on escape key
- Body scroll lock when open
- Customizable sizes

**Usage:**
```tsx
import { ModalSystem, ModalTrigger } from '@/components/sections'
import { useState } from 'react'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Open Modal
      </button>

      <ModalSystem
        id="my-modal"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="md"
      >
        <h2>Modal Title</h2>
        <p>Modal content goes here...</p>
      </ModalSystem>
    </>
  )
}
```

**Props:**
- `id`: Unique modal identifier
- `isOpen`: Control visibility
- `onClose`: Close handler
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `closeOnBackdrop`: Click backdrop to close (default: true)
- `closeOnEscape`: Press Esc to close (default: true)
- `showCloseButton`: Show X button (default: true)

---

### 5. CircularCarousel (Updated)
**File:** `components/shop/CircularCarousel.tsx`

**Features:**
- Cards arranged in semi-circle arc (10, 12, 2 o'clock)
- Viewport stays fixed, cards rotate into view
- Drag to navigate (left/right)
- Only top portion of circle visible
- Cards fan out with rotation
- Active card highlighted with glow
- Navigation buttons below

**Already Implemented** - See previous work

---

## 🎨 Design Principles (from Osmo)

### Animation Philosophy
1. **Subtle, not distracting** - Effects enhance, don't overpower
2. **60fps performance** - GSAP optimizations and `will-change`
3. **Elastic easing** - Natural, bouncy feel on interactions
4. **Staggered reveals** - Items appear in sequence, not all at once

### Visual Consistency
- **Border radius:** 12-24px for cards, full pill for tags/buttons
- **Colors:** High contrast (#1a1a1a text on white)
- **Shadows:** Subtle elevation with blur
- **Typography:** Bold headings, medium body text

### Interaction Patterns
- **Hover states:** Always provide visual feedback
- **Magnetic effects:** Subtle attraction to cursor
- **3D transforms:** Add depth with perspective
- **State transitions:** Smooth GSAP timelines

---

## 🚀 Demo Page

Visit `/shop/osmo-demo` to see all components in action with:
- Live product data from Shopify
- Interactive examples
- Component documentation
- Usage patterns

---

## 📋 Integration Checklist

- [x] Create ButtonRotate component
- [x] Create FlickCards component  
- [x] Create AccordionFAQ component
- [x] Create ModalSystem component
- [x] Update CircularCarousel behavior
- [x] Export from index files
- [x] Create demo page
- [ ] Add to home-v2 page
- [ ] Add to main shop pages
- [ ] Performance testing
- [ ] Mobile responsiveness check

---

## 🔗 Related Files

**Components:**
- `/components/impact/ButtonRotate.tsx`
- `/components/shop/FlickCards.tsx`
- `/components/sections/AccordionFAQ.tsx`
- `/components/sections/ModalSystem.tsx`
- `/components/shop/CircularCarousel.tsx`

**Demo:**
- `/app/shop/osmo-demo/page.tsx`

**Existing Enhanced Components:**
- `/components/sections/VideoPlayerEnhanced.tsx`
- `/components/shop/GalleryReveal.tsx`
- `/components/sections/HorizontalArtistsSection.tsx`
- `/components/providers/ScrollSmootherProvider.tsx`

---

## 📊 Shopify Collection Sorting

All collection queries now use `sortKey: 'MANUAL'` to respect the product order you set in Shopify Admin.

**Why Manual Sorting?**
- Preserves your curated product order in carousels and grids
- Lets you control which products appear first
- Essential for featured collections and promotional displays

**Sort Options Available:**
- `'MANUAL'` - Respects Shopify Admin drag-and-drop order (used in homepage/carousels)
- `'BEST_SELLING'` - Sorts by sales volume (good for dynamic "trending" sections)
- `'CREATED_AT'` - Newest products first (used in artist galleries)
- `'PRICE'` - Price low-to-high or high-to-low (used in filterable product pages)
- `'TITLE'` - Alphabetical sorting

**Where Manual Sorting Is Applied:**
- ✅ Homepage best sellers carousel (`/shop/home`)
- ✅ Homepage new releases grid (`/shop/home`)
- ✅ Enhanced homepage carousels (`/shop/home-v2`)
- ✅ Osmo demo page (`/shop/osmo-demo`)
- ✅ Featured artist collections
- ⚠️ Artist profile pages use `CREATED_AT` (newest first)
- ⚠️ Products browse page uses user-selected sorting

**To Change Collection Order:**
1. Go to Shopify Admin > Products > Collections
2. Select your collection
3. Drag products to reorder them
4. Save changes
5. Refresh your site - cards will appear in your new order!

---

## 🎯 Next Steps

1. **Test carousel drag behavior** - Verify smooth rotation
2. **Add to home-v2** - Integrate ButtonRotate and FlickCards
3. **Create product detail modal** - Use ModalSystem for quick view
4. **Performance audit** - Check 60fps on all animations
5. **Mobile optimization** - Test touch interactions

---

## 📝 Notes

- All components use GSAP for animations (not CSS transitions)
- Osmo's patterns are recreated, not copied (clean-room implementation)
- Components are built for Shopify product data structure
- Fully responsive with mobile-first approach
- Accessibility features included (ARIA, keyboard nav)

---

**Created:** 2026-02-04  
**Inspired by:** [Osmo.supply](https://www.osmo.supply/)  
**Status:** Ready for integration

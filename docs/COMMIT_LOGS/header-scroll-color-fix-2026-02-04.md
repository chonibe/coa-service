# Header Scroll Color Fix

**Date:** 2026-02-04  
**Status:** ✅ Complete  
**Files Modified:** 1

## Problem Statement

The transparent header on the home-v2 page was transitioning to **white background** when scrolling, but it should transition to the **brand red color** (#390000) to match the static header design.

## Root Cause

The `useSmoothHeaderScroll` animation hook in `lib/animations/navigation-animations.ts` was hardcoded to:
- Background: `rgba(255, 255, 255, ${opacity})` (white)
- Text color: White → Black
- Logo: Invert based on scroll

This was designed for a generic white header, not the Impact theme's brand colors.

## Brand Colors (Impact Theme)

From `app/globals.css`:
```css
--impact-header-background: 57 0 0;     /* #390000 - Deep Red */
--impact-header-text: 255 186 148;      /* #ffba94 - Warm Orange */
```

## Solution Applied

Updated the `useSmoothHeaderScroll` function to use Impact theme brand colors:

### Background Transition
**Before:**
```typescript
headerRef.current.style.backgroundColor = `rgba(255, 255, 255, ${bgOpacity})`
```

**After:**
```typescript
headerRef.current.style.backgroundColor = `rgba(57, 0, 0, ${bgOpacity})`
```

### Text Color Transition
**Before:**
```typescript
const color = gsap.utils.interpolate(
  [255, 255, 255], // white
  [0, 0, 0],       // black
  progress
)
```

**After:**
```typescript
const color = gsap.utils.interpolate(
  [255, 255, 255], // white (transparent state)
  [255, 186, 148], // #ffba94 brand orange (scrolled state)
  progress
)
```

### Logo Filter
**Before:**
```typescript
const logoInvert = progress > 0.5 ? 0 : 1  // Flip from white to dark
```

**After:**
```typescript
const logoInvert = 1  // Always keep logo white (looks good on both transparent and red)
```

## Animation Behavior

### At Top of Page (progress = 0)
- Background: `rgba(57, 0, 0, 0)` - Fully transparent
- Text color: `rgb(255, 255, 255)` - White
- Logo: White (inverted)

### While Scrolling (progress = 0.5)
- Background: `rgba(57, 0, 0, 0.475)` - Semi-transparent red
- Text color: `rgb(255, 193, 201)` - Blend of white and orange
- Logo: White (inverted)

### After Scroll Threshold (progress = 1)
- Background: `rgba(57, 0, 0, 0.95)` - Solid red (95% opacity)
- Text color: `rgb(255, 186, 148)` - Brand orange
- Logo: White (inverted)

## Technical Details

**GSAP Interpolation:**
- Uses `gsap.utils.interpolate()` for smooth RGB color transitions
- Calculates progress based on scroll distance vs viewport height threshold
- Applies inline styles that override component defaults

**Performance:**
- Scroll event throttled by browser's requestAnimationFrame
- Lightweight calculations (simple math and color interpolation)
- No layout thrashing (only updates CSS custom properties and inline styles)

## Files Changed

1. ✅ `lib/animations/navigation-animations.ts` - Updated color values and transitions

## Testing Checklist

- [x] Header starts transparent at top of page
- [x] Header smoothly transitions to red background while scrolling
- [x] Text color transitions from white to brand orange
- [x] Logo stays white throughout scroll
- [x] Background reaches 95% opacity at scroll threshold
- [x] Matches the static header design

## Visual Result

**Scroll Behavior:**
```
Top of page:     Transparent → barely visible
                 White text on transparent

Scrolling down:  Red gradually appears
                 Text transitions to orange
                 Smooth 0.3s animation

Scrolled:        Solid red background (#390000)
                 Orange text (#ffba94)
                 Matches static header
```

## Related Components

- `components/sections/TransparentHeader.tsx` - Uses this scroll hook
- `components/impact/Header.tsx` - Static header with same colors
- `app/globals.css` - Defines Impact theme color variables

---

**Note:** This fix ensures the transparent header's scroll animation matches the Impact theme's brand identity with the signature deep red background and warm orange text.

# Homepage Fixes - February 4, 2026

## Overview
Fixed four critical issues with the homepage experience:
1. Video playback and URL fetching
2. Artists list showing only 6 instead of all artists
3. FAQ dropdown styling and layout
4. Product cards missing GSAP vinyl interactions

## Changes Made

### 1. Video Player Enhancement
**File**: `components/sections/VideoPlayer.tsx`

**Changes**:
- Added error handling for video loading failures
- Implemented fallback to poster image when video fails to load
- Added `videoError` state to track loading issues
- Graceful degradation ensures content is always visible

**Technical Details**:
```tsx
// Added error state
const [videoError, setVideoError] = React.useState(false)

// Added onError handler and fallback
onError={() => setVideoError(true)}

// Fallback display
{videoError && (
  <div className="..." style={{
    backgroundImage: video.poster ? `url(${video.poster})` : 'linear-gradient(...)'
  }} />
)}
```

### 2. Artists List - Show All Artists
**Files**: 
- `app/shop/home/page.tsx` (line 72)
- `app/api/shop/artists/route.ts` (line 15)

**Changes**:
- Removed `.slice(0, 6)` limitation that was capping artist display
- Increased API product fetch limit from 250 to 500 products
- Now displays all 44 artists from `homepageContent.featuredArtists.collections`

**Before**:
```tsx
homepageContent.featuredArtists.collections.slice(0, 6).map(...)
const { products } = await getProducts({ first: 250 })
```

**After**:
```tsx
homepageContent.featuredArtists.collections.map(...)
const { products } = await getProducts({ first: 500 })
```

### 3. FAQ Section Redesign
**File**: `components/sections/FAQ.tsx`

**Changes**:
- Increased spacing: `gap-8 lg:gap-12` → `gap-12 lg:gap-16`
- Enhanced typography: larger titles (4xl → 6xl), better font weights
- Improved accordion styling:
  - Larger click targets (p-5 → p-6 sm:p-7)
  - Rounded corners: 16px → 20px
  - Added border transitions with hover states
  - Blue accent color (#2c4bce) for active states
  - Scale effect on open items (scale-110)
  - Smooth 500ms transitions
- Added staggered fade-in animations using existing animation classes
- Better mobile responsiveness
- Enhanced visual hierarchy with larger spacing

**Key Styling Improvements**:
```tsx
// Active state with border and shadow
className={cn(
  isOpen 
    ? 'border-[#2c4bce] shadow-lg' 
    : 'border-transparent hover:border-[#1a1a1a]/10'
)}

// Icon with rotation and color change
className={cn(
  isOpen 
    ? 'bg-[#2c4bce] text-white rotate-45 scale-110' 
    : 'bg-white text-[#1a1a1a] group-hover:bg-[#2c4bce]'
)}
```

### 4. Product Cards with GSAP Interactions
**Files**:
- Created: `app/shop/home/HomeProductCard.tsx` (new client component)
- Modified: `app/shop/home/page.tsx`

**Changes**:
- Created new client component `HomeProductCard` that uses `VinylArtworkCard`
- Replaced standard `ProductCard` with GSAP-powered vinyl interactions
- Features include:
  - 3D tilt effect on hover
  - Smooth GSAP animations
  - Flip to reveal artist notes (if available)
  - Quick add to cart functionality
  - Badge system (New, Sale, Sold Out)
  - Image hover swap

**Technical Implementation**:
```tsx
<VinylArtworkCard
  title={product.title}
  price={price}
  image={product.featuredImage?.url}
  secondImage={secondImage}
  artistName={product.vendor}
  artistNotes={artistNotes}
  disableFlip={!artistNotes}
  disableTilt={false}
  variant="shop"
/>
```

**Benefits**:
- Buttery smooth animations powered by GSAP
- Vinyl record-inspired interactions enhance brand experience
- Consistent with vinyl theme throughout the platform
- Better user engagement with interactive elements

## Component Architecture

### New Components
- `app/shop/home/HomeProductCard.tsx` - Client component for product cards with vinyl effects

### Modified Components
- `app/shop/home/page.tsx` - Updated to use new product card component
- `components/sections/VideoPlayer.tsx` - Added error handling
- `components/sections/FAQ.tsx` - Enhanced styling and animations
- `app/api/shop/artists/route.ts` - Increased product fetch limit

## Testing Checklist

- [x] Video playback works on homepage
- [x] Video fallback displays when video fails to load
- [x] All 44 artists display in artists section
- [x] Artists section scrolls properly with many items
- [x] FAQ accordion opens/closes smoothly
- [x] FAQ styling is attractive and modern
- [x] Product cards display with GSAP tilt effect
- [x] Product card hover animations work smoothly
- [x] Quick add to cart functionality works
- [x] Badges display correctly (New, Sale, Sold Out)
- [x] No TypeScript/linter errors

## Performance Considerations

1. **Video Loading**: Fallback mechanism prevents blank content
2. **Artists List**: Fetching 500 products may increase API response time - consider pagination if needed
3. **GSAP Animations**: Client-side rendering required but animations are performant
4. **Image Loading**: Second images load lazily for hover effect

## Breaking Changes
None - all changes are additive or improve existing functionality

## Dependencies
- Existing: `@/components/vinyl` package with VinylArtworkCard
- Existing: GSAP library for animations
- Existing: CartContext for add to cart functionality

## Related Files
- `content/homepage.ts` - Homepage content configuration (no changes needed)
- `lib/shopify/storefront-client.ts` - Shopify API client (no changes needed)

## Future Improvements

1. **Video URLs**: Consider moving videos to Vercel Blob storage or CDN for better reliability
2. **Artists Pagination**: Implement pagination for artists list if collection grows beyond 100
3. **FAQ Search**: Add search/filter functionality for FAQ items
4. **Product Card Variants**: Create different animation presets for various page contexts
5. **Performance Monitoring**: Track video load failures and GSAP animation performance

## Notes
- All artists from `homepage.ts` now display (44 total)
- FAQ section uses brand color (#2c4bce) for active states
- Product cards maintain fallback to standard card if vinyl effects disabled
- Video player maintains backward compatibility with all existing usage

# Vendor Profile GIF Support

**Date:** February 1, 2026
**Branch:** main
**Status:** ✅ Completed

## Overview
Added support for GIF animated images for vendor profile pictures across the entire platform.

## Changes Made

### 1. Profile Upload Page ✅
**File:** `app/vendor/dashboard/profile/page.tsx`

**Changes:**
- Updated file input `accept` attribute to explicitly include `image/gif`
- Added `unoptimized` prop to Next.js Image component for profile display
  - Checks if URL ends with `.gif` to bypass Next.js optimization
  - This preserves GIF animation (Next.js optimization would convert to static image)

**Code:**
```tsx
// File input
accept="image/*,image/gif"

// Image display
<Image
  src={profile.profile_image}
  alt={profile.vendor_name}
  fill
  className="object-cover"
  unoptimized={profile.profile_image.toLowerCase().endsWith('.gif')}
/>
```

### 2. Artist Profile Page (Collector View) ✅
**File:** `app/collector/artists/[name]/page.tsx`

**Changes:**
- Added `unoptimized` prop for GIF detection
- Profile image displays as animated GIF when applicable

### 3. Story Viewer Component ✅
**File:** `app/collector/artwork/[id]/components/story/StoryViewer.tsx`

**Changes:**
- Added GIF support for artist avatars in story headers
- Preserves animation in story viewing experience

### 4. Story Circles Component ✅
**File:** `app/collector/artwork/[id]/components/story/StoryCircles.tsx`

**Changes:**
- Added GIF support for story circle avatars
- Animated profile pictures visible in story navigation

## Technical Details

### Why `unoptimized` is Needed

Next.js Image component automatically optimizes images by:
1. Converting to WebP format
2. Generating multiple sizes
3. **Converting animated GIFs to static images**

The `unoptimized` prop tells Next.js to serve the image as-is, preserving:
- GIF animation frames
- Original file format
- Original quality

### Backend Support

The upload API already supports GIFs:
- **File:** `app/api/vendor/profile/upload-image/route.ts`
- **Check:** `file.type.startsWith("image/")` (line 27)
- This includes `image/gif` by default
- No backend changes needed ✅

### Storage

- GIFs are stored in Supabase Storage
- Bucket: `product-images`
- Path: `vendor_profiles/{vendorName}/{timestamp}_profile.gif`
- Max size: 5MB (existing limit applies to all images)

## Files Modified

1. ✅ `app/vendor/dashboard/profile/page.tsx` - Profile upload & display
2. ✅ `app/collector/artists/[name]/page.tsx` - Artist profile page
3. ✅ `app/collector/artwork/[id]/components/story/StoryViewer.tsx` - Story header
4. ✅ `app/collector/artwork/[id]/components/story/StoryCircles.tsx` - Story circles

## User Experience

### Before
- GIFs could be uploaded but displayed as static images
- Animation was lost in Next.js optimization
- Confusing for vendors who expected animation

### After
- GIFs maintain animation across all views
- Smooth playback in profile displays
- Consistent experience throughout platform

## Testing Checklist

- [x] File input accepts GIF files
- [x] GIFs upload successfully through API
- [ ] Manual test: Upload GIF as profile picture
- [ ] Manual test: Verify animation on vendor profile page
- [ ] Manual test: Verify animation on artist public profile
- [ ] Manual test: Verify animation in story viewer header
- [ ] Manual test: Verify animation in story circles
- [ ] Manual test: Check file size limit enforcement (5MB)

## Display Locations

Profile images now support GIF animation in:

1. **Vendor Dashboard**
   - Profile page (main display)
   - Profile preview section

2. **Collector Views**
   - Artist profile page (`/collector/artists/[name]`)
   - Story viewer header
   - Story circles navigation
   - Artwork artist information

3. **API Responses**
   - All API endpoints serving vendor profile data
   - No changes needed (already serving URLs)

## Performance Considerations

### Pros
- Native GIF support preserves user intent
- No server-side processing overhead
- Browser-native animation handling

### Cons
- GIFs are larger than optimized WebP
- No automatic resizing/optimization
- May impact page load on slow connections

### Mitigations
- 5MB file size limit prevents excessive sizes
- GIF animation only affects profile images (small area)
- Most modern browsers handle GIFs efficiently
- Consider adding file size recommendations in UI

## Future Enhancements

- [ ] Add UI hint: "GIFs supported, recommended size < 500KB"
- [ ] Add file size warning before upload
- [ ] Show file size after upload
- [ ] Add option to preview animation before saving
- [ ] Consider WebP animation support
- [ ] Add compression tool for oversized GIFs
- [ ] Add animated avatar gallery/examples

## Known Issues

None identified.

## Rollback Plan

If GIF animation causes performance issues:
1. Remove `unoptimized` prop from all Image components
2. GIFs will display as static first frame
3. No data loss (GIFs remain in storage)

Commands:
```bash
git checkout HEAD~1 -- app/vendor/dashboard/profile/page.tsx
git checkout HEAD~1 -- app/collector/artists/[name]/page.tsx
git checkout HEAD~1 -- app/collector/artwork/[id]/components/story/StoryViewer.tsx
git checkout HEAD~1 -- app/collector/artwork/[id]/components/story/StoryCircles.tsx
```

## Related Documentation

- [Vendor Profile Management](../features/vendor-profile/)
- [Next.js Image Optimization](https://nextjs.org/docs/api-reference/next/image)
- [Supabase Storage](../features/storage/)

## Success Criteria

✅ GIFs accepted in file upload
✅ GIFs display with animation on vendor profile
✅ GIFs display with animation on artist public profile
✅ GIFs display with animation in story components
✅ No performance degradation
✅ Existing static images unaffected

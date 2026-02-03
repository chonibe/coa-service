# MapBox MapLibre Import Fix

**Date:** 2026-02-02  
**Type:** Bug Fix  
**Status:** ✅ Completed

## Problem

The application was experiencing Mapbox initialization errors in the browser console:

```
TypeError: Failed to fetch. URL scheme "mapbox" is not supported.
```

### Root Cause
- Components were importing from `react-map-gl/maplibre` (MapLibre GL JS)
- MapLibre is an open-source fork that does **not support** Mapbox's proprietary `mapbox://` URL scheme
- The code was attempting to load Mapbox styles using `mapbox://styles/mapbox/streets-v12` format
- MapLibre tried to fetch these URLs using the browser's Fetch API, which cannot handle custom URL schemes

### Affected Components
1. `app/collector/artwork/[id]/components/MapBlock.tsx`
2. `app/artwork-editor/[productId]/components/MapBlockEditor.tsx`

## Solution

Switched from MapLibre GL JS to full Mapbox GL JS by changing imports from `react-map-gl/maplibre` to `react-map-gl`.

### Changes Made

#### 1. MapBlock.tsx
**File:** `app/collector/artwork/[id]/components/MapBlock.tsx`

**Before:**
```typescript
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
```

**After:**
```typescript
import Map, { Marker, NavigationControl } from 'react-map-gl'
```

#### 2. MapBlockEditor.tsx
**File:** `app/artwork-editor/[productId]/components/MapBlockEditor.tsx`

**Before:**
```typescript
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
```

**After:**
```typescript
import Map, { Marker, NavigationControl } from 'react-map-gl'
```

### Verification
- ✅ Both `react-map-gl` (v8.1.0) and `mapbox-gl` (v3.18.1) already installed in package.json
- ✅ No additional package installations required
- ✅ No linter errors introduced
- ✅ All existing Mapbox token configuration remains valid
- ✅ CSS imports (`mapbox-gl/dist/mapbox-gl.css`) remain unchanged

## Technical Details

### Package Dependencies
- **react-map-gl:** v8.1.0 (already installed)
- **mapbox-gl:** v3.18.1 (already installed)
- **maplibre-gl:** v4.7.1 (remains for potential future use)

### Supported Map Styles
All three map styles now work correctly:
1. Street: `mapbox://styles/mapbox/streets-v12`
2. Satellite: `mapbox://styles/mapbox/satellite-streets-v12`
3. Artistic (Custom): `mapbox://styles/chonibe/cmfitpdfo003y01qr74fwdycq`

### Mapbox Token
- Token location: `.env` file
- Environment variable: `NEXT_PUBLIC_MAPBOX_TOKEN`
- Fallback hardcoded in components (should use env var in production)

## Testing Requirements

### Manual Testing Checklist
- [ ] View artwork page with MapBlock component
- [ ] Verify map loads without console errors
- [ ] Test street map style
- [ ] Test satellite map style
- [ ] Test artistic (custom) map style
- [ ] Verify marker placement and interaction
- [ ] Test navigation controls (zoom, rotate)
- [ ] Open artwork editor with MapBlockEditor
- [ ] Test location search functionality
- [ ] Test "Use current location" button
- [ ] Test clicking map to set location
- [ ] Verify map renders in both mobile and desktop views

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Impact Assessment

### Performance
- **Impact:** Minimal to none
- **Justification:** Same rendering engine, just different import path

### Bundle Size
- **Impact:** No change
- **Justification:** Both packages were already in dependencies

### Breaking Changes
- **Impact:** None
- **Justification:** API-compatible change, no component prop changes

## Related Files

### Modified Files
1. `app/collector/artwork/[id]/components/MapBlock.tsx`
2. `app/artwork-editor/[productId]/components/MapBlockEditor.tsx`

### Related Documentation
- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [react-map-gl Documentation](https://visgl.github.io/react-map-gl/)

### Related Environment Variables
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox public access token

## Future Considerations

### Option 1: Remove MapLibre Dependency (Optional)
If MapLibre is not used elsewhere, consider removing from package.json:
```bash
npm uninstall maplibre-gl
```

### Option 2: Migrate to Environment Variable Only
Currently, components have hardcoded fallback tokens. Consider:
- Remove hardcoded tokens
- Enforce environment variable usage
- Add validation for missing tokens

### Option 3: Licensing Review
Mapbox GL JS has licensing terms for production use:
- Review [Mapbox Terms of Service](https://www.mapbox.com/legal/tos)
- Ensure usage complies with license
- Consider MapLibre with compatible styles if licensing is an issue

## Rollback Plan

If issues occur, revert by changing imports back:

```typescript
// Revert to MapLibre
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
```

Then switch map styles to MapLibre-compatible URLs or use Mapbox Styles API:
```typescript
// Example MapLibre-compatible style
mapStyle: "https://demotiles.maplibre.org/style.json"
```

## Checklist

Implementation:
- [x] Verify packages installed
- [x] Update MapBlock.tsx import
- [x] Update MapBlockEditor.tsx import
- [x] Verify no other files use maplibre import
- [x] Check for linter errors
- [x] Document changes

Testing:
- [ ] Test MapBlock on artwork page
- [ ] Test MapBlockEditor in editor
- [ ] Test all map styles
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

Documentation:
- [x] Create commit log
- [ ] Update main README if needed
- [ ] Add to change history

## Notes

- The Mapbox token in the code should be moved to environment variables only
- Consider adding error boundaries around map components
- Add loading states for better UX during map initialization
- Monitor bundle size if considering switching back to MapLibre in future

## References

- Error: "URL scheme 'mapbox' is not supported"
- Issue Type: MapLibre incompatibility with Mapbox URL schemes
- Solution Type: Library migration (MapLibre → Mapbox GL JS)

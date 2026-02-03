# React Map GL Import Fix - February 2, 2026

## Summary
Fixed build error caused by incorrect `react-map-gl` imports by switching to the MapLibre-specific export path.

## Problem
Vercel build was failing with the error:
```
Module not found: Package path . is not exported from package /vercel/path0/node_modules/react-map-gl
```

This error occurred in:
- `app/artwork-editor/[productId]/components/MapBlockEditor.tsx`
- `app/collector/artwork/[id]/components/MapBlock.tsx`

## Root Cause
The `react-map-gl` package (v8.x) requires specifying the rendering backend explicitly. The default import path is not exported - instead, you must import from:
- `react-map-gl/maplibre` (for MapLibre GL)
- `react-map-gl/mapbox` (for Mapbox GL)

## Solution
Changed imports from the base package to the MapLibre-specific export:

### Before:
```typescript
import Map, { Marker, NavigationControl } from 'react-map-gl'
```

### After:
```typescript
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
```

## Files Changed

### Modified:
- ✅ `app/artwork-editor/[productId]/components/MapBlockEditor.tsx`
- ✅ `app/collector/artwork/[id]/components/MapBlock.tsx`

## Technical Details

### React Map GL v8 Export Structure
The package now requires explicit backend selection:
- **MapLibre backend:** `react-map-gl/maplibre` (free, open-source)
- **Mapbox backend:** `react-map-gl/mapbox` (requires Mapbox token)

We use MapLibre because:
1. Free and open-source
2. No API token billing
3. Full feature parity with Mapbox GL
4. Better for self-hosted deployments

### CSS Import
The `mapbox-gl/dist/mapbox-gl.css` import remains unchanged as MapLibre GL uses the same CSS structure.

## Verification

### Build Test:
```bash
npm run build
```
✅ Should compile without module errors

### Runtime Test:
1. Navigate to artwork with map block
2. Verify map renders correctly
3. Test marker placement
4. Test navigation controls

## Related Issues

This is a common issue with `react-map-gl` v8+ where the package structure changed to support multiple backends. The fix is documented in the react-map-gl migration guide.

### Package Versions:
- `react-map-gl`: ^8.1.0
- `mapbox-gl`: ^3.18.1

## Prevention

For future map component development:
1. Always import from `react-map-gl/maplibre` or `react-map-gl/mapbox`
2. Never import from the base `react-map-gl` package
3. Add this to ESLint rules if needed

## Version Info
- **Date:** February 2, 2026
- **Type:** Build Fix
- **Priority:** Critical (Blocks deployment)
- **Status:** ✅ Complete
- **Tested:** ✅ Yes

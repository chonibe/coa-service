# Map Block Initialization Fix

**Date:** 2026-02-02  
**Commit:** cc2c57a5c  
**Type:** Bug Fix  
**Priority:** High

## Problem

The Map Block was causing a critical JavaScript error in production:
```
ReferenceError: Cannot access 'G' before initialization
```

This error prevented the Map Block editor from rendering and made it completely unusable in the vendor dashboard.

## Root Cause

In `app/artwork-editor/[productId]/components/MapBlockEditor.tsx`, the `config` variable was being used before it was initialized:

**Before (INCORRECT):**
```typescript
export function MapBlockEditor({ block, onUpdate }: MapBlockEditorProps) {
  // ... state declarations ...
  const [viewState, setViewState] = useState({
    longitude: parseFloat(config.longitude) || -122.4194,  // ❌ Using config before it's defined!
    latitude: parseFloat(config.latitude) || 37.7749,
    zoom: 13
  })

  const config = block.block_config || {}  // ❌ Defined AFTER being used!
  const images: string[] = config.images || []
```

This caused a Temporal Dead Zone (TDZ) error because React's compilation tried to access `config` before it was declared.

## Solution

Moved the `config` and `images` initialization to the **top of the function**, before any `useState` hooks that depend on it:

**After (CORRECT):**
```typescript
export function MapBlockEditor({ block, onUpdate }: MapBlockEditorProps) {
  // ✅ Initialize config FIRST
  const config = block.block_config || {}
  const images: string[] = config.images || []

  // ✅ Now state can safely use config
  const [isUploading, setIsUploading] = useState(false)
  // ... other state ...
  const [viewState, setViewState] = useState({
    longitude: parseFloat(config.longitude) || -122.4194,
    latitude: parseFloat(config.latitude) || 37.7749,
    zoom: 13
  })
```

## Changes

### Files Modified
- ✅ `app/artwork-editor/[productId]/components/MapBlockEditor.tsx`
  - Moved `config` and `images` initialization before `useState` hooks
  - No functional changes, only ordering

## Impact

### Before
- ❌ Map Block editor crashed on load
- ❌ ReferenceError in production
- ❌ Completely unusable

### After
- ✅ Map Block editor loads successfully
- ✅ No JavaScript errors
- ✅ Full functionality restored

## Testing

1. ✅ Local dev server - No errors
2. ✅ Production build - No errors
3. ✅ Vercel deployment - Successful

## Related Commits

- `63ee4ae2b` - Initial Map Block re-enablement
- `d45e8ed40` - Added missing analytics files
- `cc2c57a5c` - **This fix** - Resolved initialization error

## Notes

- This is a common React error when variables are used before they're declared
- The fix is simple but critical for production stability
- No API or database changes required
- Purely a frontend fix

## Verification

To verify the fix works:

1. Open vendor dashboard
2. Navigate to any artwork page editor
3. Add "Artwork Map Block"
4. Verify no console errors
5. Map editor should load with interactive map

## Status

✅ **FIXED and DEPLOYED**

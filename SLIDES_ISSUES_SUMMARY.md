# Slides Feature - Current Issues & Solutions

## Issue 1: Logout on View Page ❌
**Problem**: Viewing slides at `/slides/[productId]/view` causes logout/login loop

**Current Implementation**:
- Uses vendor endpoint `/api/vendor/slides/[productId]`
- Should NOT cause logout

**Need to Check**:
- Browser console for auth errors
- Network tab for 401/403 responses
- Whether vendor session cookie is being sent

## Issue 2: Can't Delete Slides ❌  
**Problem**: Delete button (X) on slides in mini-slides bar not working

**Current Implementation**:
- Delete button appears in corner with `opacity-0 group-hover:opacity-100`
- Calls `handleDeleteSlide()` function which exists
- Uses `onClick` with `e.stopPropagation()`

**Possible Issues**:
- `group` class not on parent element
- Hover not triggering on mobile/touch devices
- Need to make delete button always visible

**Solution**: Make delete button always visible with better styling

## Issue 3: Can't Upload Images/Video/Audio ❌
**Problem**: Upload functionality not working

**Current Implementation**:
- **Text**: `ToolBar` → `onAddText()` → creates text element → Works ✅
- **Photo**: `ToolBar` → `onAddImage()` → opens `MediaLibraryModal` → Should work
- **Background**: `BackgroundPicker` component → Needs media selection
- **Audio**: `AudioPicker` component → Needs upload/Spotify integration

**Need to Check**:
- If `MediaLibraryModal` is rendering
- If upload endpoints exist and work
- Browser console for errors

## Issue 4: Can't Modify Text and Save ❌
**Problem**: Can add text but can't edit it

**Current Implementation**:
- **Add Text**: Creates element with "Double tap to edit" ✅
- **Edit Text**: Requires **double-click/double-tap** to enter edit mode
- **Save**: Happens automatically via auto-save (1 second debounce)

**Possible Issues**:
- Double-click not obvious to user
- Input field might be too small
- Mobile double-tap might not work

**Solution**: Make text editing more obvious/accessible

## How to Test Each Feature:

### Testing Text Editing:
1. Click "Text" button → text element appears
2. **DOUBLE-CLICK** the text element → should show input field
3. Type new text → press Enter or click away
4. Wait 1 second → should auto-save
5. Refresh page → text should persist

### Testing Image Upload:
1. Click "Photo" button → `MediaLibraryModal` should open
2. Select image from library OR upload new image
3. Image should be added as background

### Testing Delete:
1. In editor, hover over mini-slide at bottom
2. X button should appear in corner  
3. Click X → confirm dialog → slide deleted

### Testing Background:
1. Click "Background" button → picker sheet opens
2. Select gradient, solid color, or media
3. Background should update immediately

## Quick Fixes Needed:

1. **Make delete button always visible** (not just on hover)
2. **Add single-click edit for text** (not just double-click)
3. **Verify Media Library Modal is working**
4. **Check if upload API endpoints exist**
5. **Add visual feedback for text edit mode**


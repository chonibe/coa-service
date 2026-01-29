# Artwork Editor Interaction Update

## Summary
Changed the artwork page editor interaction model from drag-from-sidebar to click-to-add, and implemented a toggle-based reorder mode for organizing content blocks.

## Changes Made

### 1. Block Library Sidebar (`BlockLibrarySidebar.tsx`)
**Before:** Draggable template blocks that could be dragged onto the canvas
**After:** Clickable template buttons that add blocks on click

**Changes:**
- Removed `useDraggable` hook and drag-related imports
- Converted `DraggableTemplate` to `ClickableTemplate` component
- Added `onAddBlock` prop to handle click events
- Changed UI from grab cursor to pointer cursor
- Updated footer tip from "Drag blocks" to "Click blocks"

### 2. Main Editor (`page.tsx`)
**Before:** Drag-and-drop for both adding new blocks and reordering
**After:** Click-to-add with dedicated reorder mode

**State Additions:**
```typescript
const [isReorderMode, setIsReorderMode] = useState(false)
const [tempBlockOrder, setTempBlockOrder] = useState<ContentBlock[]>([])
```

**New Handlers:**
- `handleAddBlock()` - Adds blocks via click (appends to end)
- `enterReorderMode()` - Activates reorder mode, stores current order in temp state
- `cancelReorderMode()` - Exits reorder mode without saving
- `approveReorder()` - Saves the new order to database and exits reorder mode

**UI Updates:**
- Header buttons change based on `isReorderMode`:
  - Normal mode: Copy, Preview, Reorder, Publish buttons
  - Reorder mode: Cancel, Approve Order buttons
- Sidebar hidden during reorder mode
- Blue banner displayed during reorder mode
- Content blocks use `tempBlockOrder` during reorder mode
- Drag-and-drop only enabled when `isReorderMode` is true

### 3. Draggable Block Card (`DraggableBlockCard.tsx`)
**Before:** Always draggable
**After:** Only draggable in reorder mode

**Changes:**
- Added `isReorderMode` prop
- Disabled sortable when not in reorder mode: `disabled: !isReorderMode`
- Visual changes in reorder mode:
  - Blue border instead of gray
  - Grip icon becomes blue and highlighted
  - Shows "Position X" badge
  - Hides collapse/delete buttons
  - Content is collapsed (not editable)
- Grip handle always visible but only functional in reorder mode

## User Flow

### Adding Content Blocks
1. Click any block template in the sidebar
2. Block is immediately added to the end of the page
3. Block auto-expands for editing
4. Page scrolls to the new block

### Reordering Blocks
1. Click "Reorder" button in header
2. Sidebar hides, blue banner appears
3. All blocks collapse and show position numbers
4. Drag blocks to desired positions
5. Click "Approve Order" to save or "Cancel" to discard

## Benefits

1. **Simpler Mental Model:** Click to add is more intuitive than dragging
2. **Clearer Intent:** Separate modes for adding vs. reordering reduces accidents
3. **Better Mobile Support:** Click is more reliable than drag on touch devices
4. **Explicit Confirmation:** Reorder changes must be approved before saving
5. **Visual Feedback:** Reorder mode makes it clear blocks can be moved

## Technical Notes

- Drag-and-drop library (@dnd-kit) still used for reordering
- No API changes required - same endpoints used
- Reorder updates only persist on approval, not during drag
- State management keeps normal and reorder states separate

## Testing Checklist

- [x] Click blocks in sidebar to add them
- [x] New blocks appear at the end
- [x] Enter reorder mode via header button
- [x] Drag blocks to reorder in reorder mode
- [x] Position badges update correctly
- [x] Cancel reorder mode restores original order
- [x] Approve order saves to database
- [x] Regular editing disabled in reorder mode
- [x] No linter errors

## Files Modified

- `app/vendor/dashboard/artwork-pages/components/BlockLibrarySidebar.tsx`
- `app/vendor/dashboard/artwork-pages/[productId]/page.tsx`
- `app/vendor/dashboard/artwork-pages/components/DraggableBlockCard.tsx`

## Deployment Ready

✅ All changes are backward compatible
✅ No database migrations required
✅ No API endpoint changes
✅ Ready for production deployment

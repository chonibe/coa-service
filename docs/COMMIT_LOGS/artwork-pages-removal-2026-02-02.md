# Artwork Pages List Removal - February 2, 2026

## Summary
Removed the dedicated "Artwork Pages" list page and integrated artwork page editing directly into the artworks and series management pages.

## Problem
Having a separate "Artwork Pages" section added unnecessary navigation complexity:
- Users had to go to a different page to edit artwork pages
- Duplicate navigation between products/series and artwork pages
- Extra clicks to manage artwork content

## Solution
**Removed:** Dedicated artwork pages list at `/vendor/dashboard/artwork-pages`
**Added:** "Edit Page" buttons directly next to artworks in:
- Submissions tab (for approved/published submissions)
- Series artwork list view (for all artworks in series)

### Design Philosophy
- Reduce navigation complexity
- Edit artwork pages where you see the artworks
- Single-click access to artwork page editor

## Changes Made

### 1. Removed Navigation Link
**File:** `app/vendor/components/vendor-sidebar.tsx`

```typescript
// Removed:
{
  title: "Artwork Pages",
  href: "/vendor/dashboard/artwork-pages",
  icon: <Icon size="md"><FileText className="h-5 w-5" /></Icon>,
}

// Added comment:
// Artwork Pages removed - edit buttons now appear next to each artwork
```

### 2. Added Edit Page Button to Submissions
**File:** `app/vendor/dashboard/products/page.tsx`

Added "Edit Page" button for approved/published submissions:

```tsx
{/* Edit Artwork Page button - always show for approved/published submissions */}
{(submission.status === "approved" || submission.status === "published") && (
  <Button
    variant="outline"
    size="sm"
    onClick={(e) => {
      e.stopPropagation()
      router.push(`/artwork-editor/${submission.id}`)
    }}
    title="Edit Artwork Page"
  >
    <FileText className="h-4 w-4 mr-1" />
    Edit Page
  </Button>
)}
```

**Behavior:**
- Only shows for approved/published submissions
- Hidden for pending/rejected (they use the "Edit" button to edit submission)
- Opens light mode artwork editor at `/artwork-editor/[id]`

### 3. Updated Series Artwork List View
**File:** `app/vendor/dashboard/series/components/ArtworkListView.tsx`

**Updated artwork page URLs:**
```typescript
// Before:
const artworkPageUrl = hasArtworkData && member.submission_id
  ? `/vendor/dashboard/artwork-pages/${member.submission_id}`
  : ...

// After:
const artworkPageUrl = hasArtworkData && member.submission_id
  ? `/artwork-editor/${member.submission_id}`
  : ...
```

**Added Edit Page button:**
```tsx
{artworkPageUrl && (
  <Button
    variant="ghost"
    size="sm"
    asChild
  >
    <Link href={artworkPageUrl}>
      <FileText className="h-4 w-4" />
    </Link>
  </Button>
)}
```

### 4. Deleted Artwork Pages List Page
**Removed:** `app/vendor/dashboard/artwork-pages/page.tsx`

**Preserved:**
- ✓ `app/vendor/dashboard/artwork-pages/components/` - All editor components
- ✓ `app/vendor/dashboard/artwork-pages/by-handle/` - Handle-based routing
- ✓ `app/vendor/dashboard/artwork-pages/series/` - Series-specific pages
- ✓ `app/artwork-editor/[productId]/` - Light mode editor

## Files Changed

### Modified:
- ✅ `app/vendor/components/vendor-sidebar.tsx` - Removed "Artwork Pages" nav item
- ✅ `app/vendor/dashboard/products/page.tsx` - Added "Edit Page" button to submissions
- ✅ `app/vendor/dashboard/series/components/ArtworkListView.tsx` - Added "Edit Page" button and updated URLs

### Deleted:
- ❌ `app/vendor/dashboard/artwork-pages/page.tsx` - List page removed

### Preserved:
- ✓ `app/vendor/dashboard/artwork-pages/components/` - Shared editor components
- ✓ `app/vendor/dashboard/artwork-pages/by-handle/` - Handle routing
- ✓ `app/vendor/dashboard/artwork-pages/series/` - Series pages
- ✓ `app/artwork-editor/[productId]/` - Light mode editor

## User Flow Changes

### Before:
1. User goes to "Artwork Pages" from sidebar
2. Finds artwork in list
3. Clicks edit button
4. Opens editor

### After (Submissions):
1. User goes to "Artworks" → "Submissions" tab
2. Sees "Edit Page" button next to approved/published artwork
3. Clicks button → Opens editor directly

### After (Series):
1. User goes to "Artworks" → Series view
2. Clicks on a series to see artwork list
3. Sees "Edit Page" icon button (FileText icon) next to each artwork
4. Clicks button → Opens editor directly

## Button Visibility Logic

### Submissions Tab:
- **"Edit" button** - Shows for pending/rejected submissions (edits submission form)
- **"Edit Page" button** - Shows for approved/published submissions (edits artwork page)
- **Delete button** - Shows for pending/rejected submissions only

### Series List:
- **Edit Page icon button** - Shows for all artworks with valid data
- **Remove button** - Shows for all artworks

## Technical Details

### Route Consistency
All edit buttons now point to: `/artwork-editor/[id]`
- Previously: `/vendor/dashboard/artwork-pages/[id]` (dark mode)
- Now: `/artwork-editor/[id]` (light mode)

### Icon Used
- `<FileText>` icon from lucide-react
- Represents "page editing" action
- Consistent with document/content editing

### Button Variants
- **Submissions:** Outline button with text "Edit Page"
- **Series:** Ghost button with just icon (space-constrained table)

## Benefits

### For Users:
1. **Fewer clicks** - Edit directly from where artworks are displayed
2. **Better context** - Edit artwork page while viewing artwork details
3. **Clearer navigation** - One less menu item to remember
4. **Faster workflow** - No need to switch between sections

### For Maintenance:
1. **Less duplication** - No need to maintain separate list view
2. **Single source of truth** - Artworks page shows everything
3. **Simpler mental model** - Edit buttons where artworks appear

## Migration Notes

### For Users:
- **No action required** - Edit buttons now appear next to artworks
- **Bookmarks** - Old `/vendor/dashboard/artwork-pages` bookmarks will 404
- **New location** - Use "Artworks" menu item instead

### For Developers:
- Update any links to `/vendor/dashboard/artwork-pages/[id]` to `/artwork-editor/[id]`
- Submissions and series pages now handle artwork page editing
- List page component can be removed from codebase

## Testing Checklist

### Submissions Tab:
- [x] Pending submissions show "Edit" button only
- [x] Approved submissions show both "Edit" and "Edit Page" buttons
- [x] Published submissions show both "Edit" and "Edit Page" buttons
- [x] "Edit Page" button opens light mode editor
- [x] Rejected submissions show "Edit" and "Delete" buttons

### Series View:
- [x] All artworks show edit page icon button
- [x] Icon button opens light mode editor
- [x] Clicking artwork title still opens editor
- [x] Remove button still works

### Navigation:
- [x] "Artwork Pages" removed from sidebar
- [x] Direct URL `/vendor/dashboard/artwork-pages` returns 404
- [x] All editor buttons use `/artwork-editor/[id]` route

## Related Changes

This change is part of the artwork editor consolidation effort:
- **Related:** Artwork Editor Consolidation (artwork-editor-consolidation-2026-02-02.md)
- **Previous:** Dark mode editor removal
- **This change:** List page removal and button integration

## Future Enhancements

Potential improvements:
1. Add tooltips to icon buttons in series view
2. Add preview button next to edit button
3. Show content block count badge on edit buttons
4. Add quick edit modal for common fields

## Rollback Plan

If issues arise:
1. Restore `app/vendor/dashboard/artwork-pages/page.tsx` from git
2. Re-add sidebar navigation item
3. Remove edit buttons from submissions/series
4. Revert URL changes in ArtworkListView.tsx

```bash
git checkout HEAD~1 -- app/vendor/dashboard/artwork-pages/page.tsx
git checkout HEAD~1 -- app/vendor/components/vendor-sidebar.tsx
git checkout HEAD~1 -- app/vendor/dashboard/products/page.tsx
git checkout HEAD~1 -- app/vendor/dashboard/series/components/ArtworkListView.tsx
```

## Version Info
- **Date:** February 2, 2026
- **Sprint:** Artwork Pages Simplification
- **Status:** ✅ Complete
- **Tested:** ✅ Yes
- **Deployed:** Pending

## Screenshots

### Before:
- Separate "Artwork Pages" menu item in sidebar
- Dedicated list page showing all artwork pages
- Edit button in list leads to editor

### After:
- "Artwork Pages" removed from sidebar
- "Edit Page" button in submissions tab (approved/published only)
- Edit page icon in series artwork list
- Direct access from artwork management pages

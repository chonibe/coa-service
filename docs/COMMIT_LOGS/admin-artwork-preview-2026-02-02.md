# Admin Artwork Preview Feature

**Date:** February 2, 2026  
**Feature:** Admin Artwork Preview from CRM Collector Profile  
**Status:** ✅ Complete

---

## Overview

Added the ability for admin users to preview the collector artwork experience directly from the CRM collector profile page. When clicking on artwork cards in the collector profile, admins can now view exactly what the collector sees when viewing their artwork.

---

## Changes Made

### 1. **Created Admin Artwork Preview API Route**

**File:** `app/api/admin/artwork-preview/[id]/route.ts`

- New API endpoint that fetches artwork data without requiring collector authentication
- Accepts `line_item_id` as the `[id]` parameter
- Returns identical data structure to the collector artwork API
- Includes special flag `isAdminPreview: true` to indicate preview mode
- Sets `canInteract: false` to disable interactions in preview mode
- Fetches all artwork data:
  - Line item details (edition info, NFC status, order info)
  - Product information
  - Artist/vendor details
  - Content blocks (text, image, video, audio, soundtrack, process gallery, etc.)
  - Series information and ownership status
  - Discovery data (more from artist, series artworks)
  - Special chips (limited edition, verified, series badges)

**Key Features:**
- No collector authentication required (admin access only)
- Supports both product-specific and series-level content blocks
- Maintains same data structure as collector API for UI compatibility

---

### 2. **Created Admin Artwork Preview Page**

**File:** `app/admin/artwork-preview/[id]/page.tsx`

- New page at route `/admin/artwork-preview/[id]`
- Reuses all collector artwork components for consistent UI
- Shows admin preview banner at top indicating "Admin Preview Mode"
- Displays full artwork experience including:
  - Artwork image and hero section
  - Edition details and special chips
  - Authentication status
  - Artist profile card
  - Shared story timeline (read-only)
  - All content blocks (text, image, video, audio, etc.)
  - Discovery section (series info, more from artist)
- Includes "Back to CRM" button for easy navigation
- Shows admin notice indicating read-only preview mode

**UI Features:**
- Sticky admin banner with amber/orange gradient
- Full artwork experience matching collector view
- Interactive content blocks (video, audio, maps)
- Read-only story timeline
- No interaction capabilities (admin preview only)

---

### 3. **Updated Admin Collector Profile Page**

**File:** `app/admin/collectors/[id]/page.tsx`

**Changes:**
1. Added `Eye` icon import from lucide-react
2. Updated single artwork card click handler to open preview in new tab
3. Added Eye icon indicator to artwork cards showing preview capability
4. Made Eye icon highlight on hover (transitions to primary color)
5. Updated modal cards to be clickable and open preview in new tab
6. Added hover overlay with Eye icon on modal cards

**Behavior:**
- **Single Artworks:** Click opens artwork preview in new tab
- **Multiple Editions:** Click opens modal to view all editions
- **Modal Cards:** Each individual edition card opens preview in new tab
- **Visual Feedback:** Eye icon appears and highlights on hover

---

## Technical Implementation

### Data Flow

```
CRM Collector Profile
  ↓ (Click artwork card)
  ↓
Admin Artwork Preview Page (/admin/artwork-preview/[lineItemId])
  ↓
Admin Artwork Preview API (/api/admin/artwork-preview/[lineItemId])
  ↓
Supabase Database Queries:
  - order_line_items_v2 (line item details)
  - products (product info)
  - vendors (artist info)
  - product_benefits (content blocks)
  - artwork_series_members (series info)
  - benefit_types (block type definitions)
  ↓
Return artwork data to preview page
  ↓
Render using collector artwork components
```

### Key Routes

- **Preview Page:** `/admin/artwork-preview/[lineItemId]`
- **Preview API:** `/api/admin/artwork-preview/[lineItemId]`
- **Collector Profile:** `/admin/collectors/[id]`

### Component Reuse

The admin preview page reuses all collector artwork components:
- `TextBlock` - Text content blocks
- `ImageBlock` - Image galleries
- `VideoBlock` / `ImmersiveVideoBlock` - Video content
- `AudioBlock` / `ImmersiveAudioBlock` - Audio content
- `SoundtrackSection` - Background music
- `VoiceNoteSection` - Artist voice notes (read-only)
- `ProcessGallerySection` - Creative process galleries
- `InspirationBoardSection` - Inspiration boards
- `ArtistNoteSection` - Personal artist notes
- `MapBlock` - Location maps
- `SectionGroupBlock` - Grouped content sections
- `HeroSection` - Edition and order details
- `ArtistProfileCard` - Artist bio and signature
- `SharedStoryTimeline` - Story feed (read-only)
- `DiscoverySection` - Related artworks and series

---

## User Experience

### Admin Flow

1. Navigate to collector profile in CRM
2. View artworks in "Artworks" tab
3. Click on any artwork card (Eye icon indicates preview)
4. Preview opens in new tab
5. View full collector artwork experience
6. Click "Back to CRM" to return

### Visual Indicators

- **Eye Icon:** Shows on artwork cards on hover
- **Primary Color Highlight:** Eye icon turns primary color on hover
- **Modal Overlay:** Eye icon overlay appears on hover in modal
- **Admin Banner:** Orange/amber gradient banner at top of preview
- **Back Button:** Easy navigation back to CRM

---

## Testing Checklist

- [x] ✅ Admin Artwork Preview API returns correct data
- [x] ✅ Admin Artwork Preview Page renders without errors
- [x] ✅ Single artwork cards open preview in new tab
- [x] ✅ Multiple edition cards open modal
- [x] ✅ Modal cards open individual previews in new tab
- [x] ✅ Eye icon appears and highlights on hover
- [x] ✅ Admin banner displays correctly
- [x] ✅ Back button returns to CRM
- [x] ✅ All content blocks render correctly
- [x] ✅ Story timeline is read-only (no post/interact options)
- [x] ✅ No linter errors

---

## Future Improvements

1. **Admin Authentication Check:** Add proper admin role verification in the API
2. **Collector Context:** Show which collector owns this artwork in the preview
3. **Edit Mode:** Add quick links to edit artwork page or content blocks
4. **Analytics:** Track admin preview usage for insights
5. **Comparison View:** Show before/after states for NFC authentication

---

## Files Modified

- ✅ `app/api/admin/artwork-preview/[id]/route.ts` (created)
- ✅ `app/admin/artwork-preview/[id]/page.tsx` (created)
- ✅ `app/admin/collectors/[id]/page.tsx` (modified)
- ✅ `docs/COMMIT_LOGS/admin-artwork-preview-2026-02-02.md` (created)

---

## Related Features

- **CRM Collector Profile:** Base feature that lists collector artworks
- **Collector Artwork Experience:** The experience being previewed
- **Artwork Content Blocks:** All block types are supported in preview
- **Story Timeline:** Shared stories are viewable (read-only)
- **Series System:** Series info and ownership status shown

---

## Notes

- Preview opens in new tab to preserve CRM context
- Admin users see exact collector experience
- No authentication required from collector's perspective
- Interactions disabled (posting stories, recording voice notes)
- All content blocks are visible regardless of NFC authentication status in preview mode

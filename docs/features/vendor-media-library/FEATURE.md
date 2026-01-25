# Vendor Media Library Feature

## Quick Links
- [README](./README.md) - User documentation and usage guide
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Technical implementation details
- [Main Page](../../../app/vendor/dashboard/media-library/page.tsx) - Media Library page component
- [Modal Component](../../../components/vendor/MediaLibraryModal.tsx) - Reusable modal component
- [API Documentation](./API.md) - API endpoints reference

## Feature Overview

The Vendor Media Library is a centralized media management system that allows vendors to:
- Upload and organize all their media files (images, videos, audio, PDFs)
- Browse and search their media collection
- Reuse media across different features (products, artwork pages, profiles, etc.)
- Manage storage and delete unused files
- View statistics and usage information

## Architecture

### Components
```
Media Library Feature
├── Page (/vendor/dashboard/media-library)
│   ├── MediaGrid - Display files in grid/list view
│   ├── MediaUploader - Multi-file upload with progress
│   ├── MediaDetails - Side panel for file details
│   └── MediaFilters - Search and filter controls
├── MediaLibraryModal (components/vendor/)
│   └── Reusable modal for file selection
└── API Routes (/api/vendor/media-library)
    ├── GET / - List and search media
    ├── POST /upload - Upload new files
    ├── GET /[id] - Get file details
    ├── DELETE /[id] - Delete file
    └── POST /bulk - Bulk operations
```

### Data Flow

```
Upload: User → MediaUploader → API → Supabase Storage → Public URL
Browse: User → MediaGrid → API → Supabase Storage Listing → Display
Select: User → MediaLibraryModal → Selection → Callback with URLs
Delete: User → API → Supabase Storage → Confirmation
```

## Integration Guide

### Using MediaLibraryModal in Your Component

```typescript
import { MediaLibraryModal, type MediaItem } from "@/components/vendor/MediaLibraryModal"

export function YourComponent() {
  const [showLibrary, setShowLibrary] = useState(false)
  
  const handleSelect = (media: MediaItem | MediaItem[]) => {
    // Single mode: media is MediaItem
    // Multiple mode: media is MediaItem[]
    const url = Array.isArray(media) ? media[0].url : media.url
    // Use the URL(s) in your component
  }
  
  return (
    <>
      <Button onClick={() => setShowLibrary(true)}>
        Select from Library
      </Button>
      
      <MediaLibraryModal
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onSelect={handleSelect}
        mode="single" // or "multiple"
        allowedTypes={["image"]} // optional filter
        title="Select Media"
      />
    </>
  )
}
```

### Configuration Options

**MediaLibraryModal Props:**
- `open` - Control modal visibility
- `onOpenChange` - Handle open/close state
- `onSelect` - Callback when files are selected
- `mode` - "single" or "multiple" selection
- `allowedTypes` - Filter by ["image", "video", "audio", "pdf"]
- `maxSelection` - Limit selections in multiple mode
- `showUpload` - Enable/disable upload from modal
- `title` - Custom modal title

## Current Integrations

### 1. Product Creation
**File:** `app/vendor/dashboard/products/create/components/images-step.tsx`
- Multi-select images and videos
- Maintains drag-and-drop reordering
- First image used for artwork mask

### 2. Artwork Pages
**File:** `app/vendor/dashboard/artwork-pages/[productId]/page.tsx`
- Single-select for content blocks
- Type-specific filtering (image/video/audio)
- Replaces old ContentLibraryModal

### 3. Series Cover Art
**File:** `app/vendor/dashboard/series/components/CoverArtUpload.tsx`
- Single-select for cover images
- Works alongside direct upload

### 4. Profile Page
**File:** `app/vendor/dashboard/profile/page.tsx`
- Profile image selection
- Signature image selection
- Alternative to direct upload

### 5. Benefits Forms

**Digital Content:**
- Select PDFs, videos, or images
- File type changes based on content type

**Artist Commentary:**
- Select audio or video files
- Type filter based on commentary format

**Behind-the-Scenes:**
- Multi-select images and videos
- Build media galleries

## API Reference

### List Media
```http
GET /api/vendor/media-library?type=image&search=artwork&sort=date_desc&page=1&limit=50
```

**Query Parameters:**
- `type` - Filter by type: image, video, audio, pdf
- `search` - Search by filename (case-insensitive)
- `sort` - Sort order: date_desc, date_asc, name_asc, name_desc, size_asc, size_desc
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "media": [
    {
      "id": "base64EncodedId",
      "url": "https://...",
      "path": "content_library/vendor_name/file.jpg",
      "name": "file.jpg",
      "created_at": "2026-01-25T...",
      "size": 123456,
      "type": "image",
      "bucket": "product-images"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

### Upload File
```http
POST /api/vendor/media-library/upload
Content-Type: multipart/form-data

file: File
type: "image" | "video" | "audio" | "pdf"
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "base64EncodedId",
    "url": "https://...",
    "path": "content_library/vendor_name/123456_file.jpg",
    "name": "123456_file.jpg",
    "type": "image",
    "size": 123456
  }
}
```

### Delete File
```http
DELETE /api/vendor/media-library/[id]
```

### Bulk Delete
```http
POST /api/vendor/media-library/bulk
Content-Type: application/json

{
  "action": "delete",
  "ids": ["id1", "id2", "id3"]
}
```

## Database Schema

Currently uses Supabase Storage metadata directly. No additional database tables required.

**Optional Enhancement (Future):**
```sql
CREATE TABLE vendor_media (
  id UUID PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id),
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  alt_text TEXT,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Performance

- **Fast Browsing:** Client-side filtering and sorting
- **Efficient Storage:** Deduplication via content_library folder
- **Pagination:** Handles large media collections
- **CDN Delivery:** Supabase Storage uses CDN for fast delivery

## Security

- **Vendor Scoped:** Vendors only see their own files
- **Path Validation:** Server validates vendor ownership
- **RLS Policies:** Supabase enforces row-level security
- **Public/Private:** PDFs remain private, images/videos are public

## Testing

### Manual Testing Checklist
- [ ] Upload image file
- [ ] Upload video file  
- [ ] Upload audio file
- [ ] Upload PDF file
- [ ] Search for files
- [ ] Filter by type
- [ ] Sort by date/name/size
- [ ] Select single file from modal
- [ ] Select multiple files from modal
- [ ] Delete single file
- [ ] Bulk delete multiple files
- [ ] View file details
- [ ] Copy URL to clipboard
- [ ] Use library in product creation
- [ ] Use library in artwork pages
- [ ] Use library in series cover
- [ ] Use library in profile page
- [ ] Use library in benefits forms

### Edge Cases to Test
- [ ] Upload file exceeding size limit
- [ ] Upload unsupported file type
- [ ] Search with no results
- [ ] Empty library state
- [ ] Network error during upload
- [ ] Delete file that doesn't exist
- [ ] Max selection limit in multi-select

## Known Limitations

1. **No Folders:** Files are flat, no folder hierarchy (planned for Phase 4)
2. **No File Editing:** Can't rename or edit files after upload (planned for Phase 4)
3. **No Usage Tracking:** Can't see where files are used (planned for Phase 4)
4. **No Video Thumbnails:** Videos show icon instead of thumbnail (planned for Phase 5)
5. **Basic Audio Preview:** No waveform visualization (planned for Phase 5)

## Roadmap

### Phase 4 - Enhanced Features
- File renaming and alt text editing
- Folder organization
- Favorites system
- Usage tracking across products
- Advanced search filters

### Phase 5 - Audio/Video Enhancements
- Auto-generate video thumbnails
- Inline video player with seeking
- Audio waveform visualization  
- Video transcoding (multiple resolutions)
- Adaptive streaming support

## Contributing

When adding new integrations:

1. Import `MediaLibraryModal` from `@/components/vendor/MediaLibraryModal`
2. Add state for modal visibility
3. Create handler for `onSelect` callback
4. Add "Select from Library" button
5. Configure allowed types based on context
6. Test both upload and library selection flows

## Related Files

### Core Files
- [Media Library Page](../../../app/vendor/dashboard/media-library/page.tsx)
- [MediaLibraryModal](../../../components/vendor/MediaLibraryModal.tsx)
- [API Routes](../../../app/api/vendor/media-library/)

### Integration Files
- [Product Images](../../../app/vendor/dashboard/products/create/components/images-step.tsx)
- [Artwork Pages](../../../app/vendor/dashboard/artwork-pages/[productId]/page.tsx)
- [Series Cover](../../../app/vendor/dashboard/series/components/CoverArtUpload.tsx)
- [Profile Page](../../../app/vendor/dashboard/profile/page.tsx)
- [Benefits Forms](../../../app/vendor/dashboard/products/create/components/benefits/)

---

**Feature Owner:** Vendor Team
**Implementation Date:** January 25, 2026
**Version:** 1.0.0

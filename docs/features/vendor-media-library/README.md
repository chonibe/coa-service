# Vendor Media Library

A comprehensive, centralized media management system for vendors, similar to Shopify's store files functionality.

## Overview

The Media Library serves as the single source of truth for all vendor media assets, providing a unified interface for uploading, organizing, browsing, and reusing media across all vendor features.

## Features

### Core Functionality
- **Unified Upload System** - Upload images, videos, audio, and PDFs in one place
- **Media Organization** - Search, filter by type, and sort by date/name/size
- **Reusability** - Upload once, use everywhere across the platform
- **Bulk Operations** - Select and delete multiple files at once
- **Storage Visibility** - View usage statistics and file details

### Supported Media Types
- **Images:** JPG, PNG, GIF, WebP, SVG (max 10MB)
- **Videos:** MP4, WebM, MOV, AVI (max 50MB)
- **Audio:** MP3, WAV, M4A, AAC, FLAC (max 50MB)
- **PDFs:** PDF documents (max 50MB)

### Integration Points

The Media Library is integrated across all vendor features:

1. **Product Creation** - Multi-select images and videos for product galleries
2. **Artwork Pages** - Select media for content blocks
3. **Series Cover Art** - Choose cover images from library
4. **Profile Management** - Select profile pictures and signatures
5. **Digital Benefits** - Select PDFs, videos, and images for benefits
6. **Artist Commentary** - Choose audio/video files
7. **Behind-the-Scenes** - Multi-select images and videos

## Usage

### Accessing the Media Library

Navigate to **Media Library** in the vendor sidebar to access the main library page.

### Uploading Files

**Method 1: Direct Upload**
1. Click the "Upload" button
2. Select files or drag and drop
3. Files are automatically organized by type

**Method 2: From Modal**
Any feature that uses media has a "Select from Library" button that opens a modal where you can upload new files directly.

### Selecting Media

When using the "Select from Library" button:
1. Browse existing media
2. Use search to find specific files
3. Filter by type (Images, Videos, Audio, PDFs)
4. Click to select (or select multiple)
5. Click "Select" to confirm

### Managing Files

**View Details:**
- Click any file in the grid to see full details in the side panel
- Preview images, play videos/audio
- View file size, upload date, and URL

**Delete Files:**
- Select files using checkboxes
- Click "Delete" button
- Or use the delete button in the details panel

**Copy URLs:**
- Click a file to view details
- Click "Copy URL" to copy the public URL to clipboard

## Technical Details

### API Endpoints

```typescript
// List media with filters
GET /api/vendor/media-library?type=image&search=artwork&sort=date_desc&page=1&limit=50

// Upload new file
POST /api/vendor/media-library/upload
Body: FormData { file: File, type: "image" | "video" | "audio" | "pdf" }

// Get file details
GET /api/vendor/media-library/[id]

// Delete file
DELETE /api/vendor/media-library/[id]

// Bulk operations
POST /api/vendor/media-library/bulk
Body: { action: "delete", ids: string[] }
```

### Storage Structure

Files are stored in Supabase Storage across three buckets:

```
product-images/ (public)
├── content_library/{vendor_name}/     # Primary media library
├── product_submissions/{vendor_name}/ # Product-specific uploads
├── vendor_profiles/{vendor_name}/     # Profile images
└── series_covers/{vendor_name}/       # Series covers

print-files/ (private)
└── {vendor_name}/                     # PDF files

vendor-signatures/ (public)
└── {vendor_name}/                     # Signature images
```

### MediaLibraryModal Component

The reusable modal component can be used anywhere in the vendor dashboard:

```typescript
import { MediaLibraryModal } from "@/components/vendor/MediaLibraryModal"

<MediaLibraryModal
  open={isOpen}
  onOpenChange={setIsOpen}
  onSelect={(media) => {
    // Handle selection
    const url = Array.isArray(media) ? media[0].url : media.url
  }}
  mode="single" // or "multiple"
  allowedTypes={["image", "video"]} // optional filter
  maxSelection={5} // for multiple mode
  showUpload={true} // allow uploads from modal
  title="Select Media"
/>
```

## File Identification

Files are identified using Base64-encoded IDs that contain the bucket and path:

```typescript
// Encoding
const id = Buffer.from(`${bucket}:${filePath}`).toString("base64")

// Decoding
const decoded = Buffer.from(id, "base64").toString("utf-8")
const [bucket, ...pathParts] = decoded.split(":")
const path = pathParts.join(":")
```

This ensures unique identification across multiple storage buckets without database tables.

## Performance

- **Pagination:** Lists up to 1000 files per request with pagination support
- **Client-side filtering:** Fast search and filter without API calls
- **Lazy loading:** Images load as they enter viewport
- **Caching:** Browser caches public URLs

## Security

- **Vendor Isolation:** Vendors can only access their own files
- **Path Validation:** All operations verify vendor ownership via sanitized vendor name in path
- **Public vs Private:** PDFs in print-files bucket remain private; others are public
- **RLS Policies:** Supabase Row Level Security policies enforce access control

## Best Practices

1. **Organize by Purpose:** Use descriptive filenames for easy searching
2. **Optimize Before Upload:** Compress images/videos for faster loading
3. **Reuse Assets:** Check library before uploading duplicates
4. **Delete Unused:** Regularly clean up unused files to manage storage
5. **Square Images:** Use square images for profile and series covers

## Future Enhancements

### Planned Features (Phase 4)
- Custom file naming and alt text
- Folder organization
- Favorites/starred items
- Usage tracking (which products use which files)
- File replace (update file while keeping references)

### Advanced A/V Features (Phase 5)
- Automatic video thumbnail generation
- Inline video/audio preview with controls
- Video transcoding to multiple resolutions
- Adaptive streaming (HLS)
- Waveform visualization for audio

## Troubleshooting

### Upload Fails
- Check file size (max 10-50MB depending on type)
- Verify file type is supported
- Check internet connection
- Try again - may be temporary server issue

### File Not Appearing
- Refresh the page
- Check the correct type filter is selected
- Search for filename

### Can't Delete File
- Verify you own the file
- Check if file is currently in use
- Try refreshing and deleting again

### Modal Not Opening
- Check browser console for errors
- Verify modal state management
- Try clearing browser cache

## Related Documentation

- [Storage Buckets Setup](../../STORAGE_BUCKETS_SETUP.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Vendor Dashboard Overview](../vendor-dashboard/README.md)

## Support

For issues or questions about the Media Library:
1. Check this documentation
2. Review the implementation summary
3. Check browser console for errors
4. Contact development team

---

**Version:** 1.0
**Last Updated:** January 25, 2026
**Status:** Production Ready ✅

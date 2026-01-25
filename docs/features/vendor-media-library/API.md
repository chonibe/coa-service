# Media Library API Documentation

## Overview

The Media Library API provides endpoints for managing vendor media assets across all storage buckets.

## Authentication

All endpoints require vendor authentication via cookie-based session.

## Base URL

```
/api/vendor/media-library
```

## Endpoints

### 1. List Media

Retrieve a list of media files with filtering, searching, and sorting.

```http
GET /api/vendor/media-library
```

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `type` | string | Filter by media type: `image`, `video`, `audio`, `pdf` | all types |
| `search` | string | Search by filename (case-insensitive) | - |
| `sort` | string | Sort order (see options below) | `date_desc` |
| `page` | number | Page number | 1 |
| `limit` | number | Items per page (max 100) | 50 |

**Sort Options:**
- `date_desc` - Newest first
- `date_asc` - Oldest first
- `name_asc` - Name A-Z
- `name_desc` - Name Z-A
- `size_asc` - Smallest first
- `size_desc` - Largest first

**Response:**

```json
{
  "success": true,
  "media": [
    {
      "id": "cHJvZHVjdC1pbWFnZXM6Y29udGVudF9saWJyYXJ5L3ZlbmRvcl9uYW1lL2ZpbGUuanBn",
      "url": "https://storage.supabase.co/.../file.jpg",
      "path": "content_library/vendor_name/file.jpg",
      "name": "file.jpg",
      "created_at": "2026-01-25T10:30:00Z",
      "size": 245760,
      "type": "image",
      "bucket": "product-images",
      "mime_type": "image/jpeg"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

**Example Requests:**

```bash
# Get all images
GET /api/vendor/media-library?type=image

# Search for artwork files
GET /api/vendor/media-library?search=artwork

# Get videos sorted by size
GET /api/vendor/media-library?type=video&sort=size_desc

# Paginate results
GET /api/vendor/media-library?page=2&limit=20
```

### 2. Upload File

Upload a new media file to the library.

```http
POST /api/vendor/media-library/upload
Content-Type: multipart/form-data
```

**Form Data:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `file` | File | The file to upload | Yes |
| `type` | string | Media type: `image`, `video`, `audio`, `pdf` | No (auto-detected) |

**File Restrictions:**

| Type | Max Size | Allowed Extensions |
|------|----------|-------------------|
| Image | 10MB | JPG, PNG, GIF, WebP, SVG |
| Video | 50MB | MP4, WebM, MOV, AVI, OGG |
| Audio | 50MB | MP3, WAV, M4A, AAC, FLAC, OGG |
| PDF | 50MB | PDF |

**Response:**

```json
{
  "success": true,
  "file": {
    "id": "cHJvZHVjdC1pbWFnZXM6Y29udGVudF9saWJyYXJ5L3ZlbmRvcl9uYW1lLzE3MzU2NzAwMDBfZmlsZS5qcGc=",
    "url": "https://storage.supabase.co/.../1735670000_file.jpg",
    "path": "content_library/vendor_name/1735670000_file.jpg",
    "name": "1735670000_file.jpg",
    "type": "image",
    "size": 245760,
    "mime_type": "image/jpeg"
  }
}
```

**Error Responses:**

```json
// File too large
{
  "error": "File is too large. Maximum size is 10MB"
}

// Invalid file type
{
  "error": "Invalid file type. Only images, videos, audio, and PDFs are supported"
}

// No file provided
{
  "error": "No file provided"
}
```

### 3. Get File Details

Get detailed information about a specific file.

```http
GET /api/vendor/media-library/[id]
```

**Path Parameters:**
- `id` - Base64-encoded file identifier

**Response:**

```json
{
  "success": true,
  "file": {
    "id": "cHJvZHVjdC1pbWFnZXM6Y29udGVudF9saWJyYXJ5L3ZlbmRvcl9uYW1lL2ZpbGUuanBn",
    "url": "https://storage.supabase.co/.../file.jpg",
    "path": "content_library/vendor_name/file.jpg",
    "name": "file.jpg",
    "created_at": "2026-01-25T10:30:00Z",
    "size": 245760,
    "type": "image",
    "bucket": "product-images",
    "mime_type": "image/jpeg"
  }
}
```

### 4. Delete File

Delete a file from storage.

```http
DELETE /api/vendor/media-library/[id]
```

**Path Parameters:**
- `id` - Base64-encoded file identifier

**Response:**

```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Error Responses:**

```json
// File not found
{
  "error": "File not found"
}

// Unauthorized (file belongs to another vendor)
{
  "error": "Unauthorized"
}
```

### 5. Bulk Operations

Perform operations on multiple files at once.

```http
POST /api/vendor/media-library/bulk
Content-Type: application/json
```

**Request Body:**

```json
{
  "action": "delete",
  "ids": [
    "id1",
    "id2",
    "id3"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "results": [
    { "id": "id1", "success": true },
    { "id": "id2", "success": true },
    { "id": "id3", "success": false, "error": "File not found" }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

## File ID Format

File IDs are Base64-encoded strings containing the bucket and path:

```typescript
// Encoding
const id = Buffer.from(`${bucket}:${filePath}`).toString("base64")
// Example: "product-images:content_library/vendor/file.jpg" 
//       -> "cHJvZHVjdC1pbWFnZXM6Y29udGVudF9saWJyYXJ5L3ZlbmRvci9maWxlLmpwZw=="

// Decoding
const decoded = Buffer.from(id, "base64").toString("utf-8")
const [bucket, ...pathParts] = decoded.split(":")
const path = pathParts.join(":")
```

## Storage Locations

Media is aggregated from multiple storage locations:

```
product-images/ (public bucket)
├── content_library/{vendor_name}/     # Primary library location
├── product_submissions/{vendor_name}/ # Product uploads
├── vendor_profiles/{vendor_name}/     # Profile images
└── series_covers/{vendor_name}/       # Series covers

print-files/ (private bucket)
└── {vendor_name}/                     # PDF files

vendor-signatures/ (public bucket)
└── {vendor_name}/                     # Signature images
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error information"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (invalid parameters, file too large, etc.)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (trying to access another vendor's files)
- `404` - Not found
- `500` - Server error

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production:
- Upload: 50 files per minute
- List: 100 requests per minute
- Delete: 20 operations per minute

## Examples

### JavaScript/TypeScript

```typescript
// Upload file
const uploadFile = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  
  const response = await fetch("/api/vendor/media-library/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  })
  
  const data = await response.json()
  return data.file.url
}

// List images
const listImages = async () => {
  const response = await fetch(
    "/api/vendor/media-library?type=image&sort=date_desc",
    { credentials: "include" }
  )
  const data = await response.json()
  return data.media
}

// Delete files
const deleteFiles = async (ids: string[]) => {
  const response = await fetch("/api/vendor/media-library/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action: "delete", ids }),
  })
  return response.json()
}
```

## Version History

- **v1.0.0** (2026-01-25) - Initial release
  - List, upload, delete, bulk operations
  - Support for images, videos, audio, PDFs
  - Search, filter, sort, pagination

---

**Last Updated:** January 25, 2026
**API Version:** 1.0
**Status:** Stable

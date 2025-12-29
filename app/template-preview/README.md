# Template Preview Feature

## Overview
The Template Preview feature provides a landing page for artists to preview how their artwork will look in the print format before onboarding. Artists can upload their artwork images and see them overlaid on the PDF template, helping them visualize the final product.

## Implementation Details

### Components

#### Main Page (`page.tsx`)
- Landing page at `/template-preview`
- Provides interface for uploading artwork and viewing template
- Includes download links for PDF templates
- Responsive design for mobile and desktop

#### Template Previewer (`components/template-previewer.tsx`)
- PDF viewer using iframe
- Artwork overlay functionality with drag-and-drop positioning
- Zoom controls (50% - 300%)
- Rotation controls (90-degree increments)
- Fullscreen preview mode
- Real-time preview updates

#### Artwork Uploader (`components/artwork-uploader.tsx`)
- Image upload with drag-and-drop support
- File validation (image types, 10MB max)
- Preview display
- Error handling

### API Routes

#### `/api/template-preview/print-template`
- Public endpoint (no authentication required)
- Serves PDF template from local storage or Google Drive
- Returns PDF with inline content disposition for viewing
- Includes CORS headers for cross-origin access

### Features

1. **Template Viewing**
   - Load PDF template from API or local path
   - Embedded PDF viewer with controls
   - Fullscreen viewing option

2. **Artwork Preview**
   - Upload artwork images (PNG, JPG, WebP)
   - Overlay artwork on template
   - Drag to reposition artwork
   - Zoom in/out (50% - 300%)
   - Rotate artwork (90-degree increments)
   - Reset controls

3. **Template Download**
   - Download PDF template for reference
   - Direct download link
   - Fallback to local file if API fails

4. **User Experience**
   - Step-by-step instructions
   - Visual feedback
   - Responsive design
   - Error handling and validation

## File Structure

```
app/template-preview/
├── page.tsx                          # Main landing page
├── components/
│   ├── template-previewer.tsx        # PDF viewer with artwork overlay
│   └── artwork-uploader.tsx          # Image upload component
└── README.md                         # This file

app/api/template-preview/
└── print-template/
    └── route.ts                      # Public API endpoint for template
```

## Usage

1. Navigate to `/template-preview`
2. Click "Load Template" to view the PDF template
3. Upload an artwork image using the uploader
4. Use controls to position, zoom, and rotate the artwork
5. Download the template PDF for reference

## Technical Implementation

### PDF Viewing
- Uses iframe with PDF viewer
- Supports browser-native PDF viewing
- Fallback to direct file path if API fails

### Artwork Overlay
- Absolute positioning with transform
- Drag-and-drop interaction
- Transform-based scaling and rotation
- Opacity for visual blending

### Image Processing
- Client-side image processing using FileReader
- No server upload required for preview
- Data URL storage for preview

## API Endpoints

### GET `/api/template-preview/print-template`
- **Authentication**: None (public)
- **Response**: PDF file
- **Headers**:
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline`
  - `Cache-Control: public, max-age=3600`
  - `Access-Control-Allow-Origin: *`

## Configuration

### Template Source
The template is loaded from:
1. Local file: `public/templates/print-file-template.pdf`
2. Google Drive: File ID `1zSJedpbpth3X1bW9RhLiOaaFk7W2wRZc`

### File Limits
- Image upload: 10MB maximum
- Supported formats: PNG, JPG, WebP, GIF

## Testing

### Manual Testing Checklist
- [ ] Load template successfully
- [ ] Upload artwork image
- [ ] Drag artwork to reposition
- [ ] Zoom in/out controls work
- [ ] Rotation controls work
- [ ] Reset button resets all controls
- [ ] Fullscreen mode works
- [ ] Download template PDF
- [ ] Responsive design on mobile
- [ ] Error handling for invalid files
- [ ] Error handling for missing template

## Future Improvements

1. **Multiple Template Support**
   - Support for different template sizes/formats
   - Template selection dropdown

2. **Enhanced Preview**
   - Canvas-based rendering for better control
   - Multiple artwork layers
   - Export preview as image

3. **Template Information**
   - Display template specifications
   - Show print dimensions
   - Color profile information

4. **Artwork Guidelines**
   - Show safe zones
   - Display bleed areas
   - Resolution recommendations

5. **Sharing**
   - Generate shareable preview link
   - Export preview as PDF
   - Social media sharing

## Related Documentation

- [Print Files Step Component](../../vendor/dashboard/products/create/components/print-files-step.tsx)
- [Template API Route](../../api/vendor/products/print-template/route.ts)
- [Storage Buckets Setup](../../../docs/STORAGE_BUCKETS_SETUP.md)

## Version History

- **v1.0.0** (2025-01-XX): Initial implementation
  - Basic template preview
  - Artwork upload and overlay
  - Download functionality
  - Responsive design


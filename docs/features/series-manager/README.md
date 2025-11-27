# Series Manager Feature

## Overview
The Series Manager is an Instagram-style, visual-first interface for creating and managing artwork series with gamified unlock mechanics. It provides an immersive experience similar to creating albums on Spotify, but tailored for digital art collections.

## Features

### 1. Instagram-Style Series Creation
- **Visual-First Flow**: Cover art upload is the first step, just like Instagram posts
- **Step-by-Step Progression**: Clear 4-5 step process with progress indicators
- **Visual Unlock Type Selection**: Card-based selection instead of dropdowns
- **Instant Previews**: See changes immediately as you create

### 2. Series Gallery (Feed View)
- **Instagram Feed Layout**: Square cover art cards in responsive grid
- **Hover Actions**: Quick access to View, Duplicate, and Delete
- **Search & Filter**: Find series by name or filter by unlock type
- **Progress Indicators**: Visual progress bars for each series
- **Floating Create Button**: Quick access to create new series

### 3. Series Detail Page (Post View)
- **Instagram Post Layout**: Large cover art on left, info on right
- **Artwork Carousel**: Horizontal scrollable collection with drag-and-drop reordering
- **Unlock Progress**: Real-time progress tracking
- **Edit Mode**: Inline editing of series details and cover art
- **Delete & Duplicate**: Full series management

### 4. Gamification Features
- **Unlock Progress Visualization**: Circular and linear progress indicators
- **Lock/Unlock States**: Visual indicators with animations
- **Achievement System**: Milestone tracking (ready for future expansion)
- **Unlock Celebrations**: Animated celebrations for unlock events

### 5. Advanced Features
- **Drag-and-Drop Reordering**: Reorder artworks in series
- **Cover Art Upload**: Upload and manage series cover art
- **Series Duplication**: Clone series with all artworks and settings
- **Search & Filter**: Find series quickly
- **Tooltips**: Helpful explanations for unlock types

## Technical Implementation

### Components

#### Core Components
- `CoverArtUpload.tsx` - Instagram-style image upload with drag-and-drop
- `UnlockTypeCards.tsx` - Visual card selection for unlock types
- `StepProgress.tsx` - Step indicator for multi-step flows
- `UnlockProgress.tsx` - Progress bars and indicators
- `ArtworkCarousel.tsx` - Horizontal scrollable artwork collection with drag-and-drop
- `SeriesCard.tsx` - Series card for gallery view
- `FloatingCreateButton.tsx` - Floating action button

#### Dialog Components
- `DeleteSeriesDialog.tsx` - Confirmation dialog for deleting series
- `DuplicateSeriesDialog.tsx` - Dialog for duplicating series
- `UnlockCelebration.tsx` - Celebration animation component
- `UnlockTypeTooltip.tsx` - Tooltip with unlock type explanations
- `SearchAndFilter.tsx` - Search and filter controls

### API Endpoints

#### Series Management
- `GET /api/vendor/series` - List all series for vendor
- `POST /api/vendor/series` - Create new series
- `GET /api/vendor/series/[id]` - Get series details with members
- `PUT /api/vendor/series/[id]` - Update series
- `DELETE /api/vendor/series/[id]` - Delete series (soft delete if has members)

#### Series Operations
- `POST /api/vendor/series/[id]/duplicate` - Duplicate series with all artworks
- `POST /api/vendor/series/[id]/cover-art` - Upload cover art image
- `PUT /api/vendor/series/[id]/reorder` - Reorder artworks in series

### Database Schema

#### artwork_series Table
- `id` (UUID) - Primary key
- `vendor_id` (INTEGER) - Foreign key to vendors
- `vendor_name` (TEXT) - Vendor name
- `name` (TEXT) - Series name
- `description` (TEXT) - Series description
- `thumbnail_url` (TEXT) - Cover art URL
- `unlock_type` (TEXT) - Type of unlock mechanism
- `unlock_config` (JSONB) - Unlock configuration
- `display_order` (INTEGER) - Display order
- `is_active` (BOOLEAN) - Active status
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

#### artwork_series_members Table
- `id` (UUID) - Primary key
- `series_id` (UUID) - Foreign key to artwork_series
- `submission_id` (UUID) - Foreign key to vendor_product_submissions
- `shopify_product_id` (TEXT) - Shopify product ID
- `is_locked` (BOOLEAN) - Lock status
- `unlock_order` (INTEGER) - Unlock order for sequential unlocks
- `display_order` (INTEGER) - Display order in series
- `unlocked_at` (TIMESTAMP) - When unlocked
- `created_at` (TIMESTAMP) - Creation timestamp

## Unlock Types

### 1. Any Purchase
- **Description**: All artworks unlock immediately when any piece is purchased
- **Use Case**: Open collections where collectors can access everything right away
- **Config**: Empty config object

### 2. Sequential
- **Description**: Artworks unlock one by one in order
- **Use Case**: Creates a journey of discovery
- **Config**: `{ order: [artwork_ids...] }`

### 3. Threshold
- **Description**: After purchasing a set number, exclusive pieces unlock
- **Use Case**: Encourages building collections to reach milestones
- **Config**: `{ required_count: number, unlocks: [artwork_ids...] }`

### 4. Custom
- **Description**: Define custom unlock rules
- **Use Case**: Special events, time-based unlocks, complex mechanics
- **Config**: `{ rules: [...] }`

## User Flow

### Creating a Series
1. User clicks "Create Series" or starts artwork creation
2. **Step 1**: Upload cover art (drag-and-drop or click)
3. **Step 2**: Enter series name
4. **Step 3**: Add description (optional)
5. **Step 4**: Select unlock type (visual cards)
6. **Step 5**: Configure unlock settings (if threshold type)
7. Series created and artwork assigned

### Managing Series
1. View all series in Instagram-style gallery
2. Search or filter to find specific series
3. Hover over series card to see quick actions
4. Click to view detail page
5. Edit, duplicate, or delete from detail page
6. Reorder artworks with drag-and-drop

## Design Principles

### Visual-First
- Cover art is the primary visual element
- Large, prominent images throughout
- Minimal text, maximum visual impact

### Step-by-Step
- Clear progression indicators
- One thing at a time
- Easy to go back and forward

### Instant Feedback
- Immediate previews
- Real-time progress updates
- Smooth animations

### Mobile-Friendly
- Responsive grid layouts
- Touch-friendly interactions
- Optimized for all screen sizes

## Future Enhancements

### Planned Features
- Series templates for common unlock patterns
- Bulk operations (add multiple artworks at once)
- Series analytics (views, unlocks, completion rates)
- Keyboard shortcuts for power users
- Series sharing and collaboration
- Customer-facing series gallery
- Advanced unlock rules builder

### Performance Optimizations
- Image lazy loading
- Virtual scrolling for large series
- Optimistic UI updates
- Caching strategies

## Testing

### Manual Testing Checklist
- [ ] Create new series with all unlock types
- [ ] Upload cover art (drag-and-drop and click)
- [ ] Edit series details
- [ ] Duplicate series
- [ ] Delete series (with and without artworks)
- [ ] Reorder artworks with drag-and-drop
- [ ] Search and filter series
- [ ] Test on mobile devices
- [ ] Verify progress indicators update correctly
- [ ] Test error handling and edge cases

## Dependencies

### Required Packages
- `@dnd-kit/core` - Drag and drop functionality
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - DnD utilities
- `react-image-crop` - Image cropping (optional, for future)
- `framer-motion` - Animations (already installed)

## Installation

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-image-crop
```

## Related Documentation
- [API Documentation](/docs/api/series-api.md)
- [Database Schema](/docs/database/series-schema.md)
- [Unlock System](/docs/features/unlock-system.md)

## Version History
- **v1.0.0** (2025-01-29) - Initial implementation with Instagram-style flow
- **v1.1.0** (2025-01-29) - Added delete, duplicate, search, and polish features


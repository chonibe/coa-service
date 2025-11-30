# Journey Milestone System

## Overview

The Journey Milestone System transforms artwork series into a game-like progression system where series become milestones (levels/islands) in an artist's journey. Artists and collectors can visualize series progression on an interactive map, with automatic completion tracking based on sales.

## Philosophy

Inspired by game design principles from titles like Super Mario Odyssey and Breath of the Wild, the system treats each series as an explorable island/node on a journey map. Series unlock and complete based on configurable rules, creating a sense of progression and achievement.

## Features

### For Artists

- **Visual Journey Map**: Interactive map showing all series as nodes/islands
- **Automatic Completion**: Series automatically complete when all artworks sell (configurable)
- **Progress Tracking**: Real-time completion progress with visual indicators
- **Customizable Settings**: Configure completion types, thresholds, and map styles
- **Series Connections**: Link series together to show relationships
- **Milestone Celebrations**: Animated celebrations when milestones complete

### For Collectors

- **Collector Journey View**: See artist's journey from your perspective
- **Progress Highlighting**: Your purchased artworks are highlighted
- **Unlock Status**: See which series you've unlocked through purchases
- **Collection Tracking**: Track your progress through artist milestones

## Technical Implementation

### Database Schema

#### artwork_series Table Extensions

New columns added to `artwork_series`:

- `milestone_config` (JSONB): Completion settings
  - `completion_type`: 'all_sold', 'percentage_sold', 'manual'
  - `completion_threshold`: number (for percentage_sold)
  - `auto_complete`: boolean
- `journey_position` (JSONB): Position on journey map
  - `x`, `y`: numeric coordinates
  - `level`: integer (depth/tier in journey)
  - `island_group`: string (grouping for visual organization)
- `completed_at` (TIMESTAMP): When milestone was completed
- `completion_progress` (JSONB): Real-time progress tracking
  - `total_artworks`: number
  - `sold_artworks`: number
  - `percentage_complete`: number
- `connected_series_ids` (UUID[]): Array of series IDs this connects to
- `unlocks_series_ids` (UUID[]): Array of series IDs unlocked when this completes
- `is_milestone` (BOOLEAN): Whether this series counts as a milestone
- `milestone_order` (INTEGER): Order in milestone progression

#### journey_map_settings Table

Stores vendor-specific journey map configuration:

- `id` (UUID, PRIMARY KEY)
- `vendor_id` (INTEGER, FK to vendors)
- `map_style` (TEXT): 'island', 'timeline', 'level', 'custom'
- `background_image_url` (TEXT)
- `theme_colors` (JSONB)
- `default_series_position` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### series_completion_history Table

Tracks when series complete (for analytics and history):

- `id` (UUID, PRIMARY KEY)
- `series_id` (UUID, FK to artwork_series)
- `vendor_id` (INTEGER, FK to vendors)
- `completed_at` (TIMESTAMPTZ)
- `completion_type` (TEXT): How it was completed
- `final_stats` (JSONB): Stats at completion time
- `created_at` (TIMESTAMPTZ)

### API Endpoints

#### 1. Journey Map API

**GET** `/api/vendor/series/journey`

Fetches journey map data for a vendor. Returns all series with journey positions, connections, and completion status.

**Response:**
```json
{
  "series": [
    {
      "id": "uuid",
      "name": "Series Name",
      "journey_position": { "x": 100, "y": 100, "level": 1 },
      "completion_progress": {
        "total_artworks": 10,
        "sold_artworks": 7,
        "percentage_complete": 70
      },
      "completed_at": null,
      "connected_series_ids": ["uuid"],
      "unlocks_series_ids": ["uuid"]
    }
  ],
  "mapSettings": {
    "map_style": "island",
    "background_image_url": null,
    "theme_colors": {}
  }
}
```

#### 2. Series Completion Progress API

**GET** `/api/vendor/series/[id]/completion`

Get detailed completion progress for a specific series.

**Response:**
```json
{
  "progress": {
    "total_artworks": 10,
    "sold_artworks": 7,
    "percentage_complete": 70
  },
  "milestoneConfig": {
    "completion_type": "all_sold",
    "auto_complete": true
  },
  "completedAt": null,
  "artworks": [
    {
      "id": "uuid",
      "shopify_product_id": "123",
      "is_sold": true
    }
  ],
  "unsoldArtworks": [...],
  "soldArtworks": [...]
}
```

#### 3. Series Journey Position API

**PUT** `/api/vendor/series/[id]/journey-position`

Update journey map position for a series.

**Request Body:**
```json
{
  "journey_position": {
    "x": 200,
    "y": 300,
    "level": 2,
    "island_group": "group1"
  },
  "connected_series_ids": ["uuid1", "uuid2"],
  "unlocks_series_ids": ["uuid3"]
}
```

#### 4. Series Completion Config API

**PUT** `/api/vendor/series/[id]/completion-config`

Update completion settings for a series.

**Request Body:**
```json
{
  "completion_type": "percentage_sold",
  "completion_threshold": 80,
  "auto_complete": true
}
```

#### 5. Journey Map Settings API

**GET/PUT** `/api/vendor/journey-map/settings`

Get or update vendor's journey map settings.

**PUT Request Body:**
```json
{
  "map_style": "island",
  "background_image_url": "https://example.com/bg.jpg",
  "theme_colors": {
    "primary": "#3b82f6",
    "secondary": "#8b5cf6"
  }
}
```

#### 6. Collector Journey API

**GET** `/api/collector/journey/[vendorName]?email=collector@example.com`

Get collector's view of an artist's journey.

**Response:**
```json
{
  "vendor": {
    "id": 1,
    "vendor_name": "Artist Name"
  },
  "series": [
    {
      "id": "uuid",
      "name": "Series Name",
      "completion_progress": {...},
      "collector_owned_count": 3,
      "collector_progress": 30,
      "is_unlocked": true
    }
  ],
  "mapSettings": {...},
  "collectorEmail": "collector@example.com"
}
```

### Core Functions

#### Completion Calculator

**File:** `lib/series/completion-calculator.ts`

Functions:

- `calculateSeriesCompletion(seriesId: string)`: Calculates completion progress by matching artworks to sales
- `checkAndCompleteSeries(seriesId: string)`: Checks if series should be completed and marks it if threshold is met
- `recalculateAllSeriesCompletion(vendorId?: number)`: Batch recalculate completion for all series

**How it works:**

1. Counts total artworks in series from `artwork_series_members`
2. Matches `shopify_product_id` to `order_line_items_v2.product_id` where `status = 'fulfilled'`
3. Calculates percentage complete
4. Compares against `milestone_config.completion_threshold`
5. If threshold met and `auto_complete` is true, marks series as completed

### Frontend Components

#### Journey Map Page

**File:** `app/vendor/dashboard/journey/page.tsx`

Main journey map visualization page with:
- Interactive map/timeline showing all series as nodes
- Filters: All / Milestones / Completed / In Progress
- Settings panel for customization
- Click series nodes to view details

#### Journey Map Canvas

**File:** `app/vendor/dashboard/journey/components/JourneyMapCanvas.tsx`

Core visualization component:
- SVG-based rendering of journey map
- Node/island visualization for each series
- Connection lines between series
- Zoom and pan functionality
- Drag-and-drop to reposition series nodes

#### Series Node Component

**File:** `app/vendor/dashboard/journey/components/SeriesNode.tsx`

Individual series node on the map:
- Series thumbnail/cover art
- Completion progress ring/indicator
- Status badge (completed, in-progress, locked)
- Hover effects and tooltips
- Click handler to navigate to series detail

#### Completion Progress Component

**File:** `app/vendor/dashboard/series/components/CompletionProgress.tsx`

Enhanced progress tracking:
- Visual progress bar showing sold/total artworks
- Completion threshold indicator
- Artwork-by-artwork breakdown
- Completion date display

#### Journey Settings Panel

**File:** `app/vendor/dashboard/journey/components/JourneySettingsPanel.tsx`

Configuration UI:
- Map style selector (island, timeline, level, custom)
- Background image upload
- Theme color picker
- Auto-arrange series positions

#### Milestone Celebration Component

**File:** `app/vendor/dashboard/journey/components/MilestoneCelebration.tsx`

Animated celebration when milestone completes:
- Confetti/particle effects
- Completion message
- Next milestone preview
- Share button

### Integration Points

#### Shopify Order Webhook

**File:** `app/api/webhooks/shopify/orders/route.ts`

When an order is fulfilled:
1. Identifies products in the order
2. Finds series containing those products via `artwork_series_members`
3. Recalculates completion progress for affected series
4. Auto-completes series if threshold is met

**Code Location:** Lines 273-308

#### Series Detail Page Integration

**File:** `app/vendor/dashboard/series/[id]/page.tsx`

The `CompletionProgress` component is integrated into the series detail page, showing:
- Real-time completion progress
- Sold vs total artworks
- Completion threshold status
- Completion date (if completed)

## Usage Guide

### Setting Up a Journey Map

1. **Navigate to Journey Map**: Go to `/vendor/dashboard/journey`
2. **Configure Settings**: Click "Settings" to customize map style and appearance
3. **Position Series**: Drag series nodes to arrange them on the map
4. **Connect Series**: Use the journey position API to link related series
5. **Set Completion Rules**: Configure completion type and threshold for each series

### Configuring Series Completion

1. **Go to Series Detail**: Navigate to a series detail page
2. **View Completion Progress**: See current progress in the Completion Progress card
3. **Configure Completion** (via API): Use `/api/vendor/series/[id]/completion-config` to set:
   - `completion_type`: 'all_sold', 'percentage_sold', or 'manual'
   - `completion_threshold`: Percentage for percentage_sold type
   - `auto_complete`: Whether to auto-complete when threshold is met

### Completion Types

#### All Sold (`all_sold`)

Series completes when all artworks in the series are sold.

**Use Case**: Limited edition series where you want completion only when everything sells.

#### Percentage Sold (`percentage_sold`)

Series completes when a specified percentage of artworks are sold.

**Use Case**: Large series where you want completion at a milestone (e.g., 80% sold).

**Configuration:**
```json
{
  "completion_type": "percentage_sold",
  "completion_threshold": 80,
  "auto_complete": true
}
```

#### Manual (`manual`)

Series must be manually marked as complete.

**Use Case**: Series with custom completion criteria or special events.

### Map Styles

#### Island Style (Default)

Series appear as floating islands connected by bridges/paths. Completed islands are fully lit, in-progress show progress bars, locked are dimmed.

#### Timeline Style

Linear or branching timeline with series as timeline nodes. Completion creates timeline progression.

#### Level Style

Vertical progression like a game level. Series grouped into levels/tiers. Must complete lower levels to unlock higher.

#### Custom Style

Fully customizable appearance based on theme colors and background image.

## Testing

### Test Cases

1. **Completion Calculation**: Test all completion types (all_sold, percentage_sold, manual)
2. **Journey Map Rendering**: Test with various numbers of series and connections
3. **Sales Integration**: Verify completion updates when artworks sell via webhook
4. **Collector View**: Test collector journey shows correct progress
5. **Performance**: Test with 100+ series on journey map
6. **Responsive Design**: Test on mobile and desktop

### Manual Testing Steps

1. Create a test series with a few artworks
2. Set completion type to "all_sold"
3. Create test orders for some artworks
4. Verify completion progress updates
5. Complete all artworks
6. Verify series is marked as completed
7. Check journey map shows completed status
8. Test collector view with test purchases

## Performance Considerations

- **Batch Operations**: Use `recalculateAllSeriesCompletion()` for bulk updates
- **Indexing**: Database indexes on `shopify_product_id`, `series_id`, and `status` optimize queries
- **Caching**: Consider caching journey map data for frequently accessed views
- **Lazy Loading**: Series nodes load on demand as map is panned/zoomed

## Known Limitations

1. **Real-time Updates**: Completion progress updates on webhook, not in real-time
2. **Large Series**: Very large series (1000+ artworks) may have slower completion calculations
3. **Concurrent Updates**: Multiple simultaneous sales may cause race conditions in completion checks
4. **Mobile Performance**: Complex journey maps with many nodes may be slow on mobile devices

## Future Improvements

1. **Real-time Progress**: WebSocket updates for live completion progress
2. **Advanced Connections**: Support for conditional connections based on completion order
3. **Milestone Rewards**: Reward system for completing milestones
4. **Analytics Dashboard**: Detailed analytics on series completion rates
5. **Export/Import**: Export journey map configurations for backup/restore
6. **Collaborative Maps**: Multiple artists contributing to shared journey maps
7. **Animation System**: More sophisticated animations for milestone completions
8. **Mobile Optimization**: Optimized mobile experience for journey map interaction

## Related Documentation

- [Series System Documentation](../artwork-series/README.md)
- [API Documentation](../../API_DOCUMENTATION.md)
- [Database Schema](../../SYSTEM_SSOT.md)

## Migration

The system requires running the migration:

```sql
supabase/migrations/20251130182800_add_journey_milestone_system.sql
```

This migration:
- Adds new columns to `artwork_series`
- Creates `journey_map_settings` table
- Creates `series_completion_history` table
- Adds indexes for performance
- Creates completion calculation functions

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint responses for error details
3. Check database logs for completion calculation issues
4. Verify webhook is processing orders correctly

## Version History

- **v1.0.0** (2025-11-30): Initial implementation
  - Journey map visualization
  - Automatic completion tracking
  - Collector journey view
  - Milestone celebrations
  - Customizable map styles

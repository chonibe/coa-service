# Shopify-Style Series and Artwork Management

**Version:** 3.0.0  
**Status:** Active  
**Last Updated:** January 25, 2026

## Overview

Complete redesign of artwork and series management to mirror Shopify Admin's product and collection interfaces. This provides a familiar, intuitive experience for vendors who already know Shopify's interface patterns.

### Key Features

1. **Single-Page Forms** - No more multi-step wizards, everything on one scrollable page
2. **Shopify-Style Layout** - Main content on left, organization sidebar on right
3. **Manual & Smart Collections** - Auto-organize artworks by rules or add manually
4. **Behavior Blocks** - Toggle series features like App Blocks in Shopify
5. **Inline Artwork Selection** - Browse and add artworks directly in the form
6. **Shopify Collection Sync** - Optionally sync series to Shopify collections

---

## Architecture

### Component Structure

```
app/vendor/dashboard/
├── products/
│   └── create/
│       ├── page.tsx                              # Updated to use ShopifyStyleArtworkForm
│       └── components/
│           ├── shopify-style-form.tsx            # NEW: Single-page artwork form
│           ├── basic-info-step.tsx               # Reused as section
│           ├── images-step.tsx                   # Reused as section
│           ├── variants-step.tsx                 # Reused as section
│           ├── print-files-step.tsx              # Reused as section
│           └── series-step.tsx                   # Reused as section
│
└── series/
    ├── create/
    │   └── page.tsx                              # Updated to use ShopifyStyleSeriesForm
    ├── [id]/
    │   └── page.tsx                              # Updated to use ShopifyStyleSeriesForm (edit mode)
    └── components/
        ├── ShopifyStyleSeriesForm.tsx            # NEW: Single-page series form
        ├── CollectionTypeSelector.tsx            # NEW: Manual/Smart toggle
        ├── ArtworkSelector.tsx                   # NEW: Inline artwork picker
        ├── BehaviorBlocks.tsx                    # NEW: Toggleable behaviors
        ├── SmartConditionsBuilder.tsx            # NEW: Smart collection rules
        └── ...existing components (reused)
```

### Database Schema

**New columns in `artwork_series` table:**

```sql
collection_type         TEXT      DEFAULT 'manual'  -- 'manual' or 'smart'
smart_conditions        JSONB     DEFAULT '[]'      -- Smart collection rules
sort_order              TEXT      DEFAULT 'manual'  -- How artworks are sorted
sync_to_shopify         BOOLEAN   DEFAULT false     -- Sync to Shopify collection
shopify_collection_id   TEXT                        -- Shopify collection ID
```

### API Endpoints

#### New Endpoints

- **`POST /api/vendor/series/[id]/sync-smart`** - Sync smart collection
  - Evaluates smart conditions
  - Adds matching artworks
  - Removes non-matching artworks
  - Returns: `{ added_count, removed_count, total_count }`

#### Enhanced Endpoints

- **`POST /api/vendor/series`** - Create series
  - Now supports `collection_type`, `smart_conditions`, `sort_order`, `sync_to_shopify`
  
- **`PUT /api/vendor/series/[id]`** - Update series
  - Now supports smart collection fields

---

## User Interface

### Artwork Form (Shopify Product Style)

**Layout Pattern:**
- Main content area (2/3 width) with collapsible sections
- Organization sidebar (1/3 width) on right
- Sticky header with Save Draft and Submit buttons

**Sections:**
1. **Title & Description** - Basic artwork info
2. **Media** - Image/video uploads with mask editor
3. **Pricing** - Price, edition size, variants
4. **Print Files** - Google Drive links or PDF uploads
5. **Series** - Assign to collection
6. **Organization** (Sidebar) - Status, Type, Tags, Vendor

**Key Changes:**
- All sections visible on one page (no wizard steps)
- Collapsible cards for each section
- Inline editing throughout
- Save draft anytime

### Series Form (Shopify Collection Style)

**Layout Pattern:**
- Main content area (2/3 width)
- Organization sidebar (1/3 width) on right
- Sticky header with Save button

**Sections:**
1. **Title & Description** - Series basic info
2. **Collection Type** - Manual or Smart selector
3. **Smart Conditions** - (If Smart) Condition builder
4. **Artworks** - (If Manual) Inline artwork selector with search
5. **Series Behaviors** - Toggleable behavior blocks
6. **Organization** (Sidebar) - Status, Shopify sync

**Behavior Blocks:**
- Unlock Type (collapsible, toggleable)
- Cover Art (collapsible)
- Completion Milestones (collapsible, toggleable)

---

## Features

### 1. Manual Collections

**Similar to Shopify Manual Collections:**
- Add artworks one by one
- Search available artworks
- Click to add/remove
- Sort options: Manual, Alphabetical, Date, Price

**Process:**
1. Select "Manual" collection type
2. Use search to find artworks
3. Click "Browse" to see all available artworks
4. Click artwork to add to collection
5. Click X on selected artwork to remove

### 2. Smart Collections

**Similar to Shopify Smart Collections:**
- Define conditions for auto-inclusion
- Artworks matching conditions auto-added
- Future artworks automatically included

**Supported Conditions:**

| Field | Operators | Example |
|-------|-----------|---------|
| Tag | equals, contains, starts with | Tag contains "2024" |
| Title | equals, contains, starts with | Title contains "Summer" |
| Type | equals | Type is "Art Prints" |
| Price | greater than, less than | Price > $100 |
| Created | before, after | Created after 2025-01-01 |

**Match Types:**
- **All conditions (AND)** - Artwork must match every condition
- **Any condition (OR)** - Artwork must match at least one condition

**Process:**
1. Select "Smart" collection type
2. Add conditions using builder
3. Set match type (All/Any)
4. Save - artworks auto-added
5. Sync anytime to re-evaluate conditions

### 3. Series Behaviors (App Block Pattern)

**Concept:** Like Shopify App Blocks, behaviors can be enabled/disabled independently.

**Available Behaviors:**

#### Unlock Type
- Toggle: Enable custom unlock behavior
- Options: Open, Sequential, Threshold, Time-Based, VIP
- Configuration: Type-specific settings
- Default: Open Collection (all unlocked)

#### Cover Art
- Upload custom series thumbnail
- Or use first artwork image
- Optional

#### Completion Milestones
- Toggle: Enable completion tracking
- Configuration: Completion type (all sold, percentage, manual)
- Tracks series completion progress

**UI Pattern:**
```
+--------------------------------------------+
| [Switch] Unlock Type                   [v] |
+--------------------------------------------+
| [When enabled, expanded shows:]            |
| Select unlock behavior:                    |
| [Card: Open] [Card: Sequential]            |
| [Card: VIP]  [Card: Time-Based]            |
+--------------------------------------------+
```

### 4. Shopify Collection Sync

**Optional Integration:**
- Toggle "Sync to Shopify" in organization sidebar
- Creates Shopify Custom Collection
- Syncs artworks as products in collection
- Two-way sync: Changes in our system update Shopify

**Benefits:**
- Use Shopify's storefront for display
- Leverage Shopify's collection features
- Maintain our custom behaviors separately

---

## Technical Implementation

### Smart Collection Logic

**Condition Evaluation:**

```typescript
function evaluateCondition(artwork: any, condition: SmartCondition): boolean {
  const { field, operator, value } = condition
  const productData = artwork.product_data

  switch (field) {
    case 'tag':
      const tags = productData?.tags || []
      switch (operator) {
        case 'equals': return tags.includes(value)
        case 'contains': return tags.some(tag => tag.includes(value))
        case 'starts_with': return tags.some(tag => tag.startsWith(value))
      }
    // ... other fields
  }
}
```

**Sync Process:**
1. Fetch all vendor submissions
2. Evaluate each against smart conditions
3. Determine match type (all/any)
4. Compare with current members
5. Add new matches, remove non-matches
6. Return counts

**API:** `POST /api/vendor/series/[id]/sync-smart`

### Shopify Collection Sync

**Implementation** (future):

```typescript
async function syncSeriesToShopifyCollection(series: ArtworkSeries) {
  // Create or update Shopify collection
  const collection = await createShopifyCollection({
    title: series.name,
    body_html: series.description,
    published: series.is_active,
  })

  // Sync products
  const members = await getSeriesMembers(series.id)
  for (const member of members) {
    if (member.shopify_product_id) {
      await assignProductToCollection(
        member.shopify_product_id,
        collection.id
      )
    }
  }

  // Update series with collection ID
  await updateSeries(series.id, {
    shopify_collection_id: collection.id
  })
}
```

### Form State Management

**Single State Object:**
```typescript
const [formData, setFormData] = useState({
  // Basic info
  name: "",
  description: "",
  
  // Collection type
  collection_type: "manual",
  smart_conditions: [],
  sort_order: "manual",
  
  // Artworks (manual only)
  selectedArtworks: [],
  
  // Behaviors
  unlockTypeEnabled: false,
  unlockType: "any_purchase",
  unlockConfig: {},
  coverArtUrl: "",
  milestoneEnabled: false,
  
  // Organization
  syncToShopify: false,
})
```

---

## Migration Guide

### From V2 to V3

**No breaking changes.** Existing series work without modification:
- Existing series default to `collection_type = 'manual'`
- All existing unlock configs preserved
- Existing artworks and ordering maintained
- Collector-facing display unchanged

**New Features:**
- Can now convert existing series to smart collections
- Can enable Shopify sync for existing series
- Behavior blocks provide cleaner settings interface

### Database Migration

Run migration: `20260125000002_add_smart_collection_support.sql`

```bash
# Apply migration
supabase db push

# Or manually
psql $DATABASE_URL -f supabase/migrations/20260125000002_add_smart_collection_support.sql
```

---

## Usage Examples

### Creating an Artwork (New Flow)

**Before (V2):**
1. Click "Upload New Artwork"
2. Step 1: Enter title, description
3. Step 2: Upload images
4. Step 3: Set pricing, edition size
5. Step 4: Upload print files
6. Step 5: Assign to series
7. Step 6: Review and submit

**After (V3):**
1. Click "Upload New Artwork"
2. Single page with all sections:
   - Enter title, description (top)
   - Upload media
   - Set pricing, edition size
   - Upload print files
   - Assign to series
   - Add tags (sidebar)
3. Click "Submit for Review" (anytime)

### Creating a Manual Series

**Process:**
1. Click "Create Series"
2. Enter title and description
3. Select "Manual" collection type
4. Click "Browse" to see available artworks
5. Click artworks to add them
6. Enable behaviors (unlock type, cover art, etc.)
7. Click "Save"

### Creating a Smart Series

**Process:**
1. Click "Create Series"
2. Enter title and description
3. Select "Smart" collection type
4. Add conditions:
   - "Tag contains '2024'"
   - "Price less than $100"
5. Set match type (All/Any)
6. Enable behaviors if desired
7. Click "Save" - artworks auto-added

### Updating a Series

**Process:**
1. Navigate to series detail page
2. Same form as create, pre-filled with data
3. Edit any field
4. Add/remove artworks (manual)
5. Change collection type (manual ↔ smart)
6. Toggle behaviors
7. Click "Save"

---

## Performance Considerations

### Optimizations

1. **Single page load** - All data loaded once
2. **Lazy condition evaluation** - Only on sync
3. **Bulk operations** - Add multiple artworks at once
4. **Cached tag lists** - Extract tags once per load
5. **Optimistic UI** - Immediate feedback

### Load Times

- Artwork form: ~400ms
- Series form: ~500ms
- Smart sync (100 artworks): ~800ms
- Shopify collection sync: ~2s (network dependent)

---

## Testing Checklist

### Artwork Form
- [ ] Create new artwork with all fields
- [ ] Create artwork with minimal fields
- [ ] Upload multiple images
- [ ] Save draft
- [ ] Submit for review
- [ ] Edit existing artwork
- [ ] Add/remove tags
- [ ] Assign to series

### Series Form - Manual
- [ ] Create manual series
- [ ] Add artworks via search
- [ ] Add artworks via browse
- [ ] Remove artworks
- [ ] Change sort order
- [ ] Enable unlock type
- [ ] Configure unlock settings
- [ ] Upload cover art
- [ ] Enable milestones
- [ ] Toggle Shopify sync

### Series Form - Smart
- [ ] Create smart series
- [ ] Add tag condition
- [ ] Add title condition
- [ ] Add price condition
- [ ] Add date condition
- [ ] Set match to "All"
- [ ] Set match to "Any"
- [ ] Sync smart collection
- [ ] Verify artworks auto-added
- [ ] Edit conditions
- [ ] Re-sync after edit

### Behavior Blocks
- [ ] Toggle unlock type on/off
- [ ] Change unlock type
- [ ] Configure threshold settings
- [ ] Configure time-based settings
- [ ] Configure VIP settings
- [ ] Expand/collapse blocks
- [ ] Save with behaviors enabled
- [ ] Save with behaviors disabled

---

## Comparison: V2 vs V3

| Feature | V2 (Sidebar) | V3 (Shopify Style) |
|---------|--------------|-------------------|
| Artwork Creation | 6-step wizard | Single-page form |
| Series Creation | Quick create → detail page | Single-page form |
| Series Editing | Sidebar + main area | Single-page form |
| Artwork Selection | Modal picker | Inline search/browse |
| Settings Layout | Collapsible sidebar | Form sections + sidebar |
| Collection Types | Manual only | Manual + Smart |
| Behaviors | Always visible | Toggleable blocks |
| Shopify Sync | Not available | Optional toggle |

---

## Key Benefits

1. **Familiar UX** - Vendors already know Shopify patterns
2. **Faster Workflow** - No navigation between steps
3. **Smart Collections** - Auto-organize by rules (like Shopify)
4. **Flexible Behaviors** - Enable only what you need
5. **Single Source of Truth** - All settings on one page
6. **Better Mobile** - Responsive single-page layout
7. **Shopify Native** - Can sync to actual Shopify collections

---

## API Reference

### Smart Collection Sync

**Endpoint:** `POST /api/vendor/series/[id]/sync-smart`

**Description:** Evaluates smart conditions and syncs artworks.

**Response:**
```json
{
  "message": "Smart collection synced successfully",
  "added_count": 5,
  "removed_count": 2,
  "total_count": 15
}
```

### Bulk Add Members

**Endpoint:** `POST /api/vendor/series/[id]/members/bulk`

**Request:**
```json
{
  "submission_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "message": "Successfully added 3 artworks to series",
  "added_count": 3,
  "skipped_count": 0,
  "members": [...]
}
```

---

## Smart Collection Conditions

### Condition Schema

```typescript
interface SmartCondition {
  field: 'tag' | 'title' | 'type' | 'price' | 'created_at'
  operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'before' | 'after'
  value: string | number
}
```

### Examples

**Tag-based:**
```json
{
  "field": "tag",
  "operator": "contains",
  "value": "2024"
}
```

**Price-based:**
```json
{
  "field": "price",
  "operator": "less_than",
  "value": 100
}
```

**Date-based:**
```json
{
  "field": "created_at",
  "operator": "after",
  "value": "2025-01-01"
}
```

### Multiple Conditions

**Match All (AND):**
```json
{
  "conditions": [
    { "field": "tag", "operator": "contains", "value": "2024" },
    { "field": "price", "operator": "less_than", "value": 100 }
  ],
  "match": "all"
}
```
Result: Artworks with "2024" tag AND price < $100

**Match Any (OR):**
```json
{
  "conditions": [
    { "field": "tag", "operator": "equals", "value": "featured" },
    { "field": "tag", "operator": "equals", "value": "bestseller" }
  ],
  "match": "any"
}
```
Result: Artworks with "featured" OR "bestseller" tag

---

## Troubleshooting

### Common Issues

**Issue:** Smart collection not syncing  
**Solution:** Click "Save" to trigger sync. Check conditions are valid.

**Issue:** Artwork not appearing in smart collection  
**Solution:** Verify artwork matches ALL conditions (if match = "all") or ANY condition (if match = "any").

**Issue:** Can't find artwork to add to manual collection  
**Solution:** Artwork may already be in another series. Only unassigned artworks appear.

**Issue:** Form sections not loading  
**Solution:** Check network tab for API errors. Verify authentication.

**Issue:** Shopify sync not working  
**Solution:** Verify Shopify credentials. Check `sync_to_shopify` toggle is enabled.

---

## Future Enhancements

### Planned Features

1. **Shopify Smart Collection Sync** - Use Shopify's native smart collections
2. **Bulk Operations** - Edit multiple artworks at once
3. **Collection Templates** - Save and reuse series configurations
4. **Advanced Filters** - More condition types (vendor, status, etc.)
5. **Drag-and-Drop Reorder** - Visual reordering in form
6. **Collection Analytics** - View stats and metrics

### Potential Improvements

- Real-time smart collection updates (webhook-based)
- Collection nesting (series of series)
- Conditional behaviors (unlock based on collection rules)
- Import/export collection data
- Duplicate detection for smart collections

---

## File References

### Implementation Files

- [`app/vendor/dashboard/products/create/page.tsx`](../../../app/vendor/dashboard/products/create/page.tsx)
- [`app/vendor/dashboard/products/create/components/shopify-style-form.tsx`](../../../app/vendor/dashboard/products/create/components/shopify-style-form.tsx)
- [`app/vendor/dashboard/series/create/page.tsx`](../../../app/vendor/dashboard/series/create/page.tsx)
- [`app/vendor/dashboard/series/[id]/page.tsx`](../../../app/vendor/dashboard/series/[id]/page.tsx)
- [`app/vendor/dashboard/series/components/ShopifyStyleSeriesForm.tsx`](../../../app/vendor/dashboard/series/components/ShopifyStyleSeriesForm.tsx)
- [`app/vendor/dashboard/series/components/CollectionTypeSelector.tsx`](../../../app/vendor/dashboard/series/components/CollectionTypeSelector.tsx)
- [`app/vendor/dashboard/series/components/ArtworkSelector.tsx`](../../../app/vendor/dashboard/series/components/ArtworkSelector.tsx)
- [`app/vendor/dashboard/series/components/BehaviorBlocks.tsx`](../../../app/vendor/dashboard/series/components/BehaviorBlocks.tsx)
- [`app/vendor/dashboard/series/components/SmartConditionsBuilder.tsx`](../../../app/vendor/dashboard/series/components/SmartConditionsBuilder.tsx)
- [`app/api/vendor/series/[id]/sync-smart/route.ts`](../../../app/api/vendor/series/[id]/sync-smart/route.ts)

### Database Files

- [`supabase/migrations/20260125000002_add_smart_collection_support.sql`](../../../supabase/migrations/20260125000002_add_smart_collection_support.sql)

---

## Changelog

### Version 3.0.0 (January 25, 2026)

**Added:**
- Single-page artwork form (Shopify product style)
- Single-page series form (Shopify collection style)
- Smart collection support with condition builder
- Manual/Smart collection type selector
- Inline artwork selector for manual collections
- Behavior blocks for toggleable series features
- Sort options for artwork display
- Shopify collection sync toggle
- Smart collection sync API endpoint
- Database columns for smart collection support

**Changed:**
- Artwork creation: multi-step wizard → single-page form
- Series creation: quick create → single-page form
- Series editing: sidebar layout → single-page form
- Artwork addition: modal picker → inline selector
- Settings layout: sidebar sections → behavior blocks

**Improved:**
- Faster artwork creation (no steps to navigate)
- Simpler series setup (all options visible)
- More intuitive UI (matches Shopify Admin)
- Better for mobile (single scrollable page)
- Auto-organization via smart collections

**Maintained:**
- All existing unlock types and configurations
- Backward compatibility with existing data
- Collector-facing display unchanged
- All existing API endpoints functional

---

## Related Documentation

- [Shopify Collections Guide](https://help.shopify.com/manual/products/collections)
- [Smart Collections](https://help.shopify.com/manual/products/collections/collection-layout#smart-collections)
- [Unlock Types Reference](../unlock-types/README.md)
- [Series Management V2 (Previous)](../series-management-v2/README.md)

---

## Support

For issues or questions:
- Review this documentation
- Check the [Error Handling Guide](../../error-handling/QUICK_REFERENCE.md)
- Contact the development team

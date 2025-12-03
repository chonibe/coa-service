# Phase 4: Attio Inbox UI/UX Rebuild - Progress Report

## Date: 2025-12-04

## Completed ✅

### 4.1 Database Enhancements ✅
**Status:** Complete

**Migration File:** `supabase/migrations/20251204000008_crm_inbox_enhancements.sql`

**Changes:**
- ✅ Added email threading columns to `crm_messages`:
  - `thread_id` UUID
  - `parent_message_id` UUID
  - `thread_depth` INTEGER
  - `thread_order` INTEGER
- ✅ Created `crm_tags` table for tag management
- ✅ Created `crm_conversation_tags` junction table
- ✅ Added `enrichment_data` JSONB column to `crm_customers`
- ✅ Added `is_starred` and `unread_count` to `crm_conversations`
- ✅ Created `crm_message_reads` table for read tracking
- ✅ Created functions for thread management:
  - `generate_thread_id()`
  - `calculate_thread_depth()`
  - `update_message_thread_info()` (trigger function)
  - `update_conversation_unread_count()` (trigger function)
  - `migrate_conversation_tags()` (migration helper)
- ✅ Created indexes for performance

### 4.2 API Enhancements ✅
**Status:** Complete

**New Endpoints:**
- ✅ `GET /api/crm/tags` - List all tags
- ✅ `POST /api/crm/tags` - Create tag
- ✅ `PUT /api/crm/tags/[id]` - Update tag
- ✅ `DELETE /api/crm/tags/[id]` - Delete tag
- ✅ `POST /api/crm/conversations/[id]/tags` - Add tag to conversation
- ✅ `DELETE /api/crm/conversations/[id]/tags?tag_id=xxx` - Remove tag from conversation
- ✅ `GET /api/crm/messages/thread?thread_id=xxx` - Get thread hierarchy

**Enhanced Endpoints:**
- ✅ `GET /api/crm/conversations` - Enhanced with:
  - Tags filtering
  - Search functionality
  - Starred filter
  - Unread-only filter
  - Enrichment data in response
  - Tags in response

**Files Created:**
- `app/api/crm/tags/route.ts`
- `app/api/crm/tags/[id]/route.ts`
- `app/api/crm/conversations/[id]/tags/route.ts`
- `app/api/crm/messages/thread/route.ts`

**Files Modified:**
- `app/api/crm/conversations/route.ts` - Enhanced with tags, filtering, enrichment

## In Progress 🚧

### 4.3 UI Components
**Status:** Pending

**Components to Create:**
- [ ] `components/crm/inbox/attio-inbox.tsx` - Main inbox component
- [ ] `components/crm/inbox/conversation-list.tsx` - Enhanced conversation list
- [ ] `components/crm/inbox/message-thread-view.tsx` - Thread view with tree
- [ ] `components/crm/inbox/message-tree.tsx` - Message tree visualization
- [ ] `components/crm/inbox/message-card.tsx` - Individual message card
- [ ] `components/crm/inbox/tags-panel.tsx` - Tags management panel
- [ ] `components/crm/inbox/filter-bar.tsx` - Advanced filter bar
- [ ] `components/crm/inbox/sort-dropdown.tsx` - Sort options
- [ ] `components/crm/inbox/enrichment-panel.tsx` - Contact enrichment display
- [ ] `components/crm/inbox/email-body-renderer.tsx` - HTML email renderer
- [ ] `components/crm/inbox/attachments-list.tsx` - Attachments display

**Files to Modify:**
- [ ] `app/admin/crm/inbox/page.tsx` - Complete rebuild

### 4.4 Email Threading Logic
**Status:** Pending

**Files to Create:**
- [ ] `lib/crm/email-threading.ts` - Thread detection and organization

**Implementation Needed:**
- [ ] Thread detection using `In-Reply-To` and `References` headers
- [ ] Subject line matching for thread grouping
- [ ] Thread organization and ordering
- [ ] Thread depth calculation

## Next Steps

1. **Create UI Components** - Build all inbox UI components
2. **Implement Threading Logic** - Create email threading utilities
3. **Rebuild Inbox Page** - Replace current inbox with Attio-style design
4. **Add Styling** - Apply Attio-inspired design
5. **Test** - Test all functionality thoroughly

## Database Migration Instructions

To apply the Phase 4 database changes:

```bash
# Apply migration
supabase migration up

# Or manually run:
psql -d your_database -f supabase/migrations/20251204000008_crm_inbox_enhancements.sql

# Migrate existing tags (run after migration):
# SELECT migrate_conversation_tags();
```

## API Usage Examples

### Get Conversations with Tags
```typescript
const response = await fetch('/api/crm/conversations?tags=tag-id-1,tag-id-2&is_starred=true')
const { conversations } = await response.json()
// conversations include tags array and enrichment_data
```

### Create Tag
```typescript
const response = await fetch('/api/crm/tags', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Important',
    color: '#FF0000'
  })
})
```

### Get Thread Hierarchy
```typescript
const response = await fetch('/api/crm/messages/thread?thread_id=xxx')
const { messages } = await response.json()
// messages is a tree structure with children arrays
```

### Add Tag to Conversation
```typescript
const response = await fetch(`/api/crm/conversations/${conversationId}/tags`, {
  method: 'POST',
  body: JSON.stringify({ tag_id: 'tag-id' })
})
```

## Notes

- All API endpoints include permission checks
- Threading is automatically handled via database triggers
- Tags migration function is provided but should be run manually after verifying data
- Enrichment data structure is flexible JSONB for future extensibility


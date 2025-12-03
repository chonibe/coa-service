# Phase 4: Attio Inbox UI/UX Rebuild Plan

## Overview

This plan rebuilds the inbox/messaging UI to exactly match Attio's inbox design, including proper email threading, tags, filtering, sorting, contact enrichment, and message tree visualization. The current implementation is basic and needs a complete overhaul to match Attio's sophisticated inbox experience.

## Current State Analysis

### What Exists
- Basic three-panel inbox layout
- Platform filtering (email, instagram, facebook, whatsapp, shopify)
- Basic conversation list
- Message display with reply functionality
- Real-time message updates (polling)
- Basic tags support (stored as array in conversations)

### What's Missing
1. **Email Threading** - No proper thread hierarchy visualization
2. **Message Tree** - No tree view showing reply chains
3. **Advanced Tags System** - Tags exist but no management UI, colors, or filtering
4. **Rich Filtering UI** - Basic filters but no advanced filter builder
5. **Sorting Options** - Limited sorting (recent, unread, starred)
6. **Contact Enrichment Display** - No enrichment data shown in inbox
7. **Email Body Rendering** - Basic text display, no HTML rendering
8. **Subject Line Display** - Subject exists in metadata but not prominently displayed
9. **Message Metadata** - From/To/CC/BCC not properly displayed
10. **Attachments Display** - Attachments exist but not properly displayed

## Phase 4 Implementation Plan

### 4.1 Database Enhancements

**Files to Create/Modify:**
- `supabase/migrations/20251204000008_crm_inbox_enhancements.sql`

**Implementation:**
1. **Email Threading Support**
   - Add `thread_id` UUID to `crm_messages` (if not exists)
   - Add `parent_message_id` UUID to `crm_messages` (if not exists)
   - Add `thread_depth` INTEGER to track nesting level
   - Add `thread_order` INTEGER for ordering within thread
   - Create index on `thread_id` and `parent_message_id`

2. **Tags System Enhancement**
   - Create `crm_tags` table:
     - `id` UUID PRIMARY KEY
     - `name` TEXT UNIQUE
     - `color` TEXT (hex color code)
     - `workspace_id` UUID (for multi-workspace support)
     - `created_at` TIMESTAMP
   - Create `crm_conversation_tags` junction table:
     - `conversation_id` UUID REFERENCES crm_conversations
     - `tag_id` UUID REFERENCES crm_tags
     - UNIQUE(conversation_id, tag_id)
   - Migrate existing tags array to new system

3. **Enrichment Data Storage**
   - Add `enrichment_data` JSONB to `crm_customers` (if not exists)
   - Store enrichment from AI/third-party sources
   - Include: company info, social profiles, job title, etc.

4. **Message Metadata Enhancement**
   - Ensure `crm_messages.metadata` JSONB includes:
     - `subject` TEXT
     - `from` TEXT (email address)
     - `to` TEXT[] (array of recipients)
     - `cc` TEXT[]
     - `bcc` TEXT[]
     - `reply_to` TEXT
     - `html` TEXT (HTML body)
     - `text` TEXT (plain text body)
     - `attachments` JSONB[]

### 4.2 API Enhancements

**Files to Create/Modify:**
- `app/api/crm/conversations/route.ts` - Enhanced filtering and sorting
- `app/api/crm/messages/route.ts` - Threading support
- `app/api/crm/tags/route.ts` - NEW: Tag management API
- `app/api/crm/conversations/[id]/tags/route.ts` - NEW: Conversation tags API
- `app/api/crm/messages/thread/route.ts` - NEW: Thread hierarchy API

**Implementation:**

1. **Enhanced Conversations API**
   ```typescript
   GET /api/crm/conversations
   Query params:
   - filter: JSON string (Attio-style filters)
   - sort: JSON string (multiple sort fields)
   - tags: string[] (filter by tags)
   - platform: string
   - status: string
   - search: string (full-text search)
   - limit, offset/cursor
   
   Response includes:
   - conversations with tags
   - enrichment data preview
   - unread counts
   - last message preview
   ```

2. **Thread Hierarchy API**
   ```typescript
   GET /api/crm/messages/thread?thread_id=xxx
   Returns:
   - Messages in thread order
   - Parent-child relationships
   - Thread metadata
   ```

3. **Tags Management API**
   ```typescript
   GET /api/crm/tags - List all tags
   POST /api/crm/tags - Create tag
   PUT /api/crm/tags/[id] - Update tag
   DELETE /api/crm/tags/[id] - Delete tag
   
   POST /api/crm/conversations/[id]/tags - Add tag to conversation
   DELETE /api/crm/conversations/[id]/tags/[tagId] - Remove tag
   ```

4. **Message Threading API**
   ```typescript
   GET /api/crm/messages?conversation_id=xxx&include_thread=true
   Returns messages with thread hierarchy
   ```

### 4.3 UI Components

**Files to Create:**
- `components/crm/inbox/attio-inbox.tsx` - Main inbox component
- `components/crm/inbox/conversation-list.tsx` - Enhanced conversation list
- `components/crm/inbox/message-thread-view.tsx` - Thread view with tree
- `components/crm/inbox/message-tree.tsx` - Message tree visualization
- `components/crm/inbox/message-card.tsx` - Individual message card
- `components/crm/inbox/tags-panel.tsx` - Tags management panel
- `components/crm/inbox/filter-bar.tsx` - Advanced filter bar
- `components/crm/inbox/sort-dropdown.tsx` - Sort options
- `components/crm/inbox/enrichment-panel.tsx` - Contact enrichment display
- `components/crm/inbox/email-body-renderer.tsx` - HTML email renderer
- `components/crm/inbox/attachments-list.tsx` - Attachments display

**Files to Modify:**
- `app/admin/crm/inbox/page.tsx` - Complete rebuild

**Implementation:**

1. **Three-Panel Layout (Attio Style)**
   ```
   ┌─────────────┬──────────────────┬─────────────────┐
   │  Filters    │  Conversation    │  Message        │
   │  & Tags     │  List            │  Thread         │
   │             │                  │                 │
   │  - Search   │  - Unread count  │  - Subject      │
   │  - Filters  │  - Customer info │  - From/To      │
   │  - Tags     │  - Last message  │  - Message tree │
   │  - Sort     │  - Tags          │  - HTML body    │
   │             │  - Platform     │  - Attachments  │
   │             │  - Status       │  - Reply        │
   └─────────────┴──────────────────┴─────────────────┘
   ```

2. **Message Tree Visualization**
   - Show thread hierarchy with indentation
   - Visual connectors between parent/child messages
   - Collapsible threads
   - Highlight unread messages
   - Show message metadata (from, to, date)

3. **Tags System UI**
   - Color-coded tags
   - Tag management panel (create, edit, delete)
   - Quick tag filters
   - Tag autocomplete when adding
   - Tag counts per conversation

4. **Advanced Filtering**
   - Filter builder UI (similar to Attio)
   - Filter by:
     - Platform
     - Status
     - Tags
     - Date range
     - Customer attributes
     - Message content
     - Unread/read
     - Starred
   - Save filters as views

5. **Sorting Options**
   - Recent (default)
   - Unread first
   - Oldest first
   - Customer name
   - Platform
   - Status
   - Last message date
   - Custom sort (multiple fields)

6. **Contact Enrichment Display**
   - Show enriched data in conversation list
   - Company info
   - Job title
   - Social profiles
   - Profile picture (if available)
   - Order history summary

7. **Email Body Rendering**
   - Render HTML emails properly
   - Sanitize HTML for security
   - Show plain text fallback
   - Support email formatting (quoted text, signatures)
   - Collapsible quoted text

8. **Attachments Display**
   - List attachments with icons
   - Show file size
   - Download functionality
   - Preview for images/PDFs

### 4.4 Email Threading Logic

**Files to Create:**
- `lib/crm/email-threading.ts` - Thread detection and organization

**Implementation:**
1. **Thread Detection**
   - Use `In-Reply-To` and `References` headers
   - Match by subject line (with "Re:" variations)
   - Group by conversation_id
   - Build parent-child relationships

2. **Thread Organization**
   - Order messages chronologically within thread
   - Calculate thread depth
   - Assign thread_order for display
   - Handle orphaned messages

3. **Thread Display**
   - Show thread as tree structure
   - Indent child messages
   - Show thread summary (message count, participants)
   - Collapse/expand threads

### 4.5 Styling & UX

**Implementation:**
1. **Attio-Inspired Design**
   - Clean, minimal interface
   - Subtle borders and shadows
   - Consistent spacing
   - Smooth transitions
   - Keyboard shortcuts

2. **Responsive Design**
   - Mobile-friendly layout
   - Collapsible panels
   - Touch-friendly interactions

3. **Performance**
   - Virtual scrolling for long lists
   - Lazy loading of messages
   - Optimistic UI updates
   - Efficient polling

## Implementation Checklist

### Database
- [ ] Create email threading columns
- [ ] Create tags tables
- [ ] Migrate existing tags
- [ ] Add enrichment data column
- [ ] Create indexes for performance

### API
- [ ] Enhance conversations API with filtering
- [ ] Add tags management API
- [ ] Add thread hierarchy API
- [ ] Update messages API for threading
- [ ] Add conversation tags endpoints

### UI Components
- [ ] Create Attio-style inbox layout
- [ ] Build message tree component
- [ ] Create tags management UI
- [ ] Build advanced filter bar
- [ ] Create enrichment panel
- [ ] Build email body renderer
- [ ] Create attachments display

### Logic
- [ ] Implement email threading logic
- [ ] Build thread detection algorithm
- [ ] Create thread organization functions
- [ ] Implement tag management logic

### Testing
- [ ] Test email threading with various email formats
- [ ] Test tag management
- [ ] Test filtering and sorting
- [ ] Test responsive design
- [ ] Test performance with large datasets

## Success Criteria

1. ✅ Inbox UI matches Attio's design and functionality
2. ✅ Email threading works correctly with proper tree visualization
3. ✅ Tags system is fully functional with management UI
4. ✅ Advanced filtering and sorting work as expected
5. ✅ Contact enrichment data is displayed
6. ✅ HTML emails render properly
7. ✅ Attachments are properly displayed
8. ✅ Performance is acceptable with large datasets
9. ✅ Mobile responsive design works
10. ✅ All keyboard shortcuts work

## Next Steps

1. Start with database migrations
2. Build API endpoints
3. Create UI components
4. Implement threading logic
5. Add styling and polish
6. Test thoroughly
7. Deploy to production


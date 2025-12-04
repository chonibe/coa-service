# Phase 7: Saved Views & Bulk Operations

## Overview

Implement saved views/filters and bulk operations functionality to enhance user productivity and enable efficient record management. This builds on the existing filter system and selection capabilities.

## Current State

### ✅ What We Have
- Filter builder component
- Filter parsing and validation
- Record selection (checkboxes)
- Bulk actions toolbar (basic structure)
- Filter application in list views

### ❌ What's Missing
- Saved views/filters persistence
- Saved views management UI
- Bulk operations API endpoints
- Bulk operations UI
- Apply saved views to exports
- Share saved views with team

## Phase 7 Implementation Plan

### 7.1 Saved Views Database Schema

**Migration File:**
- `supabase/migrations/20251204000010_crm_saved_views.sql`

**Tables to Create:**
1. **`crm_saved_views`**
   ```sql
   CREATE TABLE crm_saved_views (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     workspace_id UUID NOT NULL REFERENCES crm_workspaces(id) ON DELETE CASCADE,
     created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     name VARCHAR(255) NOT NULL,
     description TEXT,
     entity_type VARCHAR(50) NOT NULL, -- 'person', 'company', 'conversation'
     filter_config JSONB NOT NULL, -- The filter object
     sort_config JSONB, -- Sort configuration
     column_config JSONB, -- Visible columns configuration
     is_shared BOOLEAN DEFAULT false,
     is_default BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Indexes:**
   ```sql
   CREATE INDEX idx_saved_views_workspace ON crm_saved_views(workspace_id);
   CREATE INDEX idx_saved_views_entity_type ON crm_saved_views(entity_type);
   CREATE INDEX idx_saved_views_created_by ON crm_saved_views(created_by);
   CREATE UNIQUE INDEX idx_saved_views_default_per_entity 
     ON crm_saved_views(workspace_id, entity_type, is_default) 
     WHERE is_default = true;
   ```

3. **RLS Policies:**
   ```sql
   -- Users can view their own views and shared views
   CREATE POLICY "Users can view saved views"
     ON crm_saved_views FOR SELECT
     USING (
       created_by = auth.uid() OR 
       is_shared = true
     );
   
   -- Users can create their own views
   CREATE POLICY "Users can create saved views"
     ON crm_saved_views FOR INSERT
     WITH CHECK (created_by = auth.uid());
   
   -- Users can update their own views
   CREATE POLICY "Users can update their own views"
     ON crm_saved_views FOR UPDATE
     USING (created_by = auth.uid());
   
   -- Users can delete their own views
   CREATE POLICY "Users can delete their own views"
     ON crm_saved_views FOR DELETE
     USING (created_by = auth.uid());
   ```

### 7.2 Saved Views API

**Files to Create:**
- `app/api/crm/saved-views/route.ts` - List and create saved views
- `app/api/crm/saved-views/[id]/route.ts` - Get, update, delete saved view
- `app/api/crm/saved-views/[id]/apply/route.ts` - Apply saved view to query

**Endpoints:**

1. **GET `/api/crm/saved-views`**
   - Query params: `entity_type` (optional)
   - Returns: List of saved views for current user + shared views
   - Response:
     ```json
     {
       "saved_views": [
         {
           "id": "uuid",
           "name": "High Value Customers",
           "description": "Customers with >$1000 spent",
           "entity_type": "person",
           "filter_config": {...},
           "sort_config": {...},
           "column_config": {...},
           "is_shared": false,
           "is_default": true,
           "created_by": {...},
           "created_at": "...",
           "updated_at": "..."
         }
       ]
     }
     ```

2. **POST `/api/crm/saved-views`**
   - Body:
     ```json
     {
       "name": "High Value Customers",
       "description": "Customers with >$1000 spent",
       "entity_type": "person",
       "filter_config": {...},
       "sort_config": {...},
       "column_config": {...},
       "is_shared": false,
       "is_default": false
     }
     ```
   - Returns: Created saved view

3. **GET `/api/crm/saved-views/[id]`**
   - Returns: Single saved view

4. **PUT `/api/crm/saved-views/[id]`**
   - Body: Updated saved view fields
   - Returns: Updated saved view

5. **DELETE `/api/crm/saved-views/[id]`**
   - Returns: 204 No Content

6. **POST `/api/crm/saved-views/[id]/apply`**
   - Query params: `limit`, `offset`, `cursor`
   - Returns: Records matching the saved view's filters

### 7.3 Saved Views UI Components

**Files to Create:**
- `components/crm/saved-views-manager.tsx` - Manage saved views (create, edit, delete)
- `components/crm/saved-views-dropdown.tsx` - Dropdown to select/apply saved views
- `components/crm/save-view-dialog.tsx` - Dialog to save current view

**Features:**
1. **Saved Views Dropdown**
   - Show list of saved views
   - Apply saved view (loads filters, sort, columns)
   - Create new saved view from current view
   - Edit/delete saved views
   - Mark as default
   - Share/unshare views

2. **Save View Dialog**
   - Name input
   - Description input
   - Share toggle
   - Set as default toggle
   - Preview of current filters

3. **Saved Views Manager**
   - List all saved views
   - Edit saved view
   - Delete saved view
   - Duplicate saved view
   - Share/unshare
   - Set default

### 7.4 Bulk Operations Database Schema

**No new tables needed** - Use existing selection state and batch operations.

### 7.5 Bulk Operations API

**Files to Create:**
- `app/api/crm/bulk/route.ts` - Bulk operations endpoint

**Endpoint:**

**POST `/api/crm/bulk`**
- Body:
  ```json
  {
    "entity_type": "person",
    "operation": "update", // "update", "delete", "archive", "restore", "add_tags", "remove_tags", "assign"
    "record_ids": ["uuid1", "uuid2", ...],
    "filters": {...}, // Optional: apply to filtered records instead of IDs
    "data": {
      // Operation-specific data
      "tags": ["tag1", "tag2"], // For add_tags/remove_tags
      "assigned_to": "user_id", // For assign
      "field_updates": {...} // For update
    }
  }
  ```
- Returns:
  ```json
  {
    "success": true,
    "affected_count": 25,
    "errors": [] // Any individual record errors
  }
  ```

**Operations:**
1. **Update** - Update multiple records with same data
2. **Delete** - Delete multiple records
3. **Archive** - Archive multiple records
4. **Restore** - Restore archived records
5. **Add Tags** - Add tags to multiple records
6. **Remove Tags** - Remove tags from multiple records
7. **Assign** - Assign records to user
8. **Export** - Export selected records (already exists, integrate)

### 7.6 Bulk Operations UI

**Files to Create/Update:**
- `components/crm/bulk-actions-toolbar.tsx` - Enhanced bulk actions toolbar
- `components/crm/bulk-update-dialog.tsx` - Dialog for bulk updates
- `components/crm/bulk-assign-dialog.tsx` - Dialog for bulk assignment
- `components/crm/bulk-tags-dialog.tsx` - Dialog for bulk tag operations

**Features:**
1. **Bulk Actions Toolbar**
   - Show when records are selected
   - Display count of selected records
   - Action buttons:
     - Update
     - Delete
     - Archive
     - Restore
     - Add Tags
     - Remove Tags
     - Assign
     - Export

2. **Bulk Update Dialog**
   - Field selection (which fields to update)
   - Value input for each field
   - Preview of affected records
   - Confirmation

3. **Bulk Assign Dialog**
   - User/team member selection
   - Preview of affected records
   - Confirmation

4. **Bulk Tags Dialog**
   - Tag selection (multi-select)
   - Add or remove operation
   - Preview of affected records
   - Confirmation

## Implementation Checklist

### Database
- [ ] Create `crm_saved_views` table
- [ ] Create indexes
- [ ] Set up RLS policies
- [ ] Create migration file

### Saved Views API
- [ ] GET `/api/crm/saved-views` - List saved views
- [ ] POST `/api/crm/saved-views` - Create saved view
- [ ] GET `/api/crm/saved-views/[id]` - Get saved view
- [ ] PUT `/api/crm/saved-views/[id]` - Update saved view
- [ ] DELETE `/api/crm/saved-views/[id]` - Delete saved view
- [ ] POST `/api/crm/saved-views/[id]/apply` - Apply saved view

### Saved Views UI
- [ ] Saved views dropdown component
- [ ] Save view dialog component
- [ ] Saved views manager component
- [ ] Integrate into People page
- [ ] Integrate into Companies page
- [ ] Integrate into Conversations page

### Bulk Operations API
- [ ] POST `/api/crm/bulk` - Bulk operations endpoint
- [ ] Implement update operation
- [ ] Implement delete operation
- [ ] Implement archive operation
- [ ] Implement restore operation
- [ ] Implement add_tags operation
- [ ] Implement remove_tags operation
- [ ] Implement assign operation
- [ ] Error handling for partial failures

### Bulk Operations UI
- [ ] Enhanced bulk actions toolbar
- [ ] Bulk update dialog
- [ ] Bulk assign dialog
- [ ] Bulk tags dialog
- [ ] Integrate into People page
- [ ] Integrate into Companies page
- [ ] Integrate into Conversations page
- [ ] Progress indication for bulk operations
- [ ] Success/error notifications

### Integration
- [ ] Apply saved views to exports
- [ ] Apply saved views to bulk operations
- [ ] Keyboard shortcuts for saved views
- [ ] Default view loading

## Estimated Time

- **Database Schema:** 1 hour
- **Saved Views API:** 3-4 hours
- **Saved Views UI:** 4-5 hours
- **Bulk Operations API:** 4-5 hours
- **Bulk Operations UI:** 4-5 hours
- **Integration & Testing:** 2-3 hours

**Total:** ~18-22 hours

## Success Criteria

✅ Users can save current view (filters, sort, columns)  
✅ Users can load saved views  
✅ Users can share saved views with team  
✅ Users can set default views  
✅ Users can perform bulk updates  
✅ Users can perform bulk delete/archive  
✅ Users can perform bulk tag operations  
✅ Users can perform bulk assignment  
✅ Bulk operations show progress and results  
✅ Saved views work with exports  
✅ All operations respect permissions  

## Next Steps After Phase 7

- Phase 8: Performance optimization and real-time updates
- Phase 9: Advanced features (GraphQL API fix, AI integration)
- Phase 10: Polish and mobile responsiveness


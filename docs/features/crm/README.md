# CRM System Feature Documentation

## Overview

The CRM (Customer Relationship Management) system is a comprehensive solution for managing customer interactions across multiple platforms including email, Instagram, Facebook, WhatsApp, and Shopify. It provides a unified interface for tracking conversations, managing contacts, and organizing customer data.

## Implementation Status

### ✅ Completed Features

1. **Database Schema**
   - Multi-platform support (email, Instagram, Facebook, WhatsApp, Shopify)
   - Customer and company records
   - Conversation and message tracking
   - Activity timeline
   - Custom fields system
   - Contact deduplication
   - AI enrichment tables

2. **API Endpoints**
   - People API (CRUD operations)
   - Companies API (CRUD operations)
   - Activities API (CRUD operations)
   - Custom Fields API (field definitions and values)
   - Search API (global search across entities)
   - Email Accounts API
   - Facebook/WhatsApp Connect & Sync APIs
   - Contact Deduplication API
   - AI Enrichment & Insights APIs

3. **UI Components**
   - People list and detail pages
   - Companies list and detail pages
   - Unified inbox for all platforms
   - Global search (Cmd+K)
   - Filter builder
   - Timeline component
   - Platform badges
   - Custom fields panel
   - Tags manager
   - Activity creator
   - Contact deduplication UI

4. **Integration Features**
   - Gmail sync (for admin users)
   - Instagram webhook handler
   - Resend email webhook handler
   - WhatsApp webhook handler (structure ready)

## Technical Implementation

### Database Schema

The CRM system uses the following main tables:

- `crm_customers` - Customer/contact records
- `crm_companies` - Company/organization records
- `crm_conversations` - Conversation threads
- `crm_messages` - Individual messages
- `crm_activities` - Activity timeline entries
- `crm_custom_fields` - Custom field definitions
- `crm_custom_field_values` - Custom field values
- `crm_email_accounts` - Connected email accounts
- `crm_facebook_accounts` - Facebook account connections
- `crm_whatsapp_accounts` - WhatsApp account connections
- `crm_contact_identifiers` - Contact identifier mapping for deduplication
- `crm_contact_merge_history` - History of contact merges
- `crm_ai_insights` - AI-generated insights
- `crm_ai_enrichment` - AI-enriched data

### API Endpoints

#### People API
- `GET /api/crm/people` - List people with search and pagination
- `POST /api/crm/people` - Create a new person
- `GET /api/crm/people/[id]` - Get person details
- `PUT /api/crm/people/[id]` - Update person
- `DELETE /api/crm/people/[id]` - Delete person

#### Companies API
- `GET /api/crm/companies` - List companies with search and pagination
- `POST /api/crm/companies` - Create a new company
- `GET /api/crm/companies/[id]` - Get company details
- `PUT /api/crm/companies/[id]` - Update company
- `DELETE /api/crm/companies/[id]` - Delete company

#### Activities API
- `GET /api/crm/activities` - List activities with filters
- `POST /api/crm/activities` - Create a new activity
- `GET /api/crm/activities/[id]` - Get activity details
- `PUT /api/crm/activities/[id]` - Update activity
- `DELETE /api/crm/activities/[id]` - Delete activity

#### Custom Fields API
- `GET /api/crm/fields` - List field definitions
- `POST /api/crm/fields` - Create a new field definition
- `GET /api/crm/fields/[id]` - Get field definition
- `PUT /api/crm/fields/[id]` - Update field definition
- `DELETE /api/crm/fields/[id]` - Delete field definition
- `GET /api/crm/fields/values` - Get field values for an entity
- `POST /api/crm/fields/values` - Set field value
- `DELETE /api/crm/fields/values` - Delete field value

#### Search API
- `GET /api/crm/search?q=query` - Global search across people, companies, and conversations

#### Deduplication API
- `GET /api/crm/contacts/duplicates` - Find duplicate contacts
- `POST /api/crm/contacts/duplicates` - Merge duplicate contacts

### UI Pages

#### Main Pages
- `/admin/crm` - CRM dashboard
- `/admin/crm/people` - People list
- `/admin/crm/people/[id]` - Person detail page
- `/admin/crm/people/new` - Create new person
- `/admin/crm/people/[id]/edit` - Edit person
- `/admin/crm/companies` - Companies list
- `/admin/crm/companies/[id]` - Company detail page
- `/admin/crm/companies/new` - Create new company
- `/admin/crm/companies/[id]/edit` - Edit company
- `/admin/crm/inbox` - Unified inbox
- `/admin/crm/search` - Search results page
- `/admin/crm/settings` - Settings page
- `/admin/crm/settings/email-accounts` - Email accounts management
- `/admin/crm/settings/integrations` - Integrations management
- `/admin/crm/settings/fields` - Custom fields management

## Usage

### Creating a Person

1. Navigate to `/admin/crm/people`
2. Click "Add Person"
3. Fill in the form with contact information
4. Add tags (comma-separated)
5. Click "Create Person"

### Creating a Company

1. Navigate to `/admin/crm/companies`
2. Click "Add Company"
3. Fill in company information
4. Add tags if needed
5. Click "Create Company"

### Managing Custom Fields

1. Navigate to `/admin/crm/settings/fields`
2. Click "Create Field"
3. Define field name, type, and entity type
4. For select fields, add options
5. Save the field
6. Field will appear in person/company detail pages

### Finding and Merging Duplicates

1. Navigate to a person detail page
2. Scroll to "Duplicate Contacts" section
3. Review suggested duplicates
4. Click "Merge" to combine contacts
5. All data from both contacts will be merged

### Creating Activities

1. Navigate to a person or company detail page
2. Go to the "Timeline" tab
3. Click "Add Activity"
4. Select activity type (note, task, call, meeting, email)
5. Fill in details
6. For tasks/meetings, set due date and priority
7. Click "Create Activity"

### Managing Tags

1. Navigate to a person or company detail page
2. In the "Properties" panel, find the Tags section
3. Click "Add Tag" to create a new tag
4. Click the X on a tag to remove it
5. Tags are automatically saved

## Integration Setup

### Gmail Integration

1. Admin users must log in via `/admin-login`
2. Gmail scopes are automatically requested
3. Navigate to CRM dashboard
4. Click "Sync Gmail" to fetch emails
5. Emails are automatically logged to CRM

### Instagram Integration

1. Configure Instagram webhook in Meta Developer Console
2. Webhook endpoint: `/api/webhooks/instagram`
3. Messages are automatically logged to CRM

### Email Integration (Resend)

1. Configure Resend webhook
2. Webhook endpoint: `/api/webhooks/resend`
3. Inbound emails are automatically logged to CRM

## Known Limitations

1. **Facebook/WhatsApp OAuth**: UI is ready but OAuth flows need to be implemented
2. **AI Enrichment**: API endpoints exist but actual AI service integration is pending
3. **Real-time Updates**: Currently uses polling; WebSocket/SSE support planned
4. **Bulk Operations**: Not yet implemented
5. **Export Functionality**: Not yet implemented
6. **Saved Views**: Not yet implemented

## Future Improvements

1. Real-time message updates via WebSocket/SSE
2. Advanced filtering and saved views
3. Bulk operations (edit, tag, delete)
4. Export to CSV/JSON
5. AI-powered contact matching
6. Automated insights generation
7. Email composition UI
8. Conversation assignment
9. Task management UI
10. Advanced search with filters

## Related Documentation

- [CRM Migration Guide](/docs/CRM_MIGRATION_GUIDE.md)
- [Gmail OAuth Setup](/docs/GMAIL_OAUTH_SETUP.md)
- [Admin OAuth Configuration](/docs/FIX_ADMIN_OAUTH_REDIRECT.md)

## Version

- Last Updated: 2025-12-03
- Version: 1.0.0


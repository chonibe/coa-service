# Vendor Product Creation Feature

## Overview

The Vendor Product Creation feature allows vendors to submit new products to the store through a comprehensive product creation wizard. Products go through an admin approval workflow before being published to Shopify. Each vendor has their own collection and tags automatically assigned to their products.

## Feature Components

### 1. Product Creation Wizard

A multi-step wizard that guides vendors through creating a product submission:

- **Step 1: Basic Information**
  - Product title (required)
  - Description (HTML supported)
  - Product type
  - URL handle (auto-generated if not provided)
  - Vendor (auto-assigned)

- **Step 2: Variants & Pricing**
  - Price (required)
  - Compare at price
  - SKU
  - Inventory quantity
  - Weight and dimensions
  - Inventory management settings
  - Shipping requirements

- **Step 3: Images**
  - Multiple product images via URL
  - Alt text for each image
  - Image preview
  - Primary image selection

- **Step 4: Additional Details**
  - Tags (comma-separated or individual)
  - Vendor collection (auto-assigned)
  - Metafields (dynamic from Shopify definitions)
  - Custom metafields

- **Step 5: Review & Submit**
  - Complete product preview
  - Summary of all entered information
  - Submit for approval

### 2. Submission Workflow

#### Vendor Side:
1. Vendor creates product using the wizard
2. Submission saved with status `pending`
3. Vendor can view submissions in the Products tab
4. Vendor can edit pending/rejected submissions

#### Admin Side:
1. Admin views pending submissions
2. Admin reviews product details
3. Admin can approve or reject
   - **Approve**: Sets status to `approved`, allows publishing
   - **Reject**: Sets status to `rejected`, requires reason
4. Admin publishes approved products to Shopify
5. Product automatically assigned to vendor collection
6. Vendor tags automatically added

## Database Schema

### vendor_product_submissions

Stores product submissions with the following structure:

```sql
- id (uuid, primary key)
- vendor_id (integer, foreign key)
- vendor_name (text)
- status (enum: 'pending', 'approved', 'rejected', 'published')
- shopify_product_id (text, nullable)
- product_data (jsonb) - Complete product submission data
- admin_notes (text, nullable)
- rejection_reason (text, nullable)
- submitted_at (timestamptz)
- approved_at (timestamptz, nullable)
- published_at (timestamptz, nullable)
- approved_by (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### vendor_collections

Tracks vendor collections in Shopify:

```sql
- id (uuid, primary key)
- vendor_id (integer, foreign key)
- vendor_name (text)
- shopify_collection_id (text, nullable)
- shopify_collection_handle (text)
- collection_title (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

## API Endpoints

### Vendor Endpoints

#### GET `/api/vendor/products/create/fields`
Fetches available product fields and metafield definitions from Shopify.

**Response:**
```json
{
  "fields": [...],
  "metafields": [...],
  "vendor_collections": [...]
}
```

#### POST `/api/vendor/products/submit`
Submits a new product for approval.

**Request Body:**
```json
{
  "product_data": {
    "title": "string",
    "description": "string",
    "product_type": "string",
    "vendor": "string",
    "handle": "string",
    "tags": ["string"],
    "variants": [...],
    "images": [...],
    "metafields": [...]
  }
}
```

#### GET `/api/vendor/products/submissions`
Lists all submissions for the authenticated vendor.

**Query Parameters:**
- `status` (optional): Filter by status

#### GET `/api/vendor/products/submissions/[id]`
Gets a specific submission by ID.

#### PUT `/api/vendor/products/submissions/[id]`
Updates a submission (only if status is 'pending' or 'rejected').

### Admin Endpoints

#### GET `/api/admin/products/submissions`
Lists all product submissions.

**Query Parameters:**
- `status` (optional): Filter by status
- `vendor_id` (optional): Filter by vendor
- `page` (optional): Page number
- `limit` (optional): Items per page

#### GET `/api/admin/products/submissions/[id]`
Gets a specific submission with vendor details.

#### POST `/api/admin/products/submissions/[id]/approve`
Approves a pending submission.

**Request Body:**
```json
{
  "product_data": {...}, // Optional: modified product data
  "admin_notes": "string" // Optional
}
```

#### POST `/api/admin/products/submissions/[id]/reject`
Rejects a submission.

**Request Body:**
```json
{
  "reason": "string" // Required
}
```

#### POST `/api/admin/products/submissions/[id]/publish`
Publishes an approved product to Shopify.

#### GET `/api/admin/vendor-collections`
Lists all vendor collections.

## Shopify Integration

### Collection Management

- **Auto-creation**: Vendor collections are automatically created if they don't exist
- **Naming**: Collections use format `{Vendor Name} Collection`
- **Handle**: Generated from vendor name (lowercase, hyphenated)

### Product Publishing

When a product is published:

1. Product created in Shopify via Admin API
2. Variants created with pricing and inventory
3. Images uploaded
4. Metafields set
5. Product assigned to vendor collection
6. Vendor tag automatically added
7. Submission status updated to `published`
8. Shopify product ID stored

## UI Pages

### Vendor Pages

- `/vendor/dashboard/products` - Products list with submissions tab
- `/vendor/dashboard/products/create` - Product creation wizard

### Admin Pages

- `/admin/products/submissions` - Submissions list
- `/admin/products/submissions/[id]` - Submission detail and review

## File Structure

```
app/
├── vendor/
│   └── dashboard/
│       └── products/
│           ├── page.tsx (updated with submissions tab)
│           └── create/
│               ├── page.tsx
│               └── components/
│                   ├── product-wizard.tsx
│                   ├── basic-info-step.tsx
│                   ├── variants-step.tsx
│                   ├── images-step.tsx
│                   ├── metafields-step.tsx
│                   └── review-step.tsx
├── admin/
│   └── products/
│       └── submissions/
│           ├── page.tsx
│           └── [id]/
│               └── page.tsx
└── api/
    ├── vendor/
    │   └── products/
    │       ├── create/
    │       │   └── fields/
    │       │       └── route.ts
    │       ├── submit/
    │       │   └── route.ts
    │       └── submissions/
    │           ├── route.ts
    │           └── [id]/
    │               └── route.ts
    └── admin/
        ├── products/
        │   └── submissions/
        │       ├── route.ts
        │       └── [id]/
        │           ├── route.ts
        │           ├── approve/
        │           │   └── route.ts
        │           ├── reject/
        │           │   └── route.ts
        │           └── publish/
        │               └── route.ts
        └── vendor-collections/
            └── route.ts

lib/
└── shopify/
    ├── collections.ts
    ├── product-creation.ts
    └── metafields.ts

types/
└── product-submission.ts

supabase/
└── migrations/
    └── 20250123000000_vendor_product_submissions.sql
```

## Implementation Details

### Product Data Structure

The `product_data` JSONB field stores:

```typescript
{
  title: string
  description?: string
  product_type?: string
  vendor: string
  handle?: string
  tags?: string[]
  variants: Array<{
    price: string
    sku?: string
    compare_at_price?: string
    inventory_quantity?: number
    inventory_management?: 'shopify' | null
    requires_shipping?: boolean
    weight?: number
    weight_unit?: string
  }>
  images?: Array<{
    src: string
    alt?: string
    position?: number
  }>
  metafields?: Array<{
    namespace: string
    key: string
    value: string
    type: string
  }>
}
```

### Status Flow

```
pending → approved → published
       ↘ rejected (can be edited and resubmitted)
```

## Testing Requirements

### Vendor Flow
- [ ] Create product submission
- [ ] View submissions list
- [ ] Edit pending submission
- [ ] Edit rejected submission
- [ ] Cannot edit approved/published submissions

### Admin Flow
- [ ] View submissions list
- [ ] Filter by status/vendor
- [ ] View submission details
- [ ] Approve submission
- [ ] Reject submission with reason
- [ ] Publish approved product to Shopify
- [ ] Verify product in vendor collection
- [ ] Verify vendor tags applied

### Shopify Integration
- [ ] Collection auto-creation
- [ ] Product creation with all fields
- [ ] Image upload
- [ ] Metafield setting
- [ ] Collection assignment
- [ ] Tag assignment

## Known Limitations

1. Image uploads currently only support URLs (not file uploads)
2. Only single-variant products fully supported initially
3. Metafield definitions are fetched from Shopify but cached for 24 hours
4. Product creation uses Shopify REST API (2024-01 version)

## Future Improvements

1. File upload support for images
2. Multiple variant support with options (size, color, etc.)
3. Real-time metafield definition updates
4. Bulk submission approval
5. Product template/save draft functionality
6. Image optimization before upload
7. Product duplication/cloning

## Related Features

- Vendor Dashboard
- Vendor Payouts System
- Shopify Product Sync

## Support

For issues or questions, contact the development team or refer to the main project README.


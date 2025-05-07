# Admin Dashboard Documentation

## Overview

The Admin Dashboard provides comprehensive tools for managing products, edition numbers, certificates, vendors, payouts, and system settings. This section of the application is designed for administrators to manage all aspects of the product edition tracking system.

## Pages

### Main Dashboard (`/admin/page.tsx`)

The main entry point for administrators, featuring:

- Product selection for edition number synchronization
- Batch processing capabilities
- Database connection testing
- Sync progress monitoring
- Results display with filtering options

#### Key Features:
- Select individual products or all products for processing
- Force sync option to re-assign all edition numbers
- Real-time progress updates during sync operations
- Detailed results view with success/error filtering
- Database connection testing

### Product Editions (`/admin/product-editions/[productId]/page.tsx`)

View and manage edition numbers for a specific product:

- List of all line items with assigned edition numbers
- Edition number details including order information
- Ability to manually adjust edition numbers
- Filter and search capabilities

#### Key Features:
- View all edition numbers for a product
- See order details for each edition
- Manual resequencing of edition numbers
- Export edition data

### Certificates Management (`/admin/certificates/management/page.tsx`)

Manage digital certificates for products:

- View all certificates in the system
- Filter by product, status, or search term
- Generate new certificates
- View certificate access logs

#### Key Features:
- Certificate generation
- Status management
- Access tracking
- Bulk operations

### NFC Tag Management (`/admin/certificates/nfc/page.tsx`)

Create and manage NFC tags for physical products:

- Create individual or bulk NFC tags
- Assign tags to specific line items
- Track tag status and usage
- Program physical NFC tags

#### Key Features:
- Tag creation and assignment
- Status tracking
- Programming data generation
- Verification tools

### Vendor Management (`/admin/vendors/page.tsx`)

Manage vendor information and settings:

- View all vendors in the system
- Edit vendor details and contact information
- Set vendor payout preferences
- View vendor products and sales

#### Key Features:
- Vendor information management
- Custom data fields
- Instagram and social media links
- Notes and internal information

### Vendor Payouts (`/admin/vendors/payouts/page.tsx`)

Manage vendor payouts and payment settings:

- Configure payout percentages for vendors
- Set product-specific payout rates
- View payout history
- Process new payouts

#### Key Features:
- Payout rate configuration
- Product-specific settings
- Payout processing
- Payment history

### Tax Reporting (`/admin/tax-reporting/page.tsx`)

Generate and manage tax forms for vendors:

- Generate tax forms for selected vendors
- View tax form history
- Download and send tax forms
- Track tax form status

#### Key Features:
- Form generation
- Year selection
- Bulk processing
- Status tracking

### Settings (`/admin/settings/page.tsx`)

Configure system-wide settings:

- API connection settings
- Webhook configuration
- Email templates
- System preferences

#### Key Features:
- System configuration
- Integration settings
- Template management
- User preferences

## Components

### Breadcrumb (`/app/admin/components/breadcrumb.tsx`)
Navigation component showing the current location in the admin hierarchy.

### Bottom Nav (`/app/admin/components/bottom-nav.tsx`)
Mobile-friendly navigation bar for the admin dashboard.

### Vendor Dialog (`/app/admin/vendors/vendor-dialog.tsx`)
Modal dialog for editing vendor information.

### Onboarding Setup (`/app/admin/settings/onboarding-setup.tsx`)
Configuration component for vendor onboarding settings.

## Common Workflows

### Syncing Edition Numbers

1. Navigate to the main admin dashboard
2. Select products to sync (individual or all)
3. Toggle "Force sync" if needed
4. Click "Sync Selected Products"
5. Monitor progress in real-time
6. View results after completion

### Managing Vendor Payouts

1. Navigate to Vendor Payouts
2. Select a vendor
3. Configure payout percentages for products
4. Save settings
5. Process payouts when ready
6. Track payout status

### Generating Tax Forms

1. Navigate to Tax Reporting
2. Select tax year
3. Select vendors
4. Choose form type
5. Generate forms
6. Download or send forms to vendors

## Troubleshooting

### Sync Issues

If product synchronization fails:

1. Check database connection using the "Test Database Connection" button
2. Verify Shopify API credentials
3. Check for rate limiting issues
4. Look for specific error messages in the sync results

### Missing Products

If products are not appearing:

1. Verify the product exists in Shopify
2. Check if the product has any orders
3. Ensure the Shopify sync is working properly
4. Try using the search function with different fields

### Payout Processing Errors

If payout processing fails:

1. Check Stripe connection status
2. Verify vendor has completed Stripe onboarding
3. Ensure sufficient funds in the platform account
4. Check for API rate limiting issues

## API Integration

The admin dashboard interacts with various API endpoints:

- `/api/get-all-products`: Fetches products for selection
- `/api/sync-all-products`: Processes edition number synchronization
- `/api/test-supabase-connection`: Tests database connectivity
- `/api/editions/resequence`: Manually resequences edition numbers
- `/api/vendors/list`: Retrieves vendor information
- `/api/vendors/payouts/process`: Processes vendor payouts
- `/api/tax-reporting/generate-forms`: Generates tax forms

See the API documentation for detailed information on these endpoints.

## Security

The admin dashboard is protected by authentication middleware. All requests require valid admin credentials.

## Performance Considerations

- Product selection uses pagination to handle large catalogs
- Sync operations process products in batches
- Long-running operations provide progress updates
- Database queries are optimized for performance
\`\`\`

Now, let's create detailed API documentation:

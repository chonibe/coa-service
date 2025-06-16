# COA Service (Certificate of Authenticity Platform)

## Overview

COA Service is a comprehensive digital art authentication and management platform that leverages NFC technology to provide secure, verifiable certificates for digital artworks.

## Key Features

### 🖼️ Digital Art Management
- Secure artwork tracking
- Edition management
- Certificate generation

### 🏷️ NFC Authentication
- Web NFC tag scanning
- Digital artwork verification
- Secure claim process

### 🔒 Security Highlights
- Unique certificate generation
- NFC tag pairing
- Ownership verification

## NFC Pairing Technology

### How It Works
- Scan NFC tag using Web NFC API
- Verify artwork authenticity
- Claim digital certificate

### Compatibility
- Supported Browsers: Chrome, Edge, Opera
- Platforms: Web-based

[📖 Full NFC Pairing Documentation](/docs/NFC_PAIRING.md)

## Technical Stack

- Frontend: Next.js, React
- Backend: Supabase
- Authentication: Shopify OAuth
- NFC Technology: Web NFC API

## Getting Started

### Prerequisites
- Node.js 16+
- Supabase Account
- Shopify Developer Account

### Installation
```bash
git clone https://github.com/chonibe/coa-service.git
cd coa-service
npm install
```

### Configuration
1. Copy `.env.example` to `.env`
2. Fill in Supabase and Shopify credentials

### Running the Application
```bash
npm run dev
```

## Documentation

- [NFC Pairing](/docs/NFC_PAIRING.md)
- [Authentication](/docs/authentication/README.md)
- [Dashboard Guides](/docs/README.md)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

Proprietary - Street Collector

## Support

Contact: support@streetcollector.com

# Order Lookup & Vendor Portal

A Next.js application for managing product editions, certificates, and vendor payouts.

## Project Overview

This application provides several key functionalities:

1. **Admin Dashboard**: Manage products, editions, certificates, and vendor payouts
2. **Vendor Portal**: Allow vendors to view their sales, products, and payouts
3. **Certificate Management**: Generate and manage certificates for products
4. **NFC Tag Management**: Create, assign, and manage NFC tags for products
5. **Stripe Integration**: Process vendor payouts via Stripe

## Project Structure

### Core Directories

- `/app`: Next.js App Router pages and API routes
- `/components`: Reusable UI components
- `/hooks`: Custom React hooks
- `/lib`: Utility functions and API clients
- `/db`: SQL scripts for database setup and migrations

### Key Pages

#### Admin Pages

- `/app/admin/page.tsx`: Main admin dashboard
- `/app/admin/sync-products/page.tsx`: Sync products from Shopify
- `/app/admin/product-editions/[productId]/page.tsx`: Manage editions for a specific product
- `/app/admin/certificates/management/page.tsx`: Certificate management
- `/app/admin/certificates/nfc/page.tsx`: NFC tag management
- `/app/admin/vendors/page.tsx`: Vendor management
- `/app/admin/vendors/payouts/page.tsx`: Vendor payout management
- `/app/admin/tax-reporting/page.tsx`: Tax reporting tools

#### Vendor Pages

- `/app/vendor/login/page.tsx`: Vendor login
- `/app/vendor/dashboard/page.tsx`: Vendor dashboard
- `/app/vendor/dashboard/products/page.tsx`: Vendor products
- `/app/vendor/dashboard/payouts/page.tsx`: Vendor payouts
- `/app/vendor/dashboard/analytics/page.tsx`: Vendor analytics
- `/app/vendor/dashboard/settings/page.tsx`: Vendor settings
- `/app/vendor/onboarding/page.tsx`: Vendor onboarding

#### Public Pages

- `/app/certificate/[lineItemId]/page.tsx`: Public certificate view
- `/app/pages/authenticate/page.tsx`: NFC tag authentication

### API Routes

#### Admin APIs

- `/app/api/get-all-products/route.ts`: Get all products
- `/app/api/assign-edition-numbers/route.ts`: Assign edition numbers
- `/app/api/editions/sync-status/route.ts`: Check edition sync status
- `/app/api/editions/resequence/route.ts`: Resequence edition numbers
- `/app/api/shopify/webhook-status/route.ts`: Check Shopify webhook status
- `/app/api/shopify/test-webhook/route.ts`: Test Shopify webhook
- `/app/api/shopify/sync-status/route.ts`: Check Shopify sync status
- `/app/api/shopify/sync-history/route.ts`: Get Shopify sync history
- `/app/api/certificate/generate/route.ts`: Generate certificates
- `/app/api/nfc-tags/list/route.ts`: List NFC tags
- `/app/api/nfc-tags/create/route.ts`: Create NFC tags
- `/app/api/nfc-tags/assign/route.ts`: Assign NFC tags
- `/app/api/vendors/list/route.ts`: List vendors
- `/app/api/vendors/payouts/route.ts`: Manage vendor payouts
- `/app/api/tax-reporting/generate-forms/route.ts`: Generate tax forms

#### Vendor APIs

- `/app/api/vendor/login/route.ts`: Vendor login
- `/app/api/vendor/profile/route.ts`: Get vendor profile
- `/app/api/vendor/update-paypal/route.ts`: Update vendor PayPal
- `/app/api/vendor/stats/route.ts`: Get vendor stats
- `/app/api/vendor/sales/route.ts`: Get vendor sales
- `/app/api/vendor/payouts/route.ts`: Get vendor payouts
- `/app/api/stripe/create-account/route.ts`: Create Stripe account
- `/app/api/stripe/onboarding-link/route.ts`: Get Stripe onboarding link
- `/app/api/stripe/account-status/route.ts`: Check Stripe account status
- `/app/api/stripe/process-payout/route.ts`: Process Stripe payout

#### Public APIs

- `/app/api/certificate/[lineItemId]/route.ts`: Get certificate
- `/app/api/nfc-tags/verify/route.ts`: Verify NFC tag
- `/app/api/nfc-tags/claim/route.ts`: Claim NFC tag

### Utility Libraries

- `/lib/shopify-api.ts`: Shopify API client
- `/lib/supabase.ts`: Supabase client
- `/lib/stripe.ts`: Stripe client
- `/lib/data-access.ts`: Database access functions
- `/lib/utils.ts`: Utility functions

## Environment Variables

The application requires several environment variables to function properly:

- Shopify API credentials
- Supabase credentials
- Stripe API keys
- Email service credentials
- Various configuration options

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the development server: `npm run dev`

## Database Setup

The application uses Supabase as its database. SQL scripts for setting up the database tables are located in the `/db` directory.

## Webhook Configuration

The application uses webhooks to sync data from Shopify. The webhook endpoints need to be configured in the Shopify admin.

## Cron Jobs

The application uses cron jobs for various tasks:

- Syncing Shopify orders
- Checking for missing orders
- Processing Stripe transfers

## Vendor Portal

The vendor portal allows vendors to:

- View their sales and revenue
- Track their products
- Manage their payouts
- Update their settings
- View analytics

## Stripe Integration

The application integrates with Stripe Connect to process vendor payouts. Vendors can connect their Stripe accounts to receive payouts.

## Custom Date Ranges

Vendors can select custom date ranges to view their sales data. This allows for flexible reporting and analysis.

## Support

For support, please contact the development team.

# COA Service

## Edition Number Assignment System

### Overview
The edition number assignment system allows for automatic assignment of edition numbers to line items based on their product type (limited or open edition). The system includes both backend functionality and a user interface for managing editions.

### Key Features
- Automatic edition number assignment for line items
- Support for both limited and open editions
- UI for viewing and managing edition numbers
- Ability to revoke and reassign edition numbers
- Type standardization for product IDs

### Database Changes
1. **Product ID Type Standardization**
   - Standardized `product_id` column type across tables
   - Added type casting and comparison functions
   - Implemented safe type conversion for product IDs

2. **Edition Number Management**
   - Added `edition_number` and `edition_total` columns to line items
   - Created triggers for edition number assignment
   - Implemented functions for revoking and reassigning editions

### API Endpoints
1. **Edition Assignment**
   - `/api/editions/assign-all` - Assigns edition numbers to all line items
   - `/api/editions/assign-numbers` - Assigns edition numbers to specific line items
   - `/api/editions/revoke` - Revokes edition numbers from line items

2. **Type Checking**
   - `/api/editions/check-types` - Checks for type mismatches in product IDs
   - `/api/editions/check-specific-product-ids` - Checks specific product IDs for type issues

### UI Components
1. **Product Editions Page**
   - View all line items for a product
   - Assign edition numbers
   - Revoke edition numbers
   - View edition details

2. **Assign Edition Numbers Button**
   - Client-side component for triggering edition number assignment
   - Handles loading states and error messages
   - Provides feedback on assignment success/failure

### Type Safety
- Implemented strict type checking for product IDs
- Added type conversion functions to handle different ID formats
- Standardized type usage across the application

### Error Handling
- Comprehensive error handling for type mismatches
- User-friendly error messages
- Logging for debugging purposes

### Usage
1. Navigate to the product editions page
2. View existing line items and their edition numbers
3. Use the "Assign Edition Numbers" button to assign numbers
4. Use the "Revoke" button to remove edition numbers if needed

### Technical Notes
- All product IDs are handled as strings internally
- Edition numbers are assigned sequentially
- Limited editions are checked against the total edition count
- Open editions are assigned numbers without limits

### Recent Changes
- Fixed type mismatch issues with product IDs
- Improved error handling and user feedback
- Added type checking endpoints
- Standardized database column types
- Enhanced UI components for better user experience
\`\`\`

Now, let's create a README file specifically for the vendor dashboard to help explain its functionality:

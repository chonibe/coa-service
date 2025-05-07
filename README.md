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
\`\`\`

Now, let's create a README file specifically for the vendor dashboard to help explain its functionality:

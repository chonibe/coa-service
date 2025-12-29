# COA Service (Certificate of Authenticity Platform)

## Overview

COA Service is a comprehensive digital art authentication and management platform that leverages NFC technology to provide secure, verifiable certificates for digital artworks.

## Key Features

### 🖼️ Digital Art Management
- Secure artwork tracking
- Edition management
- Certificate generation
- Collector dashboard for owned artworks, artist journeys, authentication status, and credits
- **Template Preview**: Artist landing page to preview artwork on print templates before onboarding

### 🏷️ NFC Authentication
- Web NFC tag scanning
- Digital artwork verification
- Secure claim process

### 💰 Gumroad-Level Payout System
- **Unified Payment Processing**: PayPal, Stripe, and Bank Transfer support
- **Automated Scheduling**: Bi-weekly, weekly, and monthly payout schedules
- **Real-Time Balance Tracking**: Live balance updates with caching
- **Advanced Analytics**: Revenue trends, payout forecasting, and velocity metrics
- **Instant Payouts**: On-demand payouts with configurable fees
- **Multi-Currency Support**: Real-time exchange rates for GBP, EUR, CAD, AUD, NIS
- **Enhanced Vendor Experience**: Real-time dashboards and notifications

### 🔒 Security Highlights
- Unique certificate generation
- NFC tag pairing
- Ownership verification
- Shopify customer login with optional Google identity provider

### 📞 CRM (Apollo-Grade Foundations)
- Multi-channel CRM with Attio-style filters and new Apollo-grade building blocks (sequences, tasks/calls, deal pipelines, conversation assignment) — see [`docs/features/crm/README.md`](/docs/features/crm/README.md)

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
- Backend: Supabase (Postgres + Edge Functions)
- Authentication: Supabase Auth (Google OAuth) with signed vendor sessions
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
2. Fill in Supabase, Google OAuth, Shopify, and Stripe credentials

### Running the Application
```bash
npm run dev
```

## Documentation

- [NFC Pairing](/docs/NFC_PAIRING.md)
- [Authentication](/docs/authentication/README.md)
- [Dashboard Guides](/docs/README.md)
- [Vendor Login Funnel](/docs/features/vendor-login/README.md)
- [Vendor Dashboard UX/Analytics](/docs/features/vendor-dashboard/README.md)
- [Advanced Payout System](/docs/features/vendor-payouts/README.md)
- [CRM System](/docs/features/crm/README.md)
- [Template Preview](/app/template-preview/README.md) - Artist template preview landing page
- [MCP Servers](/docs/mcp/README.md) - Model Context Protocol servers for Cursor agents
- [ChinaDivision Auto-Fulfillment](/docs/features/chinadivision-auto-fulfillment/README.md)

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

A Next.js application for managing product editions, certificates, and vendor payouts, evolving into an intelligent eCommerce optimization platform.

## VXO Vision

This project is evolving into an Adaptive UX Engine that continuously improves the eCommerce experience through data-driven optimization and AI-powered insights. See [VISION.md](./VISION.md) for detailed roadmap and implementation status.

### Current Phase
- Core feature implementation
- Basic optimization capabilities
- Initial analytics integration

### Next Phase
- Advanced optimization layer
- A/B testing framework
- Enhanced analytics dashboard

## Project Overview

This application provides several key functionalities:

1. **Admin Dashboard**: Manage products, editions, certificates, and vendor payouts
2. **Vendor Portal**: Allow vendors to view their sales, products, and payouts
3. **Certificate Management**: Generate and manage certificates for products
4. **NFC Tag Management**: Create, assign, and manage NFC tags for products
5. **Stripe Integration**: Process vendor payouts via Stripe Connect
6. **Advanced Payout Analytics**: Real-time balance tracking and forecasting
7. **Automated Payout Scheduling**: Bi-weekly, weekly, and monthly options
8. **Multi-Currency Support**: Real-time exchange rates and conversion

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
- `/app/admin/vendors/payouts/page.tsx`: Vendor payout management (legacy)
- `/app/admin/vendors/payouts/admin/page.tsx`: Unified payout processing
- `/app/admin/vendors/payouts/analytics/page.tsx`: Payout analytics dashboard
- `/app/admin/vendors/payouts/schedules/page.tsx`: Payout schedule management
- `/app/admin/tax-reporting/page.tsx`: Tax reporting tools

#### Vendor Pages

- `/app/join-vendor/page.tsx`: Artist vendor landing page (open call)
- `/app/vendor/login/page.tsx`: Vendor login
- `/app/vendor/dashboard/page.tsx`: Vendor dashboard
- `/app/vendor/dashboard/products/page.tsx`: Vendor products
- `/app/vendor/dashboard/payouts/page.tsx`: Vendor payouts with real-time balance
- `/app/vendor/dashboard/settings/page.tsx`: Vendor settings with payout preferences
- `/app/vendor/dashboard/analytics/page.tsx`: Vendor analytics
- `/app/vendor/dashboard/settings/page.tsx`: Vendor settings
- `/app/vendor/onboarding/page.tsx`: Vendor onboarding

#### Public Pages

- `/app/certificate/[lineItemId]/page.tsx`: Public certificate view
- `/app/pages/authenticate/page.tsx`: NFC tag authentication

### API Routes

#### Admin APIs

- `/app/api/get-all-products/route.ts`: Get all products
- `/app/api/admin/login/route.ts`: Issue signed admin session cookies after Supabase OAuth
- `/app/api/admin/logout/route.ts`: Clear admin and vendor sessions
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
- `/app/api/vendors/names/route.ts`: Vendor directory for admin vendor switcher
- `/app/api/vendors/payouts/route.ts`: Manage vendor payouts
- `/app/api/vendors/payouts/process/route.ts`: Unified payout processing
- `/app/api/vendors/payouts/request-instant/route.ts`: Instant payout requests
- `/app/api/vendors/balance/route.ts`: Real-time balance queries
- `/app/api/payouts/analytics/route.ts`: Payout analytics data
- `/app/api/payouts/forecast/route.ts`: Payout forecasting with enhanced algorithms
- `/app/api/tax-reporting/generate-forms/route.ts`: Generate tax forms
- `/app/api/admin/orders/route.ts`: Retrieve orders for admin dashboard
- `/app/api/admin/orders/[orderId]/route.ts`: Retrieve a single order with nested line items
- `/app/api/admin/backup/[type]/route.ts`: Trigger or delete backups
- `/app/api/admin/backup/list/route.ts`: List completed backups
- `/app/api/admin/backup/settings/route.ts`: Manage backup configuration
- `/app/api/admin/run-cron/route.ts`: Execute cron jobs with admin authorization

#### Vendor APIs

- `/app/api/auth/google/start/route.ts`: Initiate Supabase Google OAuth flow
- `/app/api/auth/status/route.ts`: Return Supabase session and vendor context
- `/app/api/auth/impersonate/route.ts`: Allow admins (with `admin_session`) to assume a vendor session
- `/app/api/vendor/profile/route.ts`: Get vendor profile
- `/app/api/vendor/update-paypal/route.ts`: Update vendor PayPal
- `/app/api/vendor/stats/route.ts`: Get vendor stats
- `/app/api/vendor/sales/route.ts`: Get vendor sales
- `/app/api/vendor/payouts/route.ts`: Get vendor payouts
- `/app/api/admin/payouts/schedules/route.ts`: Manage payout schedules
- `/app/api/stripe/create-account/route.ts`: Create Stripe account
- `/app/api/stripe/onboarding-link/route.ts`: Get Stripe onboarding link
- `/app/api/stripe/account-status/route.ts`: Check Stripe account status
- `/app/api/stripe/process-payout/route.ts`: Process Stripe payout (legacy)
- `/lib/payout-processor.ts`: Unified payout processing logic
- `/lib/vendor-balance-calculator.ts`: Real-time balance calculation
- `/lib/currency-converter.ts`: Multi-currency exchange rates
- `/components/payouts/payout-analytics.tsx`: Analytics visualizations

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

Set the following variables in `.env.local` (or your deployment environment):

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `SUPABASE_GOOGLE_CLIENT_ID` | Google OAuth client ID configured for Supabase Auth |
| `SUPABASE_GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `VENDOR_SESSION_SECRET` | 32+ byte secret for signing `vendor_session` cookies |
| `ADMIN_SESSION_SECRET` | 32+ byte secret for signing `admin_session` cookies |
| `SUPABASE_AUTH_ADDITIONAL_REDIRECTS` (optional) | Comma-separated list of extra OAuth redirect URLs |
| Shopify credentials | Used for product sync and customer flows |
| Stripe credentials | Used for vendor payouts |
| Email/SMS credentials | Required for transactional messaging where applicable |

After defining the Google credentials you can synchronise Supabase Auth settings locally and remotely:

```bash
npm run supabase:enable-google
```

This script enables the Google provider and applies the redirect URLs declared in `supabase/config.toml`.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the development server: `npm run dev`

## MCP Servers (Model Context Protocol)

This project includes custom MCP servers that enable Cursor agents to directly access the Supabase database and Shopify store for faster development.

### Features

- **Supabase MCP Server**: Read-only database access with schema inspection, table queries, and relationship discovery
- **Shopify MCP Server**: Read-only API access for product catalog and order information

### Quick Start

1. Install MCP server dependencies:
   ```bash
   cd mcp-servers/supabase-server && npm install && npm run build
   cd ../shopify-server && npm install && npm run build
   ```

2. Configure Cursor (already set up in `~/.cursor/mcp.json`)

3. Restart Cursor to load the MCP servers

For detailed setup instructions, usage examples, and security guidelines, see [MCP Documentation](/docs/mcp/README.md).

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
- Manage their payouts and view real-time balance
- Configure payout preferences and instant payout settings
- Access comprehensive payout analytics and forecasting
- Update their settings
- View analytics
- Sign in with Google (Supabase Auth) and receive a signed `vendor_session` cookie to isolate access
- Admins can impersonate any vendor via `/api/auth/impersonate` to debug dashboard experiences safely

## Stripe Integration

## Advanced Payout System

The COA Service features a Gumroad-level payout system that rivals industry-leading platforms:

### Payment Methods
- **PayPal**: Batch payouts with automatic status tracking
- **Stripe Connect**: Individual transfers with Express account onboarding
- **Bank Transfer**: Manual processing for international vendors

### Automated Features
- **Bi-Weekly Scheduling**: Automatic payouts on 1st and 15th of each month
- **Custom Thresholds**: Configurable minimum payout amounts
- **Real-Time Balances**: Live balance tracking with caching
- **Instant Payouts**: On-demand payments with configurable fees

### Analytics & Forecasting
- **Advanced Forecasting**: Moving average, exponential smoothing, and linear regression models
- **Trend Analysis**: Daily, weekly, and monthly payout trends
- **Velocity Metrics**: Payout frequency and success rates
- **Payment Method Breakdown**: Distribution analysis by payment type

### Multi-Currency Support
- **Real-Time Rates**: Live exchange rate fetching with caching
- **Supported Currencies**: USD, GBP, EUR, CAD, AUD, NIS
- **Automatic Conversion**: Orders processed in original currency, payouts in USD

### Database Enhancements
- **Balance Snapshots**: Historical balance tracking
- **Instant Payout Requests**: On-demand payout request management
- **Enhanced Schedules**: Bi-weekly intervals and payment method preferences

For detailed documentation, see [`docs/features/vendor-payouts/README.md`](/docs/features/vendor-payouts/README.md).

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

## Recent Updates

### Collector Marketplace Vendor Profile Fix
- Corrected vendor profile field selection to use existing Supabase columns in collector APIs [`app/api/collector/marketplace/route.ts`](./app/api/collector/marketplace/route.ts), [`app/api/collector/products/[id]/route.ts`](./app/api/collector/products/%5Bid%5D/route.ts), [`app/api/collector/series/[id]/route.ts`](./app/api/collector/series/%5Bid%5D/route.ts), [`app/api/collector/artists/[name]/route.ts`](./app/api/collector/artists/%5Bname%5D/route.ts).

### Authentication and Performance Cleanup (ef00c42c)
- Removed deprecated NFC authentication files
- Streamlined customer dashboard authentication flow
- Updated Vercel deployment configuration
- Improved overall project structure and code organization

### Project Status
- Current Focus: Enhancing authentication reliability
- Ongoing Improvements: Simplifying integration with Shopify and Supabase

## Deployment

### Vercel Production
- **URL:** https://street-collector-lymtrdiem-chonibes-projects.vercel.app
- **Latest Commit:** 8432db33
- **Environment:** Production

### Deployment Notes
- Configured production-specific environment variables
- Resolved build and configuration challenges
- Continuous integration and deployment (CI/CD) enabled

## 📦 Project Documentation

### Deployment Workflow
For comprehensive guidance on deployment processes, environment configuration, and troubleshooting, please refer to our [Deployment Workflow Documentation](/docs/DEPLOYMENT_WORKFLOW.md).

#### Key Documentation Resources
- [Deployment Workflow](/docs/DEPLOYMENT_WORKFLOW.md) - Detailed guide for deployment configuration and best practices
- [Environment Configuration](/docs/DEPLOYMENT_WORKFLOW.md#environment-configuration-management)
- [Troubleshooting Guide](/docs/DEPLOYMENT_WORKFLOW.md#deployment-troubleshooting-workflow)
- [Admin Portal Access Control](/docs/features/admin-portal/README.md) - Session security hardening and vendor switcher implementation

### Documentation Update Process
1. Keep documentation current with latest project changes
2. Review and update documentation after each significant deployment
3. Encourage team contributions and improvements

### Vendor Portal Enhancements (v1.1.0)
- Added comprehensive bio and artwork story management
- Implemented status tracking for vendor profiles
- New API routes for updating vendor information
- Enhanced product edit page with bio and story inputs
- Database migrations to support new feature

#### Key Features
- 500-character artist bio
- 1000-character artwork story
- Status tracking (incomplete/completed)
- Validation and error handling
- Seamless integration with vendor dashboard

## Remaining Checklist
- [ ] Add UI indicators for bio/story completion status
- [ ] Implement frontend fetching of existing bio/story
- [ ] Create comprehensive test suite
- [ ] Add performance monitoring for new endpoints

## Documentation
- [Vendor Portal Product Management Guide](/docs/vendor-portal/product-management.md)

## Version
- Current Version: 1.1.0
- Last Updated: $(date +"%Y-%m-%d")

# Street Collector Platform

## Overview

Street Collector is a comprehensive digital art platform designed to revolutionize art collection, authentication, and distribution.

## Key Features

- Headless, API-driven architecture
- Robust authentication system
- Advanced webhook integration
- Comprehensive monitoring and logging
- Secure, scalable infrastructure

## System Architecture

### Core Components

1. **Authentication**: Role-based access control
2. **API Management**: Microservices-based approach
3. **Monitoring**: Advanced logging and performance tracking
4. **Webhook Integration**: Event-driven external system communication

## Monitoring and Observability

### Logging System

Our monitoring strategy provides comprehensive visibility into platform operations:

- **Log Levels**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **Performance Tracking**: Detailed operation metrics
- **Error Tracking**: Comprehensive error logging
- **Webhook Monitoring**: Event delivery tracking

### Key Monitoring Features

- Persistent logging in Supabase
- Admin-only access to monitoring data
- Performance and error metrics
- Webhook delivery tracking

## Technology Stack

- **Backend**: Next.js API Routes
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Monitoring**: Custom logging system
- **Webhooks**: Event-driven integration

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase Account
- Environment Configuration

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/street-collector.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Configuration

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `WEBHOOK_SECRET`: Webhook integration secret

## Documentation

- [API Documentation](/docs/API_DOCUMENTATION.md)
- [Authentication Guide](/docs/authentication/README.md)
- [Monitoring Strategy](/docs/MONITORING_STRATEGY.md)
- [Webhook Integration](/docs/WEBHOOK_INTEGRATION.md)

## Monitoring and Logging

Detailed monitoring information can be found in [MONITORING_STRATEGY.md](/docs/MONITORING_STRATEGY.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

- Project Link: [https://github.com/your-org/street-collector](https://github.com/your-org/street-collector)
- Engineering Team: engineering@streetcollector.com

## Version

- Current Version: 1.0.0
- Last Updated: ${new Date().toISOString()}

# Street Collector - Headless Platform

## Architecture Overview
Fully decoupled, API-first platform for digital art collection and management.

### Key Components
- Next.js API Routes
- Supabase Backend
- GraphQL API Layer
- Microservices Architecture

## Implementation Status
- [x] Authentication Middleware
- [x] Webhook Integration
- [x] Monitoring System
- [x] Microservices Decomposition
- [ ] GraphQL API (In Progress)
- [ ] Multi-Region Deployment (Planned)

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account
- GraphQL Playground

### Installation
```bash
npm install
npm run dev
```

## Documentation
- [Headless Architecture](/docs/HEADLESS_ARCHITECTURE.md)
- [Deployment Strategy](/docs/DEPLOYMENT_STRATEGY.md)
- [API Documentation](/docs/API_DOCUMENTATION.md)

## Contributing
Please read our [Contribution Guidelines](/CONTRIBUTING.md)

## License
MIT License

## Project Status

### Recent Updates
- [x] Enhanced customer authentication flow
- [x] Improved error logging in middleware
- [x] Robust customer orders API endpoint
- [ ] Ongoing: Continuous performance optimization

Last updated: $(date +"%Y-%m-%d")
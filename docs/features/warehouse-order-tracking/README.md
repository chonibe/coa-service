# Warehouse Order Tracking Feature

## Overview

The Warehouse Order Tracking feature provides comprehensive order tracking capabilities for orders fulfilled through the ChinaDivision warehouse. It includes both admin and customer-facing interfaces to track orders, view package details, and monitor shipping status.

### References
- Implementation: `app/api/warehouse/orders/auto-fulfill/route.ts`
- Shopify Fulfillment Helper: `lib/shopify/fulfillment.ts`
- Notification Template: `lib/notifications/tracking-link.ts`
- Tests: `tests/chinadivision-auto-fulfillment.md`
- Performance tracking: `lib/monitoring/README.md`
- Version: 1.1.1
- Change log: Added ChinaDivision auto-fulfillment + customer email automation (2025-12-11)

## Features

- **Admin Dashboard**: View and manage all warehouse orders with date range filtering
- **Shareable Tracking Links**: Admin can select orders and generate shareable links (no login required)
- **Public Tracking Page**: Customers access orders via shareable link without authentication
- **Customer Portal**: Customers can view their own warehouse orders and track packages
- **Gift Orders Dashboard**: Special dashboard for customers who ordered gifts for multiple recipients (50+ people)
- **Package Tracking**: Track individual packages within orders (supports 50+ packages per order)
- **Real-time Status**: View order status, tracking status, and shipping information
- **Search & Filter**: Search orders by ID, email, name, or tracking number
- **Recipient Management**: View all recipients, their addresses, and delivery status in one place

## Technical Implementation

### API Client

**Location**: `lib/chinadivision/client.ts`

The `ChinaDivisionClient` class handles all interactions with the ChinaDivision API:

- `getOrderInfo(orderId)`: Get single order details
- `getOrdersInfo(start, end)`: Get multiple orders within date range
- `getOrderTrack(orderId)`: Get order tracking information

### API Endpoints

#### Admin Endpoints

1. **GET `/api/warehouse/orders`**
   - Query params: `start` (YYYY-MM-DD), `end` (YYYY-MM-DD)
   - Returns: List of all warehouse orders in date range
   - Authentication: Admin session required

2. **GET `/api/warehouse/orders/[orderId]`**
   - Returns: Single order details with all packages
   - Authentication: Admin session required

3. **GET `/api/warehouse/orders/[orderId]/track`**
   - Returns: Order tracking information
   - Authentication: Admin session required

4. **POST `/api/admin/warehouse-orders/share`**
   - Body: `{ orderIds: string[], title?: string, expiresInDays?: number }`
   - Returns: Shareable tracking link with token
   - Authentication: Admin session required
   - Creates a shareable link for selected orders

5. **GET `/api/admin/warehouse-orders/share`**
   - Returns: List of all tracking links created by the admin
   - Authentication: Admin session required

#### Public Endpoints (No Authentication)

1. **GET `/api/track/[token]`**
   - Returns: Orders associated with the tracking token
   - Authentication: None required (public access)
   - Tracks access count and last accessed time

#### Customer Endpoints

1. **GET `/api/customer/warehouse-orders`**
   - Query params: `start` (optional, defaults to 90 days ago), `end` (optional, defaults to today)
   - Returns: Warehouse orders filtered by customer email
   - Authentication: Shopify customer cookie required
   - Filters orders by matching `ship_email` with customer's email from database

2. **GET `/api/customer/warehouse-orders/all`**
   - Query params: `start` (optional, defaults to 180 days ago), `end` (optional, defaults to today)
   - Returns: ALL warehouse orders linked to customer's Shopify orders (for gift orders)
   - Authentication: Shopify customer cookie required
   - Links warehouse orders to Shopify orders by matching `order_id` with Shopify order ID or order number
   - Use case: Customer who ordered gifts for 50+ recipients with different emails/addresses

### Pages

#### Admin Page

**Location**: `app/admin/warehouse/orders/page.tsx`

Features:
- Date range filtering (start/end dates)
- Search by order ID, email, name, or tracking number
- Order cards with status badges
- Order details modal with package tracking
- Supports viewing orders with 50+ packages

#### Customer Page

**Location**: `app/customer/warehouse-orders/page.tsx`

Features:
- Automatic authentication check (redirects to Shopify login if not authenticated)
- Search by order ID or tracking number
- Order cards with tracking information
- Order details modal with all packages
- Scrollable package list for large orders (50+ packages)

#### Public Tracking Page

**Location**: `app/track/[token]/page.tsx`

Features:
- **No authentication required** - Access via shareable link
- Shows orders associated with the tracking token
- Summary cards with order statistics
- Search and filter functionality
- Order cards with recipient information
- Order details modal with package tracking
- Copy link button to share with others
- Refresh button to update order status

#### Gift Orders Dashboard

**Location**: `app/customer/gift-orders/page.tsx`

Features:
- Shows ALL warehouse orders linked to customer's Shopify orders (regardless of recipient email)
- Perfect for customers who ordered gifts for 50+ recipients
- Summary cards showing total, shipped, in transit, delivered, and pending counts
- Search by recipient name, email, order ID, or tracking number
- Status filtering (all, pending, shipped, in transit, delivered)
- Recipient cards showing:
  - Recipient name and contact information
  - Shipping address
  - Delivery status with visual badges
  - Tracking information
  - Quick action to send notification to recipient
- Order details modal with:
  - Complete recipient information
  - Full shipping address
  - Tracking details with notification button
  - All packages with individual tracking numbers
- Notification feature (placeholder - ready for email integration)

### Components

1. **WarehouseOrderCard** (`app/admin/warehouse/orders/components/WarehouseOrderCard.tsx`)
   - Displays order summary card
   - Shows status badges, shipping address, tracking info
   - Clickable to view details

2. **PackageTracker** (`app/admin/warehouse/orders/components/PackageTracker.tsx`)
   - Displays all packages for an order
   - Scrollable list (600px height) for large orders
   - Shows package details, tracking numbers, product information

## Order Status Mapping

### Order Status
- `0`: Approving
- `10`: Approved
- `11`: Uploaded
- `8`: Picking
- `9`: Packing
- `5`: Packaged
- `2`: Awaiting Shipping
- `3`: Shipped
- `4`: Special Event
- `24`: Processing
- `19`: Reviewing
- `21`: Processing
- `23`: Canceled

### Track Status
- `0`: To be updated
- `101`: In Transit
- `111`: Pick Up
- `112`: Out For Delivery
- `121`: Delivered
- `131`: Alert
- `132`: Expired

## Environment Configuration

### Required Environment Variable

```bash
CHINADIVISION_API_KEY=your_api_key_here
```

**Current API Key**: `5f91972f8d59ec8039cecfec3adcead5`

### Setup Instructions

1. Add `CHINADIVISION_API_KEY` to your Vercel environment variables
2. Set it for Production, Preview, and Development environments
3. Redeploy the application

## Database Schema

### shared_order_tracking_links Table

Stores shareable tracking links created by admins:

- `id` (UUID): Primary key
- `token` (TEXT): Unique token for the link (64-character hex string)
- `order_ids` (TEXT[]): Array of warehouse order IDs from ChinaDivision
- `title` (TEXT): Optional title/description for the link
- `created_by` (TEXT): Admin email who created the link
- `expires_at` (TIMESTAMP): Optional expiration date
- `access_count` (INTEGER): Number of times the link was accessed
- `last_accessed_at` (TIMESTAMP): Last time the link was accessed
- `created_at` (TIMESTAMP): When the link was created
- `updated_at` (TIMESTAMP): Last update time

## Data Flow

### Shareable Link Creation

1. Admin logs in and navigates to warehouse orders page
2. Admin selects orders using checkboxes
3. Admin clicks "Generate Link" button
4. System prompts for optional title and expiration
5. System generates secure random token (64 hex characters)
6. System saves link to database with order IDs
7. System returns shareable URL: `/track/[token]`
8. Admin can copy and share the link with customer

### Public Tracking Access

1. Customer receives shareable link from admin
2. Customer opens link (no login required)
3. System validates token and checks expiration
4. System increments access count
5. System fetches orders from ChinaDivision API
6. System filters to only orders in the link
7. System displays orders to customer
8. Customer can search, filter, and view order details

### Customer Order Tracking (Standard)

1. Customer logs in via Shopify authentication
2. System retrieves customer email from Supabase `orders` table
3. Fetches all warehouse orders from ChinaDivision API (last 90 days by default)
4. Filters orders where `ship_email` matches customer email
5. Displays filtered orders to customer

### Gift Orders Tracking (Multiple Recipients)

1. Customer logs in via Shopify authentication
2. System retrieves all Shopify orders for the customer from Supabase `orders` table
3. Extracts Shopify order IDs and order numbers
4. Fetches all warehouse orders from ChinaDivision API (last 180 days by default)
5. Matches warehouse orders to Shopify orders by:
   - Comparing warehouse `order_id` with Shopify `shopify_id`
   - Comparing warehouse `order_id` with Shopify `id`
   - Comparing warehouse `order_id` with Shopify `order_number`
6. Returns all matched warehouse orders (regardless of recipient email)
7. Displays all recipients with their shipping addresses and delivery status

### Admin Order Management

### Auto-Fulfillment & Notification Flow (New)
1. Cron hits `POST /api/warehouse/orders/auto-fulfill?dryRun=false` with `x-cron-secret`.
2. Fetch last 30 days of ChinaDivision orders.
3. Qualify orders with tracking number and status in transit or shipped.
4. Create or reuse tracking link (`shared_order_tracking_links`) for the order.
5. Upsert notification prefs with `ship_email`; send tracking email (recipient name included) via `sendTrackingUpdateEmail`.
6. Create Shopify fulfillment with tracking number/URL via Fulfillment Orders API (no customer notify from Shopify).
7. Update Supabase `orders` and `order_line_items` fulfillment status and tracking fields.
8. Returns JSON summary (counts, results). Supports `dryRun=true` for safe checks.

1. Admin authenticates with admin session
2. Admin selects date range for orders
3. System fetches all orders from ChinaDivision API for date range
4. Admin can search and filter orders
5. Admin can view detailed order information including all packages

## Package Tracking

Each order can contain multiple packages. The system:

- Displays package count and total item quantity
- Shows individual package details including:
  - Product name and SKU
  - Quantity, color, size
  - Category and supplier
  - Tracking number (if shipped)
  - Shipping method
  - Package number

For enterprise orders with 50+ packages:
- Uses scrollable containers (ScrollArea component)
- Pagination or virtualization can be added if needed
- All packages are loaded but displayed in scrollable view

## API Integration Details

### ChinaDivision API Base URL
```
https://api.chinadivision.com
```

### Authentication
All API requests require the `apikey` header:
```
apikey: your_api_key
```

### Request Format
- Method: POST
- Headers: `Content-Type: application/json`, `apikey: {api_key}`
- Body: JSON with request parameters

### Response Format
```json
{
  "code": 0,
  "msg": "success",
  "data": { ... }
}
```

Error codes:
- `0`: Success
- `1`: Apikey can not be empty
- `2`: Apikey does not exist
- Other codes: See ChinaDivision API documentation

## Testing

### Test Admin Page
1. Log in as admin
2. Navigate to `/admin/warehouse/orders`
3. Set date range (e.g., last 30 days)
4. Verify orders load
5. Click "View Details" on an order
6. Verify package list displays correctly

### Test Customer Page
1. Log in as customer (via Shopify)
2. Navigate to `/customer/warehouse-orders`
3. Verify only customer's orders are displayed
4. Click on an order to view details
5. Verify package tracking information

### Test Large Orders

### Test Auto-Fulfillment (Manual)
1. Ensure `CRON_SECRET`, `CHINADIVISION_API_KEY`, `SHOPIFY_ACCESS_TOKEN`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY` are set.
2. Trigger dry run: `POST /api/warehouse/orders/auto-fulfill?dryRun=true` with header `x-cron-secret: <secret>`; expect `success: true`, no side effects.
3. Trigger live run: `POST /api/warehouse/orders/auto-fulfill` with same header; expect links/emails/fulfillments created and Supabase updated.
4. Verify Shopify order shows fulfillment with tracking number and no duplicate fulfillments.
5. Open emailed link and confirm tracking page renders order and labels.
1. Find or create an order with 50+ packages
2. Verify all packages load
3. Verify scrollable container works
4. Verify performance is acceptable

## Known Limitations

1. **Date Range**: 
   - Standard customer orders default to last 90 days
   - Gift orders default to last 180 days
   - Can be extended via query parameters
2. **Email Matching**: Standard customer orders are matched by exact email (case-insensitive). Ensure customer emails in Shopify match warehouse order emails.
3. **Order Linking**: Gift orders are linked by matching `order_id` between warehouse and Shopify. If order IDs don't match exactly, orders may not appear.
4. **API Rate Limits**: ChinaDivision API may have rate limits. Consider caching if needed.
5. **Real-time Updates**: Orders are fetched on page load. No automatic refresh (users can click Refresh button).
6. **Email Notifications**: Notification feature is implemented but requires email service integration (Resend/SendGrid) to send tracking updates to recipients.

## Future Improvements

1. **Auto-refresh**: Implement periodic auto-refresh for order status
2. **Webhook Integration**: Set up ChinaDivision webhooks for real-time order updates
3. **Email Notifications**: 
   - Complete email notification feature for gift order recipients
   - Send tracking updates when packages are close to delivery
   - Customizable email templates
4. **Export**: Allow exporting order lists to CSV/Excel
5. **Advanced Filtering**: Add filters for status, carrier, etc.
6. **Bulk Actions**: Allow bulk operations on orders (e.g., send notifications to all recipients)
7. **Order Linking**: Improve automatic linking between warehouse and Shopify orders
8. **Recipient Management**: Add ability to update recipient information
9. **Delivery Estimates**: Show estimated delivery dates based on tracking status

## Related Documentation

- [ChinaDivision API Documentation](https://chinadivision.com/api)
- [Environment Variables Setup](../VERCEL_DEPLOYMENT_ENV.md)
- [Customer Authentication](../authentication/README.md)

## Support

For issues or questions:
1. Check ChinaDivision API status
2. Verify API key is correct
3. Check browser console for errors
4. Review server logs for API errors


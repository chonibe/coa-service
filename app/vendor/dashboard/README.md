# Vendor Dashboard

The vendor dashboard provides vendors with a comprehensive view of their sales, products, and payouts.

## Pages

### Main Dashboard (`/app/vendor/dashboard/page.tsx`)

The main dashboard provides an overview of the vendor's performance, including:

- Total products
- Total sales
- Total revenue
- Pending payout
- Sales chart
- Recent activity

#### Period Filtering

Vendors can filter their data by various time periods:

- This month
- Last month
- Last 3 months
- Last 6 months
- This year
- Last year
- All time
- Custom date range

#### Custom Date Range

Vendors can select a custom date range to view their data for a specific period. This is useful for analyzing performance during specific campaigns or events.

### Products (`/app/vendor/dashboard/products/page.tsx`)

The products page displays all products belonging to the vendor, including:

- Product title
- Price
- Total sales
- Total revenue
- Status

### Payouts (`/app/vendor/dashboard/payouts/page.tsx`)

The payouts page displays all payouts to the vendor, including:

- Payout date
- Payout amount
- Payout status
- Payout method

### Analytics (`/app/vendor/dashboard/analytics/page.tsx`)

The analytics page provides detailed analytics on the vendor's performance, including:

- Sales trends
- Product performance
- Customer demographics
- Geographic distribution

### Settings (`/app/vendor/dashboard/settings/page.tsx`)

The settings page allows vendors to update their profile and payment information, including:

- Name
- Email
- Tax information
- Stripe Connect account
- PayPal account

## Components

### Period Filter (`/app/vendor/dashboard/components/period-filter.tsx`)

A dropdown component that allows vendors to select a time period for filtering their data.

### Custom Date Range (`/app/vendor/dashboard/components/custom-date-range.tsx`)

A date picker component that allows vendors to select a custom date range for filtering their data.

### Sales Chart (`/app/vendor/dashboard/components/vendor-sales-chart.tsx`)

A chart component that displays the vendor's sales over time.

### Sales Table (`/app/vendor/dashboard/components/sales-table.tsx`)

A table component that displays detailed information about the vendor's sales.

### Stats Cards (`/app/vendor/dashboard/components/stats-cards.tsx`)

Card components that display key statistics about the vendor's performance.

### Stripe Connect (`/app/vendor/dashboard/components/stripe-connect.tsx`)

A component that allows vendors to connect their Stripe account for receiving payouts.

## API Endpoints

### Stats API (`/app/api/vendor/stats/route.ts`)

Returns statistics about the vendor's performance, including:

- Total products
- Total sales
- Total revenue
- Pending payout

### Sales API (`/app/api/vendor/sales/route.ts`)

Returns detailed information about the vendor's sales.

### Sales Data API (`/app/api/vendor/sales-data/route.ts`)

Returns paginated sales data for the vendor.

### Payouts API (`/app/api/vendor/payouts/route.ts`)

Returns information about the vendor's payouts.

## Data Flow

1. Vendor logs in
2. Vendor session is stored in a cookie
3. Dashboard fetches vendor stats from the API
4. Vendor can filter data by period or custom date range
5. Dashboard updates to display filtered data

## Custom Date Range Implementation

The custom date range feature allows vendors to select a specific date range for viewing their data. This is implemented using:

1. A date picker component (`custom-date-range.tsx`)
2. State management in the `useVendorData` hook
3. API parameters for start and end dates
4. Date range filtering in the database query

## Troubleshooting

### Common Issues

- **No data showing**: Check that the vendor has products and sales
- **Error loading data**: Check the API response for error messages
- **Custom date range not working**: Ensure both start and end dates are selected

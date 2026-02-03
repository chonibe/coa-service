# Admin Analytics Dashboard

## Overview

The Admin Analytics Dashboard provides comprehensive platform-wide insights for administrators, combining internal sales data from Supabase with Google Analytics 4 (GA4) insights for a complete view of the marketplace performance.

## Features

### 1. Platform Overview
- **Total Revenue**: Aggregate revenue across all vendors with growth trends
- **Total Orders**: Order volume with period-over-period comparison
- **Active Vendors**: Count of vendors on the platform
- **Total Collectors**: Number of registered collectors
- **Sales Trends**: Time-series visualization of revenue and order volume

### 2. Vendor Analytics
- **Revenue Distribution**: Bar chart showing revenue by vendor
- **Detailed Vendor Table**: 
  - Total revenue per vendor
  - Order count
  - Product count
  - Average order value
- **Sortable & Exportable Data**
- **Pagination**: Navigate through all vendors with customizable page sizes (10, 20, 50, 100 per page)
- **Row Numbering**: Global index across all pages

### 3. Product Analytics
- **Top Products Report**: Best-selling products across all vendors
- **Product Performance Metrics**:
  - Revenue by product
  - Units sold
  - Vendor attribution
- **Cross-vendor product comparison**
- **Pagination**: Navigate through all products with customizable page sizes (10, 20, 50, 100 per page)
- **Row Numbering**: Global index across all pages

### 4. GA4 Insights Integration
- **Real-time User Tracking**
- **Conversion Funnel Analysis**
- **Artist Performance Metrics**
- **Collection Performance**
- **Traffic Source Analysis**
- **Geographic Performance**
- **Cart Abandonment Rates**
- **Device Breakdown**

## Implementation Files

### Frontend
- **Page Component**: `app/admin/analytics/page.tsx`
  - Main analytics dashboard UI
  - Tab-based navigation (Overview, Vendors, Products, GA4)
  - Time range selector integration
  - Data visualization with Recharts
  - Real-time refresh functionality

### Backend
- **API Route**: `app/api/admin/analytics/route.ts`
  - Fetches aggregated data from `order_line_items_v2`
  - Calculates platform-wide statistics
  - Compares current vs. previous period for growth metrics
  - Aggregates vendor and product performance
  - Generates time-series data for charts

### Navigation
- **Admin Shell**: `app/admin/admin-shell.tsx`
  - Analytics link added to "Overview" section
  - Accessible via `/admin/analytics`

## Data Sources

### Supabase Tables
- `order_line_items_v2`: Sales data with vendor attribution
- `vendors`: Vendor information
- `profiles`: User data for collector counts
- `products`: Product metadata

### Google Analytics 4
- Real-time user data
- E-commerce events (view_item, add_to_cart, purchase)
- Custom dimensions (artist_name, collection_name, etc.)
- Custom metrics (items_per_order, shipping_cost)
- Traffic sources and device data

## API Endpoints

### GET `/api/admin/analytics`

**Query Parameters:**
- `range`: Time range preset (`7d`, `30d`, `90d`, `1y`)
- `from`: Custom start date (ISO 8601)
- `to`: Custom end date (ISO 8601)

**Response:**
```json
{
  "platformStats": {
    "totalRevenue": 50000.00,
    "totalOrders": 250,
    "totalVendors": 15,
    "totalCollectors": 500,
    "totalProducts": 120,
    "revenueGrowth": 12.5,
    "ordersGrowth": 8.3,
    "averageOrderValue": 200.00
  },
  "vendorAnalytics": [
    {
      "vendorName": "Artist Name",
      "totalRevenue": 15000.00,
      "totalOrders": 75,
      "totalProducts": 20,
      "averageOrderValue": 200.00
    }
  ],
  "productAnalytics": [
    {
      "productName": "Product Name",
      "vendorName": "Artist Name",
      "revenue": 5000.00,
      "units": 50
    }
  ],
  "salesByDate": [
    {
      "month": "2025-01",
      "revenue": 10000.00,
      "sales": 50
    }
  ]
}
```

### GET `/api/ga4/insights`

**Query Parameters:**
- `days`: Number of days to fetch (default: 30)
- `realtime`: Include real-time data (default: true)

**Response:**
```json
{
  "artistPerformance": {
    "title": "Artist Performance",
    "data": [...],
    "summary": {...}
  },
  "collectionPerformance": {...},
  "conversionFunnel": {...},
  "trafficAnalysis": {...},
  "geographicPerformance": {...},
  "cartAbandonment": {...},
  "realtimeUsers": {...}
}
```

## Usage

### Accessing the Dashboard
1. Navigate to `/admin/analytics` in the admin portal
2. Default view shows 30-day analytics
3. Use time range selector to adjust period
4. Switch between tabs for different views

### Time Range Selection
- **Preset Ranges**: 7D, 30D, 90D, 1Y, All Time
- **Custom Range**: Select specific date range via calendar picker
- Data automatically refreshes on range change

### Exporting Data
- Click "Export" button to download CSV (implementation pending)
- Includes all visible data based on current filters

### Refreshing Data
- Click "Refresh" button to fetch latest data
- GA4 insights auto-refresh every 30 minutes
- Manual refresh available anytime

## Security

### Authentication
- Requires admin role in `profiles` table
- JWT-based authentication via Supabase
- Unauthorized access returns 401/403

### Authorization
- Only users with `role = "admin"` can access
- API route validates admin status on every request

## Performance Considerations

### Caching
- GA4 API responses cached for 5 minutes (CDN-level)
- Client-side caching via React state
- Stale-while-revalidate pattern for GA4 data

### Optimization
- Data aggregation done at database level where possible
- Indexes on `order_line_items_v2.created_at` and `order_line_items_v2.vendor_name`
- Pagination for large datasets (future enhancement)

### Rate Limits
- GA4 API: 10 queries per second per property
- Internal API: No explicit limits (protected by auth)

## Dependencies

### NPM Packages
- `recharts`: Data visualization
- `date-fns`: Date formatting
- `lucide-react`: Icons
- `googleapis`: GA4 API access

### Internal Components
- `TimeRangeSelector`: Time range picker
- `GA4Insights`: GA4 dashboard component
- UI components from `@/components/ui`

## Future Enhancements

### Planned Features
- [ ] CSV/PDF export functionality
- [ ] Real-time alerts for anomalies
- [ ] Customizable dashboard widgets
- [ ] Scheduled email reports
- [ ] Comparison views (vendor vs vendor, product vs product)
- [ ] Predictive analytics and forecasting
- [ ] Custom report builder
- [ ] API access for third-party integrations

### Technical Improvements
- [ ] Server-side pagination for large datasets
- [ ] Background job for pre-computing metrics
- [ ] Redis caching layer
- [ ] GraphQL API alternative
- [ ] Real-time updates via WebSockets

## Troubleshooting

### Common Issues

**Analytics not loading:**
- Check Supabase connection
- Verify admin role in database
- Check browser console for errors

**GA4 data missing:**
- Ensure `GOOGLE_ANALYTICS_PROPERTY_ID` is set
- Verify service account has proper permissions
- Check GA4 API quota limits
- Run `npm run validate:ga4` to check setup

**Incorrect revenue numbers:**
- Verify `order_line_items_v2` data integrity
- Check for cancelled/refunded orders in filters
- Confirm date range selection

**Performance issues:**
- Reduce time range (e.g., 30d instead of all-time)
- Clear browser cache
- Check server logs for slow queries

## Testing

### Manual Testing Checklist
- [ ] Access dashboard as admin
- [ ] Verify all metrics display correctly
- [ ] Test time range selector (all presets + custom)
- [ ] Check vendor analytics sorting
- [ ] Verify product table data
- [ ] Confirm GA4 tab loads
- [ ] Test refresh functionality
- [ ] Verify responsive design on mobile

### Test Data Generation
```bash
# Run test script to generate sample orders
node scripts/generate-test-orders.js

# Validate analytics calculations
node scripts/validate-analytics.js
```

## Related Documentation
- [GA4 Setup Guide](../../GA4_SETUP_GUIDE.md)
- [GA4 Troubleshooting](../../GA4_TROUBLESHOOTING_CHECKLIST.md)
- [Admin Portal Overview](../admin-portal/README.md)
- [Vendor Analytics](../vendor-dashboard/README.md)

## Version History

### v1.0.0 (Current)
- Initial release
- Platform overview dashboard
- Vendor analytics
- Product analytics
- GA4 insights integration
- Time range selector
- Real-time refresh

---

**Last Updated:** 2026-02-01  
**Maintained By:** Platform Team  
**Status:** ✅ Active

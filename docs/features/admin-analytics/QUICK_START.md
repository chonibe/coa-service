# Admin Analytics - Quick Start Guide

## 🚀 Getting Started

This guide will help you quickly set up and start using the Admin Analytics Dashboard.

## Prerequisites

✅ Admin account with proper role assigned  
✅ Access to `/admin` portal  
✅ GA4 setup completed (see [GA4_SETUP_GUIDE.md](../../GA4_SETUP_GUIDE.md))

## Setup (First Time)

### 1. Verify Admin Access
```bash
# Check your profile in Supabase
SELECT id, email, role FROM profiles WHERE email = 'your@email.com';
# Should show role = 'admin'
```

### 2. Access the Dashboard
1. Navigate to your admin portal: `https://yourdomain.com/admin`
2. Click **"Analytics"** in the left sidebar
3. You should see the analytics dashboard load

### 3. Verify GA4 Connection (Optional)
```bash
# Validate GA4 setup
npm run validate:ga4
```

## Using the Dashboard

### Overview Tab

**What You'll See:**
- 4 key metric cards at the top
- Sales trends chart (revenue + orders over time)
- Top 5 performing vendors

**Actions You Can Take:**
- Change time range (7D, 30D, 90D, 1Y, All Time, Custom)
- Click "Refresh" to get latest data
- Hover over charts for detailed tooltips

### Vendors Tab

**What You'll See:**
- Bar chart showing revenue distribution
- Complete vendor performance table

**Use Cases:**
- Identify top-performing vendors
- Compare vendor average order values
- Track vendor product count

**How to Use:**
1. Switch to "Vendors" tab
2. Review the bar chart for quick visual comparison
3. Scroll through the table for detailed metrics
4. Sort by clicking column headers (if enabled)

### Products Tab

**What You'll See:**
- Table of top 20 products by revenue
- Product names with vendor attribution
- Revenue and units sold

**Use Cases:**
- Find best-selling products
- Identify cross-vendor trends
- Track product performance

### GA4 Insights Tab

**What You'll See:**
- Real-time active users
- Conversion funnel
- Artist performance
- Collection performance
- Traffic sources
- Geographic data
- Cart abandonment rates

**Use Cases:**
- Monitor live user activity
- Analyze conversion drop-off points
- Track marketing campaign effectiveness
- Understand customer behavior

## Common Tasks

### Change Time Range

**Preset Ranges:**
```
7D   → Last 7 days
30D  → Last 30 days (default)
90D  → Last 90 days
1Y   → Last year
All Time → All historical data
```

**Custom Range:**
1. Click "Custom" button
2. Select start and end dates in calendar
3. Dashboard auto-refreshes

### Refresh Data

**Manual Refresh:**
- Click the "Refresh" button (🔄 icon)
- Wait for data to reload

**Auto-Refresh:**
- GA4 data auto-refreshes every 30 minutes
- Other data refreshes on page load

### Export Data (Coming Soon)

**Planned Functionality:**
1. Click "Export" button (⬇️ icon)
2. Select export format (CSV, PDF)
3. Choose data to include
4. Download file

## Understanding Metrics

### Platform Stats

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Total Revenue** | Sum of all sales in period | `SUM(price × quantity)` |
| **Total Orders** | Unique order count | `COUNT(DISTINCT order_id)` |
| **Active Vendors** | Vendors with products | From `vendors` table |
| **Total Collectors** | Registered collectors | From `profiles` where role='collector' |
| **Revenue Growth** | % change vs previous period | `((current - previous) / previous) × 100` |
| **Orders Growth** | % change in order volume | Same as revenue growth |
| **Avg Order Value** | Average per transaction | `total_revenue / total_orders` |

### Vendor Analytics

| Metric | Description |
|--------|-------------|
| **Total Revenue** | Vendor's total sales revenue |
| **Total Orders** | Orders containing vendor's products |
| **Total Products** | Unique product count |
| **Average Order Value** | `vendor_revenue / vendor_orders` |

### Product Analytics

| Metric | Description |
|--------|-------------|
| **Revenue** | Total revenue from product |
| **Units Sold** | Total quantity sold |

## Troubleshooting

### Dashboard Won't Load

**Check:**
1. Are you logged in as admin?
2. Is your network connection stable?
3. Check browser console for errors (F12)

**Try:**
```bash
# Clear browser cache
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```

### No Data Showing

**Possible Causes:**
- Selected time range has no orders
- Database connection issue
- Orders not synced from Shopify

**Solutions:**
1. Try "All Time" range
2. Check admin dashboard for sync status
3. Run manual Shopify sync

### GA4 Tab Shows Error

**Check:**
1. Is GA4 properly configured?
2. Service account credentials valid?
3. GA4 API enabled?

**Validate Setup:**
```bash
npm run validate:ga4
```

**Common Issues:**
- Service account JSON missing → Add to `ga-service-account.json`
- API not enabled → Enable in Google Cloud Console
- Property ID incorrect → Check `.env.local`

### Numbers Don't Match Shopify

**Possible Reasons:**
1. Time zone differences
2. Refunds/cancellations handling
3. Data sync delay

**Debug Steps:**
1. Compare specific order between platforms
2. Check `order_line_items_v2` table directly
3. Run sync validation script

## Best Practices

### Daily Monitoring
- ✅ Check platform overview each morning
- ✅ Review any unusual spikes/drops
- ✅ Monitor top vendors for issues
- ✅ Check cart abandonment rate

### Weekly Review
- ✅ Analyze vendor performance trends
- ✅ Review top products
- ✅ Check GA4 conversion funnel
- ✅ Evaluate traffic sources

### Monthly Planning
- ✅ Export data for stakeholder reports
- ✅ Compare month-over-month growth
- ✅ Identify underperforming areas
- ✅ Set goals for next period

## Time Range Strategy

| Use Case | Recommended Range |
|----------|-------------------|
| Daily operations | 7D |
| Weekly review | 30D |
| Monthly analysis | 90D |
| Quarterly planning | 1Y |
| Historical trends | All Time |
| Campaign tracking | Custom (campaign dates) |

## Keyboard Shortcuts (Future)

*To be implemented:*
- `R` → Refresh data
- `1-4` → Switch tabs
- `E` → Export data
- `?` → Show help

## Mobile Access

**Current Status:**
- ✅ Responsive design
- ✅ Touch-friendly controls
- ✅ Mobile-optimized charts
- ⚠️ Best viewed on tablet or larger

**Tips:**
- Rotate device for landscape view on charts
- Pinch to zoom on detailed tables
- Use time range presets for faster selection

## Support & Feedback

### Need Help?
- 📧 Email: support@yourdomain.com
- 💬 Slack: #admin-support
- 📚 Docs: `/docs/features/admin-analytics/`

### Report Issues
- 🐛 Bug Reports: Create GitHub issue
- 💡 Feature Requests: Submit via admin portal
- 📝 Documentation Feedback: Edit directly in repo

## Next Steps

After mastering the basics:
1. Explore GA4 Insights in depth
2. Set up scheduled reports (when available)
3. Create custom views (when available)
4. Integrate with third-party tools (when available)

---

**Quick Links:**
- [Full Documentation](./README.md)
- [GA4 Setup](../../GA4_SETUP_GUIDE.md)
- [Troubleshooting](../../GA4_TROUBLESHOOTING_CHECKLIST.md)
- [Admin Portal](../admin-portal/README.md)

**Last Updated:** 2026-02-01

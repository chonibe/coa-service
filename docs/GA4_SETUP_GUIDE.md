# 🚀 Complete GA4 Setup Guide for Art Marketplace

This guide walks you through setting up Google Analytics 4 for your art marketplace with automated scripts and custom insights.

## 📋 Prerequisites

### 1. Google Cloud Project Setup
```bash
# Create a new Google Cloud Project or use existing one
# Enable the following APIs:
# - Google Analytics Admin API
# - Google Analytics Data API
```

### 2. Service Account Setup
```bash
# Create a service account with these roles:
# - Analytics Admin
# - Analytics Data Viewer

# Download the JSON key file and place it in your project root as:
# ./ga-service-account.json
```

### 3. Environment Variables
Add these to your `.env.local`:
```bash
# GA4 Configuration
GOOGLE_ANALYTICS_PROPERTY_ID=properties/252918461
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-LLPL68MSTS
GA_SERVICE_ACCOUNT_KEY_PATH=./ga-service-account.json

# Optional: Google OAuth (for enhanced features)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## ⚡ Automated Setup (Recommended)

### Step 1: Run Automated GA4 Setup
```bash
# This creates all custom dimensions, metrics, and audiences automatically
npm run setup:ga4
```

### Step 2: Validate Setup
```bash
# Check that everything is configured correctly
npm run validate:ga4
```

### Step 3: Test E-commerce Tracking
```bash
# Visit your site and make a test purchase
# Check GA4 Realtime to verify events are firing
```

---

## 🎯 Manual GA4 Interface Setup

If automated setup fails, complete these steps in the GA4 interface:

### **Custom Dimensions (Admin → Custom Definitions → Custom Dimensions)**

1. **artist_name**
   - Scope: Event
   - Event parameter: `item_brand`
   - Description: Artist or vendor name for each product

2. **collection_name**
   - Scope: Event
   - Event parameter: `item_category`
   - Description: Collection name (Season 1, Season 2, Kickstarter, etc.)

3. **product_type**
   - Scope: Event
   - Event parameter: `item_category2`
   - Description: Product type (Print, Lamp, Accessory, etc.)

4. **customer_type**
   - Scope: User
   - User property: `customer_status`
   - Description: New vs Returning customer

5. **traffic_source_detail**
   - Scope: Session
   - Event parameter: `source`
   - Description: Detailed traffic source

6. **device_type**
   - Scope: Session
   - Event parameter: `device_category`
   - Description: Desktop, Mobile, or Tablet

7. **user_country**
   - Scope: User
   - User property: `country`
   - Description: Customer country

### **Custom Metrics (Admin → Custom Definitions → Custom Metrics)**

1. **items_per_order**
   - Scope: Event
   - Event parameter: `items`
   - Unit: Standard
   - Description: Number of items in each order

2. **shipping_cost**
   - Scope: Event
   - Event parameter: `shipping`
   - Unit: Currency
   - Description: Shipping amount charged

### **Audiences (Admin → Audiences)**

1. **Cart Abandoners - 7 Days**
   - Include: `add_to_cart` (last 7 days)
   - Exclude: `purchase` (last 7 days)

2. **Product Viewers - No Purchase**
   - Include: `view_item` (last 14 days)
   - Exclude: `purchase` (last 14 days)

3. **High-Value Collectors**
   - Include: `purchase` with `value > 200` (lifetime)

4. **Season 2 Viewers**
   - Include: `view_item` with `item_category = "Season 2"` (last 30 days)

5. **Mobile Shoppers**
   - Include: `session_start` with `device_category = "mobile"` (last 30 days)

---

## 📊 GA4 Explorations Setup

Create these explorations in **GA4 → Explore**:

### **1. Artist Performance Dashboard**
```
Template: Free Form
Name: Artist Revenue Performance
Rows: item_brand (artist_name)
Values: Total revenue, Event count (view_item), Event count (purchase)
Columns: collection_name
Sort by: Total revenue (descending)
```

### **2. Collection Performance Analysis**
```
Template: Free Form
Name: Collection Performance Analysis
Rows: item_category (collection_name)
Values: Event count (view_item), Total revenue, Average purchase revenue
Columns: source/medium
Sort by: Total revenue (descending)
```

### **3. Purchase Funnel**
```
Template: Funnel
Name: Complete Customer Journey
Steps:
1. session_start
2. view_item
3. add_to_cart
4. begin_checkout
5. add_payment_info
6. purchase
Breakdown: device_category, country
```

### **4. Traffic Source ROI**
```
Template: Free Form
Name: Traffic Source Conversion Analysis
Rows: First user source/medium
Values: Sessions, Conversions, Total revenue, Conversion rate
Sort by: Conversion rate (descending)
```

### **5. Geographic Performance**
```
Template: Free Form
Name: Global Market Performance
Rows: user_country
Values: Total revenue, Event count (purchase), Average order value
Sort by: Total revenue (descending)
```

---

## 📈 Custom Dashboard Setup

### **Daily Performance Dashboard**
Go to **Reports → Library → Create New Report**

Add these cards:
1. **Revenue** - Total revenue (Last 7 days, vs previous)
2. **Conversion Rate** - Ecommerce purchase rate
3. **Average Order Value** - Average purchase revenue
4. **Top Artists** - item_brand dimension with Revenue metric
5. **Traffic Sources** - Source/Medium with Revenue metric
6. **Cart Abandonment** - Custom calculation: `(add_to_cart - purchase) / add_to_cart`
7. **Device Breakdown** - Device category pie chart
8. **Top Products** - Item name with views and revenue

### **Executive Summary Dashboard**
Create a dashboard with:
- **Revenue Trend** (Line chart - Last 30 days)
- **Top 3 Artists** (Bar chart - Revenue)
- **Conversion Funnel** (Funnel chart - 6 steps)
- **Traffic Source ROI** (Table - Revenue per source)
- **Geographic Performance** (Map - Revenue by country)
- **Cart Recovery Rate** (Big number - Abandoned carts recovered)

---

## 🔧 Custom Dashboard Component

Add the GA4 insights dashboard to your admin panel:

```tsx
import { GA4Insights } from '@/components/dashboard/ga4-insights'

// In your admin dashboard page
<GA4Insights refreshInterval={30} showRealtime={true} />
```

This component automatically:
- Fetches GA4 data via API
- Displays key metrics and insights
- Updates every 30 minutes
- Shows real-time active users

---

## 🚨 Automated Alerts Setup

Create alerts in **GA4 → Admin → Alerts**:

1. **Revenue Drop Alert**
   - Metric: Total revenue
   - Condition: Decreases by >20% from previous day
   - Email: your-team@yourcompany.com

2. **Conversion Rate Alert**
   - Metric: Ecommerce conversion rate
   - Condition: Decreases by >15% from previous day

3. **High Cart Abandonment**
   - Custom metric: Cart abandonment rate
   - Condition: Exceeds 75%

---

## 🧪 Testing Your Setup

### **Real-time Testing**
1. Go to **GA4 → Reports → Realtime**
2. Open your store in a new browser tab
3. Perform these actions:
   - View homepage → Should see `page_view`
   - Click on artwork → Should see `view_item` with artist name
   - Add to cart → Should see `add_to_cart`
   - Go to checkout → Should see `begin_checkout`
   - Make a purchase → Should see `purchase` with all custom parameters

### **Validation Script**
```bash
# Run automated validation
npm run validate:ga4
```

### **API Testing**
```bash
# Test the insights API
curl -H "Cookie: session=your-session-cookie" http://localhost:3000/api/ga4/insights
```

---

## 🔍 Troubleshooting

### **Common Issues**

1. **"Service account key not found"**
   - Ensure `ga-service-account.json` exists in project root
   - Check file permissions

2. **"Property access denied"**
   - Verify service account has GA4 admin permissions
   - Check property ID is correct

3. **"Custom dimensions not found"**
   - Run `npm run setup:ga4` to create them automatically
   - Or create them manually in GA4 interface

4. **"E-commerce events not tracking"**
   - Check that GA4 script is loaded on your site
   - Verify measurement ID is correct
   - Test events in GA4 Realtime

5. **"API quota exceeded"**
   - GA4 Data API has quotas - implement caching
   - Use the dashboard component which includes caching

### **Debug Commands**
```bash
# Check environment variables
node -e "console.log(process.env.GOOGLE_ANALYTICS_PROPERTY_ID)"

# Test service account access
npm run validate:ga4

# Check GA4 script loading
# Open browser dev tools → Network tab → Look for googletagmanager.com
```

---

## 📚 Advanced Features

### **Custom Event Tracking**
Add custom events throughout your app:

```typescript
import { trackEnhancedEvent } from '@/lib/google-analytics'

// Track custom interactions
trackEnhancedEvent('artist_follow', {
  artist_id: '123',
  artist_name: 'Artist Name',
  source: 'artist_page'
})
```

### **Automated Reporting**
Set up automated reports via cron:

```bash
# Daily report generation (add to package.json scripts)
"report:daily": "node scripts/generate-daily-report.js"
```

### **A/B Testing Integration**
Track experiment variants:

```typescript
trackEnhancedEvent('experiment_view', {
  experiment_id: 'homepage_design_v2',
  variant: 'control'
})
```

---

## 🎯 Success Metrics

Your GA4 setup is complete when you can:

- ✅ See real-time events in GA4 Realtime
- ✅ View custom dimensions in exploration reports
- ✅ Track complete purchase funnels
- ✅ Analyze artist and collection performance
- ✅ Monitor traffic source ROI
- ✅ Generate automated insights reports
- ✅ Set up alerts for business-critical metrics

**Your art marketplace now has enterprise-level analytics!** 🎨📊

---

## 📞 Support

If you encounter issues:

1. Run `npm run validate:ga4` for diagnostics
2. Check the validation report JSON file
3. Verify service account permissions in Google Cloud
4. Ensure GA4 property is accessible
5. Test events in GA4 Realtime reports

For additional help, check the GA4 documentation or contact your development team.
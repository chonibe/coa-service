#!/usr/bin/env node

/**
 * GA4 Manual Setup Guide Generator
 * Generates step-by-step instructions for manual GA4 setup
 * when automated setup isn't possible
 */

const fs = require('fs')
const path = require('path')

class GA4ManualSetupGuide {
  constructor() {
    this.propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID?.replace('properties/', '') || '252918461'
    this.measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-LLPL68MSTS'
  }

  generateSetupGuide() {
    const guide = `# 🚀 GA4 Manual Setup Guide for Art Marketplace

**Property ID:** ${this.propertyId}
**Measurement ID:** ${this.measurementId}

---

## 📋 STEP-BY-STEP MANUAL SETUP

### **Step 1: Access GA4 Admin Panel**
1. Go to [Google Analytics](https://analytics.google.com)
2. Select your property: **${this.propertyId}**
3. Click **Admin** (gear icon) in bottom left

---

## 📏 Step 2: Create Custom Dimensions

Navigate: **Admin → Custom Definitions → Custom Dimensions → New Custom Dimension**

### **Dimension 1: artist_name**
\`\`\`
Dimension name: artist_name
Scope: Event
Event parameter: item_brand
Description: Artist or vendor name for each product
\`\`\`

### **Dimension 2: collection_name**
\`\`\`
Dimension name: collection_name
Scope: Event
Event parameter: item_category
Description: Collection name (Season 1, Season 2, Kickstarter, etc.)
\`\`\`

### **Dimension 3: product_type**
\`\`\`
Dimension name: product_type
Scope: Event
Event parameter: item_category2
Description: Product type (Print, Lamp, Accessory, etc.)
\`\`\`

### **Dimension 4: customer_type**
\`\`\`
Dimension name: customer_type
Scope: User
User property: customer_status
Description: New vs Returning customer
\`\`\`

### **Dimension 5: traffic_source_detail**
\`\`\`
Dimension name: traffic_source_detail
Scope: Session
Event parameter: source
Description: Detailed traffic source
\`\`\`

### **Dimension 6: device_type**
\`\`\`
Dimension name: device_type
Scope: Session
Event parameter: device_category
Description: Desktop, Mobile, or Tablet
\`\`\`

### **Dimension 7: user_country**
\`\`\`
Dimension name: user_country
Scope: User
User property: country
Description: Customer country
\`\`\`

---

## 📊 Step 3: Create Custom Metrics

Navigate: **Admin → Custom Definitions → Custom Metrics → New Custom Metric**

### **Metric 1: items_per_order**
\`\`\`
Metric name: items_per_order
Scope: Event
Event parameter: items
Unit of measurement: Standard
Description: Number of items in each order
\`\`\`

### **Metric 2: shipping_cost**
\`\`\`
Metric name: shipping_cost
Scope: Event
Event parameter: shipping
Unit of measurement: Currency
Description: Shipping amount charged
\`\`\`

---

## 👥 Step 4: Create Audiences

Navigate: **Admin → Audiences → New Audience**

### **Audience 1: Cart Abandoners - 7 Days**
\`\`\`
Name: Cart Abandoners - 7 Days
Description: Added to cart but didn't purchase in last 7 days

Conditions:
- Include users when: Event name = add_to_cart
- Within the last: 7 days
- Exclude users when: Event name = purchase
- Within the last: 7 days
\`\`\`

### **Audience 2: Product Viewers - No Purchase**
\`\`\`
Name: Product Viewers - No Purchase
Description: Viewed products but never purchased

Conditions:
- Include users when: Event name = view_item
- Within the last: 14 days
- Exclude users when: Event name = purchase
- Within the last: 14 days
\`\`\`

### **Audience 3: High-Value Collectors**
\`\`\`
Name: High-Value Collectors
Description: Customers who spent $200+ lifetime

Conditions:
- Include users when: Event name = purchase
- Lifetime value: purchase_revenue > 200
\`\`\`

### **Audience 4: Season 2 Enthusiasts**
\`\`\`
Name: Season 2 Viewers
Description: Viewed Season 2 products in last 30 days

Conditions:
- Include users when: Event name = view_item
- Event parameter: item_category = Season 2
- Within the last: 30 days
\`\`\`

### **Audience 5: Mobile Shoppers**
\`\`\`
Name: Mobile Shoppers
Description: Users who browse primarily on mobile

Conditions:
- Include users when: Session starts
- Event parameter: device_category = mobile
- Within the last: 30 days
\`\`\`

---

## 📊 Step 5: Create Exploration Reports

Navigate: **Explore (left menu) → Create New Exploration**

### **Report 1: Artist Performance Dashboard**
\`\`\`
Template: Free form
Name: Artist Revenue Performance
Rows: item_brand (artist_name)
Values:
- Event count (view_item)
- Event count (add_to_cart)
- Event count (purchase)
- Total revenue (purchase_revenue)
Values: Total revenue, Event count (view_item), Event count (purchase)
Columns: collection_name
Sort by: Total revenue (descending)
\`\`\`

### **Report 2: Collection Performance Analysis**
\`\`\`
Template: Free form
Name: Collection Performance Analysis
Rows: item_category (collection_name)
Values:
- Event count (view_item)
- Event count (purchase)
- Total revenue
- Average purchase revenue
Columns: source/medium
Sort by: Total revenue (descending)
\`\`\`

### **Report 3: Purchase Funnel**
\`\`\`
Template: Funnel exploration
Name: Complete Customer Journey
Steps (in order):
1. session_start (All Sessions)
2. view_item (Product Discovery)
3. add_to_cart (Add to Cart)
4. begin_checkout (Begin Checkout)
5. add_payment_info (Payment Info Added)
6. purchase (Purchase Complete)

Breakdown dimensions:
- First user source/medium
- Device category
- Country
Date range: Last 90 days
\`\`\`

### **Report 4: Traffic Source ROI**
\`\`\`
Template: Free form
Name: Traffic Source Conversion Analysis
Rows: First user source/medium
Values:
- Sessions
- Conversions (purchase)
- Conversion rate
- Total revenue
- Average order value
Sort by: Conversion rate (descending)
Date range: Last 90 days
\`\`\`

### **Report 5: Geographic Performance**
\`\`\`
Template: Free form
Name: Global Market Performance
Rows: user_country
Values:
- Total revenue
- Event count (purchase)
- Average order value
Sort by: Total revenue (descending)
Date range: Last 90 days
\`\`\`

---

## 📈 Step 6: Create Daily Dashboard

Navigate: **Reports → Library → Create New Report**

**Dashboard Name:** Daily Store Performance

### **Add These Cards:**

1. **REVENUE CARD**
   - Metric: Total revenue
   - Comparison: Previous period
   - Date range: Last 7 days

2. **CONVERSION RATE CARD**
   - Metric: Ecommerce purchase rate
   - Comparison: Previous period
   - Date range: Last 7 days

3. **AVERAGE ORDER VALUE**
   - Metric: Average purchase revenue
   - Comparison: Previous period
   - Date range: Last 7 days

4. **TOP ARTISTS TABLE**
   - Dimension: item_brand
   - Metrics: Revenue, Purchases
   - Rows: Top 5
   - Date range: Last 7 days

5. **TRAFFIC SOURCES TABLE**
   - Dimension: Source/Medium
   - Metrics: Sessions, Conversions, Revenue
   - Rows: Top 5
   - Date range: Last 7 days

6. **CART ABANDONMENT**
   - Metric: add_to_cart events
   - Metric: purchase events
   - Show ratio
   - Date range: Last 7 days

7. **DEVICE BREAKDOWN**
   - Dimension: Device category
   - Metrics: Sessions, Conversion rate
   - Chart type: Pie chart
   - Date range: Last 7 days

8. **TOP PRODUCTS**
   - Dimension: Item name
   - Metrics: Item views, Revenue
   - Rows: Top 10
   - Date range: Last 7 days

---

## 🚨 Step 7: Set Up Alerts

Navigate: **Admin → Alerts → Create Alert**

### **Alert 1: Revenue Drop**
\`\`\`
Alert name: Revenue Drop Alert
Period: Day
Condition: Total revenue decreases by more than 20%
Compared to: Previous day
Email recipients: your-email@domain.com
\`\`\`

### **Alert 2: Conversion Rate Drop**
\`\`\`
Alert name: Conversion Rate Alert
Period: Day
Condition: Ecommerce conversion rate decreases by more than 15%
Compared to: Previous day
Email recipients: your-email@domain.com
\`\`\`

---

## 🧪 Step 8: Test Your Setup

### **Real-time Testing**
1. Go to **GA4 → Reports → Realtime**
2. Open your store in a new browser tab
3. Perform these actions:
   - View homepage → Should see \`page_view\`
   - Click on artwork → Should see \`view_item\` with artist name
   - Add to cart → Should see \`add_to_cart\`
   - Go to checkout → Should see \`begin_checkout\`
   - Complete purchase → Should see \`purchase\` with all custom parameters

### **Verify Custom Dimensions**
1. Go to **Explore → Create New Exploration**
2. Add \`item_brand\` to rows
3. Should see artist names in the data

---

## ✅ Verification Checklist

- [ ] All 7 custom dimensions created
- [ ] All 2 custom metrics created
- [ ] All 5 audiences created
- [ ] All 5 exploration reports created
- [ ] Daily dashboard created
- [ ] Alerts configured
- [ ] Real-time events showing artist names
- [ ] Purchase events showing all custom parameters

---

## 🎯 Next Steps

1. **Add the dashboard component** to your admin panel:
   \`\`\`tsx
   import { GA4Insights } from '@/components/dashboard/ga4-insights'

   // Add to your admin dashboard
   <GA4Insights refreshInterval={30} showRealtime={true} />
   \`\`\`

2. **Test e-commerce tracking** by making test purchases

3. **Monitor performance** using your new dashboard

**Your GA4 setup is now complete!** 🎉
`

    return guide
  }

  saveGuide() {
    const guide = this.generateSetupGuide()
    const guidePath = path.join(__dirname, '..', 'GA4_MANUAL_SETUP_GUIDE.md')

    fs.writeFileSync(guidePath, guide)
    console.log(`📄 Manual setup guide saved to: ${guidePath}`)
    console.log('\n📋 Copy and paste the instructions above into GA4 to complete setup')
    console.log('🔗 GA4 Admin URL: https://analytics.google.com/analytics/web/')

    return guidePath
  }

  printSummary() {
    console.log('🎯 GA4 Manual Setup Summary')
    console.log('=' .repeat(50))
    console.log(`📊 Property ID: ${this.propertyId}`)
    console.log(`🎯 Measurement ID: ${this.measurementId}`)
    console.log('')
    console.log('📝 Manual Steps Required:')
    console.log('1. Create 7 custom dimensions')
    console.log('2. Create 2 custom metrics')
    console.log('3. Create 5 audiences')
    console.log('4. Create 5 exploration reports')
    console.log('5. Create daily dashboard')
    console.log('6. Set up alerts')
    console.log('7. Test real-time events')
    console.log('')
    console.log('✅ Code-side tracking is ready!')
    console.log('- E-commerce events implemented')
    console.log('- Custom parameters configured')
    console.log('- Dashboard component ready')
    console.log('- API endpoints available')
  }
}

// Run if called directly
if (require.main === module) {
  const guide = new GA4ManualSetupGuide()
  guide.printSummary()
  guide.saveGuide()
}

module.exports = GA4ManualSetupGuide
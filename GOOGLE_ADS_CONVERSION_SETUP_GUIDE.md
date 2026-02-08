# 🚀 Google Ads Conversion Setup Guide

## Overview
This guide helps you set up Google Ads conversion measurement for your Shopify art marketplace. By linking GA4 events to Google Ads conversions, you'll optimize your campaigns based on actual customer actions.

## 📋 Prerequisites
- ✅ GA4 tracking implemented and working
- ✅ Custom dimensions created (artist_name, collection_name, etc.)
- ✅ E-commerce events firing (view_item, add_to_cart, purchase)
- ✅ Google Ads account connected to your GA4 property

---

## Step 1: Access Google Ads Conversions

1. **Sign in to Google Ads:**
   - Go to [ads.google.com](https://ads.google.com)
   - Select your account

2. **Navigate to Conversions:**
   - Click **Tools & Settings** (wrench icon)
   - Under "Measurement", click **Conversions**

3. **Start Creating Conversions:**
   - Click the **"+" New conversion action** button

---

## Step 2: Create Conversion Actions

### 🎯 **Conversion 1: Purchase** (Most Important)
```
Name: Purchase
Category: Purchase
Goal and optimization: Revenue (or Transactions)
Value: Use different values for each conversion
Currency: USD
Attribution model: Data-driven
Attribution window: 90 days (recommended)
View-through attribution: 1 day (optional)
```
**Why this matters:** Optimizes campaigns for actual sales revenue.

### 🛒 **Conversion 2: Add to Cart**
```
Name: Add to Cart
Category: Add to cart
Goal and optimization: Conversions
Value: Use the value of the product added
Currency: USD
Attribution model: Data-driven
Attribution window: 90 days
```
**Why this matters:** Identifies campaigns that drive consideration.

### 📋 **Conversion 3: Begin Checkout**
```
Name: Begin Checkout
Category: Begin checkout
Goal and optimization: Conversions
Value: Use the order value
Currency: USD
Attribution model: Data-driven
Attribution window: 90 days
```
**Why this matters:** Measures checkout funnel performance.

### 👁️ **Conversion 4: Product View**
```
Name: Product View
Category: Custom
Goal and optimization: Conversions
Value: Don't use a value
Attribution model: Data-driven
Attribution window: 90 days
```
**Why this matters:** Tracks product discovery and interest.

### 🔍 **Conversion 5: Search**
```
Name: Search
Category: Custom
Goal and optimization: Conversions
Value: Don't use a value
Attribution model: Data-driven
Attribution window: 30 days
```
**Why this matters:** Measures search engagement.

---

## Step 3: Get Conversion Details

After creating each conversion, you'll see:

### **Conversion ID & Label**
```
Conversion ID: AW-123456789
Conversion Label: ABCdefGHIjklMNOpqrs
```

**Important:** Note these down for each conversion - you'll need them in your code.

### **Global Site Tag (gtag) Code**
Google will show you code like:
```javascript
gtag('event', 'conversion', {
  'send_to': 'AW-123456789/ABCdefGHIjklMNOpqrs',
  'value': 1.0,
  'currency': 'USD'
});
```

---

## Step 4: Update Your Code

1. **Update Conversion Configuration:**
   Edit `lib/google-ads-conversions.ts`:

   ```typescript
   export const SHOPIFY_CONVERSIONS: Record<string, GoogleAdsConversion> = {
     'purchase': {
       conversionId: 'AW-123456789', // Your actual conversion ID
       conversionLabel: 'ABCdefGHIjklMNOpqrs', // Your actual conversion label
       name: 'Purchase',
       category: 'PURCHASE',
       currency: 'USD'
     },
     'add_to_cart': {
       conversionId: 'AW-987654321',
       conversionLabel: 'ZYXwvuTSRqponMLKj',
       name: 'Add to Cart',
       category: 'CUSTOM'
     },
     // ... add all your conversions
   }
   ```

2. **Test Your Setup:**
   ```bash
   npm run test:google-ads
   ```

---

## Step 5: Enable Enhanced Conversions (Recommended)

Enhanced conversions improve measurement by sending hashed customer data to Google.

### **For Purchase Conversions:**

1. **Go to your Purchase conversion** in Google Ads
2. **Click "Edit settings"**
3. **Enable "Enhanced conversions"**
4. **Choose "API or server-side integration"**
5. **Select these customer data fields:**
   - Email
   - Phone number
   - First name
   - Last name
   - Home address (street, city, region, postal code, country)

### **Implementation:**
Your existing GA4 setup already handles this automatically when purchases occur.

---

## Step 6: Set Up Conversion Value Rules

Improve optimization by setting different values for different actions:

### **Access Conversion Value Rules:**
1. In Google Ads, go to **Tools & Settings → Measurement → Conversions**
2. Click on your conversion (e.g., Purchase)
3. Click **"Value rules"** tab
4. Click **"Create rule"**

### **Recommended Rules:**

**High-Value Artist Rule:**
```
Condition: item_brand contains "Featured Artist"
Value: Multiply by 1.5
```

**Season 2 Boost:**
```
Condition: item_category contains "Season 2"
Value: Multiply by 1.2
```

**Large Order Bonus:**
```
Condition: Total value > $200
Value: Add $10
```

---

## Step 7: Test & Verify

### **Real-Time Testing:**
1. **Open your site** in an incognito window
2. **Go to Google Ads → Tools & Settings → Measurement → Conversions**
3. **Click on your conversion** to see real-time data

### **Test Conversions:**
```bash
# Test conversion tracking
npm run test:google-ads

# Check GA4 Realtime reports
# Visit: https://analytics.google.com → Reports → Realtime
```

### **Expected Results:**
- ✅ Conversions appear in Google Ads within 24 hours
- ✅ Attribution shows in campaign reports
- ✅ Enhanced conversions show "Hashed" status
- ✅ Conversion values reflect your rules

---

## Step 8: Monitor & Optimize

### **Daily Monitoring:**
- **Check conversion performance** in Google Ads campaigns
- **Monitor ROAS (Return on Ad Spend)** improvements
- **Review attribution reports** for customer journey insights

### **Weekly Optimization:**
- **Adjust conversion values** based on performance
- **Update attribution windows** if needed
- **Add new conversion actions** for important events

### **Monthly Review:**
- **Analyze conversion lag** (time between click and conversion)
- **Review enhanced conversion coverage**
- **Optimize based on GA4 exploration reports**

---

## 🔧 Troubleshooting

### **Conversions Not Showing:**
- **Wait 24-48 hours** after setup
- **Check conversion labels** match exactly in code
- **Verify gtag events** fire in browser console
- **Ensure conversions** are enabled (not paused)

### **Wrong Conversion Values:**
- **Check value parameter** is a number, not string
- **Verify currency codes** (USD, EUR, GBP, etc.)
- **Ensure transaction_id** is unique per conversion

### **Enhanced Conversions Issues:**
- **Hash customer data** properly (SHA256)
- **Check consent** for data collection
- **Verify enhanced conversions** enabled in Google Ads

---

## 📊 Expected Performance Improvements

### **Week 1-2:**
- Better ad optimization as Google learns conversion patterns
- More accurate targeting based on actual customer behavior

### **Week 3-4:**
- Improved ROAS (Return on Ad Spend)
- Better budget allocation across campaigns
- Reduced wasted spend on non-converting traffic

### **Month 2+:**
- Advanced audience targeting based on conversion data
- Predictive performance for new campaigns
- Enhanced customer journey insights

---

## 🎯 Next Steps

1. ✅ **Create all conversion actions** in Google Ads
2. ✅ **Update code** with conversion IDs and labels
3. ✅ **Test setup** with npm scripts
4. ✅ **Enable enhanced conversions** for better measurement
5. ✅ **Monitor performance** and optimize based on data

---

## 📞 Support

If you encounter issues:
1. Run `npm run test:google-ads` to check configuration
2. Check browser console for gtag errors
3. Verify conversion IDs in Google Ads match your code
4. Contact Google Ads support for account-specific issues

**Your Google Ads campaigns will now optimize for actual customer actions!** 🎉
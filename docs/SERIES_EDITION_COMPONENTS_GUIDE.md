# Series & Edition Components - Testing Guide

## 🎯 How to See the Components

The **ProductSeriesInfo** and **EditionInfo** components are now live on product pages, but they only show when the product has the required data.

### ✅ Ready-to-Test Product

**Product: "mmm"**
- URL: `http://localhost:3000/shop/mmm`
- Has Series: ✅ YES
- Has Edition: ✅ YES (Edition of 100)

**What You'll See:**
1. **ProductSeriesInfo Card** - Shows series name, artwork count, collector progress
2. **EditionInfo Badge** - Shows "Limited Edition - Edition of 100" with availability bar

---

## 📋 All Products with Series

These products will show the **ProductSeriesInfo** component:

| Product | Handle | URL |
|---------|--------|-----|
| mmm | `mmm` | `/shop/mmm` |
| lj | `lj` | `/shop/lj` |
| FIRST | `first` | `/shop/first` |
| 2ND | `2nd` | `/shop/2nd` |
| sjj | `sjj` | `/shop/sjj` |

---

## 🔧 Why Components Aren't Showing

### Common Issues:

1. **Product Not in Database**
   - The `kedem-1` product exists in Shopify but not in `vendor_product_submissions`
   - Solution: Submit the product through the vendor dashboard

2. **No Series Assigned**
   - Product exists but `series_id` is null
   - Solution: Add product to a series in series management

3. **No Edition Size**
   - Product exists but `product_data.edition_size` is not set
   - Solution: Update product_data JSON field

---

## 🎨 Component Locations on Product Page

```
[Artist Name Link]

[Product Title]
                                    ← You are here
┌─────────────────────────────────────┐
│ 📚 Part of a Series                 │  ← ProductSeriesInfo
│ Series Name                          │
│ 12 Artworks • You own 3 of 12       │
│ [Progress Bar: ████░░░░] 25%        │
│ View Collection →                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📦 Limited Edition                   │  ← EditionInfo
│ Edition of 100                       │
│ [Availability Bar: ████████░░] 80%   │
│ ✓ 80 of 100 available               │
└─────────────────────────────────────┘

[$299.00]

[In stock]
[Free shipping...]
```

---

## 🐛 Debug Your Product

### Check Any Product:

Visit: `/api/shop/products/[handle]/debug`

Example: `http://localhost:3000/api/shop/products/mmm/debug`

This shows:
- ✅ Whether product exists in database
- ✅ Whether it has series data
- ✅ Whether it has edition data
- ✅ Recommendations for what to add

### Console Logging:

Open browser console on any product page. You'll see:
```javascript
{
  hasSeriesInfo: true/false,
  seriesInfo: {...},
  hasEditionInfo: true/false,
  editionInfo: {...}
}
```

---

## ⚡ Quick Commands

### List All Products:
```bash
node scripts/list-available-products.js
```

### Check Specific Product:
```bash
# Edit the script to change the handle
node scripts/check-kedem-product.js
```

### Add Edition Info to Any Product:
```sql
-- In Supabase SQL Editor
UPDATE vendor_product_submissions
SET product_data = product_data || '{"edition_size": 100, "edition_total": 100}'::jsonb
WHERE product_data->>'handle' = 'your-handle-here';
```

### Add Product to Series:
```sql
-- 1. Add to series members
INSERT INTO artwork_series_members (series_id, submission_id, display_order)
VALUES ('series-uuid-here', 'submission-uuid-here', 1);

-- 2. Update submission
UPDATE vendor_product_submissions
SET series_id = 'series-uuid-here'
WHERE id = 'submission-uuid-here';
```

---

## 📸 Expected Visual Results

### ProductSeriesInfo (when has series):
- Beautiful card with gradient background
- Series thumbnail image (if available)
- "Part of a Series" badge with book icon
- Series name as clickable link
- Artwork count
- Collector progress (if logged in): "You own X of Y"
- Animated progress bar showing completion %
- Hover effects with smooth transitions

### EditionInfo (when has edition_size):
- Limited edition badge with layers icon
- Edition size display
- Availability status with color coding:
  - 🟢 Green: Normal availability
  - 🟡 Yellow: Low stock (≤5 remaining)
  - 🔴 Red: Very scarce (≤2 remaining)
  - ⚫ Black: Sold out
- Animated progress bar
- Real-time availability messages

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] All published products have series assignments
- [ ] All published products have edition sizes set
- [ ] Series browse pages are accessible
- [ ] Collector progress calculation is accurate
- [ ] Mobile responsive design verified
- [ ] Frosted glass effects work on all browsers
- [ ] Button animations perform smoothly (60fps)
- [ ] Series links navigate correctly
- [ ] Edition scarcity warnings trigger at correct thresholds

---

## 🔗 Related Files

**Components:**
- `app/shop/[handle]/components/ProductSeriesInfo.tsx`
- `app/shop/[handle]/components/EditionInfo.tsx`
- `app/shop/series/[seriesId]/page.tsx`

**Data Layer:**
- `lib/shop/series.ts`
- `app/api/shop/products/[handle]/route.ts`
- `app/api/shop/series/[seriesId]/route.ts`

**Documentation:**
- `docs/COMMIT_LOGS/shop-ui-series-improvements-2026-02-03.md`

---

## 💡 Tips

1. **Start with one test product** - Use `/shop/mmm` to see both components
2. **Check browser console** - Debug logs will tell you exactly what data is loaded
3. **Use the debug endpoint** - `/api/shop/products/[handle]/debug` is your friend
4. **Series must exist first** - Can't assign products to non-existent series
5. **Edition info is optional** - Components gracefully hide if data missing

---

## 🚀 Next Steps

1. Visit `http://localhost:3000/shop/mmm` to see both components
2. Navigate to series page from the series card
3. Test on mobile devices
4. Add edition info to more products
5. Create more series and populate them
6. Test collector progress with authenticated users

**Enjoy your new premium shop experience!** ✨

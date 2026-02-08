# GA4 Troubleshooting Checklist

## Step 1: Verify Events Are Firing
1. Go to **GA4 → Reports → Realtime**
2. Open your site: http://localhost:3001
3. Navigate and check for these events:
   - [ ] page_view
   - [ ] view_item
   - [ ] add_to_cart (if you have cart functionality)
   - [ ] purchase (if orders exist)

## Step 2: Check Event Parameters
1. In Realtime, click on a **view_item** event
2. Look for these parameters:
   - [ ] item_brand (should show artist name)
   - [ ] item_category (should show collection/season)
   - [ ] item_category2 (should show product type)
   
   If these are missing → tracking code issue
   If these show "not set" → normal for new setup

## Step 3: Verify Custom Dimensions Exist
1. Go to **Admin → Custom Definitions → Custom Dimensions**
2. Confirm you created all 7:
   - [ ] artist_name (Event, item_brand)
   - [ ] collection_name (Event, item_category)
   - [ ] product_type (Event, item_category2)
   - [ ] customer_type (User, customer_status)
   - [ ] traffic_source_detail (Event, source)
   - [ ] device_type (Event, device_category)
   - [ ] user_country (User, country)

## Step 4: Test Simple Exploration First
Instead of complex explorations, start with:

**Basic Test Exploration:**
```
Template: Free Form
Date range: Last 7 days (or Last 1 day)

Rows: Event name
Values: Event count

Then add filters:
- Event name = view_item
```

If this shows data → Your events work ✅
If no data → Events aren't being tracked ❌

## Step 5: Check Standard Reports
1. Go to **Reports → Engagement → Events**
2. Look for:
   - [ ] view_item
   - [ ] add_to_cart  
   - [ ] purchase
3. Click on view_item → Should show event parameters

## Step 6: Debug Mode Test
1. Add `?gtag_debug=1` to your URL
2. Open browser console
3. Look for GA4 debug messages
4. Verify events are sending with correct parameters

## Common Issues & Fixes:

### Issue 1: "No data" in all explorations
**Cause:** Custom dimensions not created or events not firing
**Fix:** 
- Check Admin → Custom Definitions
- Check Reports → Realtime for events
- Wait 24 hours if dimensions just created

### Issue 2: Events in Realtime but not Explorations
**Cause:** Custom dimensions need processing time
**Fix:** Wait 24-48 hours after creating custom dimensions

### Issue 3: Parameters showing "not set"
**Cause:** 
- Custom dimension parameter name mismatch
- Events not sending the parameters
**Fix:**
- Verify parameter names match exactly (item_brand vs itemBrand)
- Check browser console for gtag events

### Issue 4: Standard dimension "item_brand" not available
**Cause:** Using wrong dimension name in exploration
**Fix:** 
- Use the custom dimension name you created (e.g., "artist_name")
- Not the parameter name (item_brand)

### Issue 5: Seeing your own IP in analytics
**Cause:** Internal/team traffic is being tracked.
**Fix:** Set `INTERNAL_IP_ADDRESSES` in `.env.local` (comma-separated IPs). The app will not send GA events from those IPs. See [GA4 Manual Setup Guide](./GA4_MANUAL_SETUP_GUIDE.md) section "Exclude Internal / Your IP from Analytics".

## Quick Diagnostic:

**Are events showing in Realtime?**
- YES → Custom dimensions need time (wait 24 hours)
- NO → Tracking code issue (check implementation)

**Are custom dimensions created in Admin?**
- YES → Good! Wait for data to populate
- NO → Create them first before explorations work

**Do standard reports show event data?**
- YES → Explorations will work after processing time
- NO → Events aren't being tracked

## Next Steps:

1. ✅ Verify events in **Realtime** first
2. ✅ Check **Reports → Events** for historical data
3. ✅ Wait 24-48 hours after creating custom dimensions
4. ✅ Try simple explorations before complex ones
5. ✅ Use shorter date ranges (Last 7 days)

## When Custom Dimensions Will Work:

- **Realtime Reports:** Immediate (events show instantly)
- **Standard Reports:** 24 hours (events appear in reports)
- **Custom Dimensions:** 24-48 hours (dimensions populate)
- **Explorations:** 24-48 hours (after custom dimensions process)

## Testing Right Now:

Since your tracking was just implemented, you should:
1. Test in **Realtime** to verify events fire
2. Wait 24 hours
3. Come back to check Explorations

**The tracking code is ready - GA4 just needs time to process the data!**
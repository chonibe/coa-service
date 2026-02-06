# Shopify Homepage Metafields Setup Guide

**Purpose:** Configure dynamic homepage content (video URL, hero text, etc.) directly in Shopify Admin  
**Date:** 2026-02-04  
**Status:** Ready to Configure

---

## Overview

Your homepage hero section now fetches content from Shopify metafields. This means you can edit the video URL, headline, and other settings directly in Shopify Admin without touching code!

---

## Step 1: Create Homepage Settings Page

### In Shopify Admin:

1. Go to **Online Store > Pages**
2. Click **Add page**
3. Set the page handle to: `homepage-settings`
   - **Title:** "Homepage Settings"
   - **Handle:** `homepage-settings` (this is important!)
   - **Content:** Add description like "This page stores homepage metafields"
4. **Visibility:** Keep it hidden (customers won't see it)
5. Click **Save**

---

## Step 2: Add Metafield Definitions

### In Shopify Admin:

1. Go to **Settings > Custom data > Pages**
2. Click **Add definition**
3. Create the following metafield definitions:

### Hero Video URL
- **Name:** Hero Video URL
- **Namespace and key:** `custom.hero_video_url`
- **Type:** Single line text (or URL)
- **Description:** Main homepage hero video URL (MP4 or MOV)

### Hero Video Poster
- **Name:** Hero Video Poster
- **Namespace and key:** `custom.hero_video_poster`
- **Type:** File or URL
- **Description:** Poster image shown before video loads

### Hero Video Settings (Optional)
- **Name:** Hero Video Settings
- **Namespace and key:** `custom.hero_video_settings`
- **Type:** JSON
- **Description:** Video playback settings
- **Example value:**
```json
{
  "autoplay": true,
  "loop": true,
  "muted": true
}
```

### Hero Headline
- **Name:** Hero Headline
- **Namespace and key:** `custom.hero_headline`
- **Type:** Single line text
- **Description:** Main headline text

### Hero Subheadline
- **Name:** Hero Subheadline
- **Namespace and key:** `custom.hero_subheadline`
- **Type:** Single line text
- **Description:** Subheadline text below headline

### Hero CTA Text
- **Name:** Hero CTA Text
- **Namespace and key:** `custom.hero_cta_text`
- **Type:** Single line text
- **Description:** Call-to-action button text

### Hero CTA URL
- **Name:** Hero CTA URL
- **Namespace and key:** `custom.hero_cta_url`
- **Type:** URL
- **Description:** Button link destination

### Hero Text Color
- **Name:** Hero Text Color
- **Namespace and key:** `custom.hero_text_color`
- **Type:** Color or Single line text
- **Description:** Text color (hex code, e.g., #ffffff)

### Hero Overlay Color
- **Name:** Hero Overlay Color
- **Namespace and key:** `custom.hero_overlay_color`
- **Type:** Color or Single line text
- **Description:** Overlay color (hex code, e.g., #000000)

### Hero Overlay Opacity
- **Name:** Hero Overlay Opacity
- **Namespace and key:** `custom.hero_overlay_opacity`
- **Type:** Integer
- **Description:** Overlay opacity (0-100)

---

## Step 3: Add Metafield Values to Page

### In Shopify Admin:

1. Go to **Online Store > Pages**
2. Find and click **Homepage Settings** page
3. Scroll to **Metafields** section
4. Fill in the values:

### Example Values:
```
Hero Video URL: https://cdn.shopify.com/videos/c/o/v/YOUR-VIDEO-ID.mov
Hero Video Poster: (optional - link to poster image)
Hero Headline: One lamp, Endless Inspiration..
Hero Subheadline: (leave empty or add text)
Hero CTA Text: Shop Now
Hero CTA URL: /shop/street_lamp
Hero Text Color: #ffffff
Hero Overlay Color: #000000
Hero Overlay Opacity: 0
```

5. Click **Save**

---

## Step 4: Upload New Video to Shopify

### Option A: Upload via Files

1. Go to **Content > Files** in Shopify Admin
2. Click **Upload files**
3. Select your video file (MP4 or MOV)
4. Wait for upload to complete
5. Copy the CDN URL (e.g., `https://cdn.shopify.com/videos/...`)
6. Paste into **Hero Video URL** metafield

### Option B: Use External URL

- You can use any publicly accessible video URL
- Must be HTTPS
- Recommended formats: MP4 (H.264), MOV

---

## Step 5: Test Your Changes

1. Visit your homepage: `https://your-store.com/shop`
2. The hero video should load from the Shopify metafield
3. If metafields are empty, it falls back to the default video in code

---

## How It Works

### Fetch Priority:
1. **First:** Try to fetch from Shopify page metafields
2. **Fallback:** Use static content from `content/homepage.ts`

### Code Flow:
```typescript
// In app/shop/home/page.tsx
const heroSettings = await getHeroSettingsWithFallback({
  video: { url: 'fallback-url.mov', ... },
  // ... other fallbacks
})

// Hero settings now contain either:
// - Values from Shopify metafields (if found)
// - Fallback values from static content (if not found)
```

---

## Updating Video URL

### To change the video:

1. **Upload new video** to Shopify Files
2. **Copy the CDN URL**
3. Go to **Pages > Homepage Settings**
4. Update **Hero Video URL** metafield
5. **Save** the page
6. **Refresh your homepage** - new video loads!

### No code changes needed! ✅

---

## Troubleshooting

### Video not loading?
1. Check metafield value is correct URL
2. Verify URL is accessible (try opening in browser)
3. Check browser console for errors
4. Verify metafield namespace/key matches: `custom.hero_video_url`

### Metafields not showing?
1. Verify page handle is exactly `homepage-settings`
2. Check metafield definitions are created for Pages (not Products)
3. Verify namespace is `custom` (not `app` or other)

### Fallback to default video?
- This is normal if metafields aren't set yet
- Check console logs: "No metafields found, using fallback"
- Add values to metafields to override default

### Changes not appearing?
1. Clear browser cache (Ctrl+Shift+R)
2. Verify you saved the page in Shopify Admin
3. Check Next.js cache - may take 60 seconds to update
4. Restart dev server if in development mode

---

## API Configuration

### Required Shopify API Scopes:
- `unauthenticated_read_content` - To read page content
- Already included in your Storefront API token

### No additional setup needed! ✅

---

## Advanced: JSON Video Settings

Instead of separate metafields, you can use a single JSON metafield:

**Metafield:** `custom.hero_video_settings`  
**Type:** JSON

**Value:**
```json
{
  "autoplay": true,
  "loop": true,
  "muted": true
}
```

This consolidates playback settings into one field.

---

## Benefits

✅ **Edit in Shopify Admin** - No code changes needed  
✅ **Non-technical updates** - Marketing team can change content  
✅ **Instant updates** - Changes reflect within 60 seconds  
✅ **Fallback support** - Never breaks if metafields are empty  
✅ **Version control** - Video URLs tracked in Shopify  
✅ **CDN optimization** - Shopify handles video delivery  

---

## Quick Reference

### Metafield Structure:
```
Page: homepage-settings
├── custom.hero_video_url → "https://cdn.shopify.com/..."
├── custom.hero_video_poster → "https://cdn.shopify.com/..."
├── custom.hero_headline → "One lamp, Endless Inspiration.."
├── custom.hero_subheadline → ""
├── custom.hero_cta_text → "Shop Now"
├── custom.hero_cta_url → "/shop/street_lamp"
├── custom.hero_text_color → "#ffffff"
├── custom.hero_overlay_color → "#000000"
└── custom.hero_overlay_opacity → 0
```

---

## Next Steps

1. ✅ Create `homepage-settings` page
2. ✅ Add metafield definitions
3. ✅ Upload new video to Shopify
4. ✅ Add metafield values
5. ✅ Test on homepage

---

**Need Help?**
- Check Shopify docs: [Custom data with metafields](https://help.shopify.com/en/manual/custom-data/metafields)
- Review code: `lib/shopify/homepage-settings.ts`
- Check console logs for debugging

---

**Last Updated:** 2026-02-04  
**Status:** Ready to Use

# ✅ All Pages Now Use Shopify Metaobjects for Videos!

## 📄 Pages Updated

### 1. `/shop/home` (Main Homepage)
**File:** `app/shop/home/page.tsx`
- ✅ Hero Video: Fetches from `video_banner_hero`
- ✅ Secondary Video: Fetches from `video_banner_1`
- ✅ Component: `VideoPlayer`
- **Status:** Connected to Shopify

### 2. `/shop/home-v2` (Enhanced Homepage)
**File:** `app/shop/home-v2/page.tsx`
- ✅ Hero Video: Fetches from `video_banner_hero`
- ✅ Component: `VideoPlayerEnhanced` (with GSAP animations)
- **Status:** Connected to Shopify

---

## 🎬 How It Works

Both pages now fetch video settings from your **Shopify metaobject**:

```yaml
Metaobject: homepage_banner_video
Handle: homepage-banner-video-3gqrnjc3

Fields:
  video_banner_hero:  ← Hero video (both pages)
  video_banner_1:     ← Secondary video (main homepage only)
  autoplay: True
  loop: True
  muted: True
```

---

## 🔄 How to Update Videos

### Option 1: From Shopify Admin (Recommended)
1. Go to **Shopify Admin > Content > Metaobjects**
2. Click **Homepage Banner Video** (#3GQRNJC3)
3. Upload new video to:
   - `video_banner_hero` (affects BOTH pages)
   - `video_banner_1` (main homepage only)
4. Save
5. **Videos update automatically on all pages!** ✅

### Option 2: Fallback to Code
If metaobject is not found, videos fall back to:
- `content/homepage.ts` → `heroSection.video.url`
- `content/homepage.ts` → `secondaryVideoSection.video.url`

---

## 📊 Video Usage by Page

| Page | Hero Video | Secondary Video | Component |
|------|-----------|-----------------|-----------|
| `/shop/home` | ✅ `video_banner_hero` | ✅ `video_banner_1` | `VideoPlayer` |
| `/shop/home-v2` | ✅ `video_banner_hero` | ❌ N/A | `VideoPlayerEnhanced` |

---

## 🎯 Files Modified

### 1. `lib/shopify/homepage-settings.ts`
**Functions Added:**
- `getSecondaryVideoSettings()` - Fetch secondary video
- `getSecondaryVideoSettingsWithFallback()` - With fallback

**Functions Updated:**
- `getHeroVideoSettings()` - Fetches from file references
- `getHeroSettingsWithFallback()` - Already existed

### 2. `app/shop/home/page.tsx`
**Changes:**
```typescript
// Added imports
import { getHeroSettingsWithFallback, getSecondaryVideoSettingsWithFallback }

// Fetch from metaobject
const heroSettings = await getHeroSettingsWithFallback(...)
const secondaryVideoSettings = await getSecondaryVideoSettingsWithFallback(...)

// Use in components
<VideoPlayer video={{ url: heroSettings.video.url, ... }} />
<VideoPlayer video={{ url: secondaryVideoSettings.url, ... }} />
```

### 3. `app/shop/home-v2/page.tsx`
**Changes:**
```typescript
// Added imports
import { getHeroSettingsWithFallback, getSecondaryVideoSettingsWithFallback }

// Fetch from metaobject
const heroSettings = await getHeroSettingsWithFallback(...)

// Use in component
<VideoPlayerEnhanced video={{ url: heroSettings.video.url, ... }} />
```

### 4. `next.config.js`
**CSP Updated:**
```javascript
// Added thestreetcollector.com to media-src
"media-src 'self' https://*.supabase.co https://cdn.shopify.com https://thestreetcollector.com blob:"
```

---

## ✅ Benefits

1. **Centralized Management**: Update videos in one place (Shopify Admin)
2. **Affects Multiple Pages**: Change hero video affects both homepages
3. **No Code Changes**: Upload new videos without touching code
4. **Automatic Optimization**: Shopify CDN handles compression and formats
5. **Fallback Safety**: If metaobject fails, falls back to static content

---

## 🧪 Testing

### Check Console Logs:
```
[Homepage Settings] Fetching from metaobject...
[Metaobjects] ✅ Found metaobject: homepage-banner-video-3gqrnjc3
[Homepage Settings] ✅ Found video URL from metaobject: https://...
[Homepage Settings] ✅ Using metaobject video URL: https://...

[Homepage Settings] Fetching secondary video from metaobject...
[Homepage Settings] ✅ Found secondary video URL from metaobject: https://...
[Homepage Settings] ✅ Using metaobject secondary video URL: https://...
```

### Test Pages:
1. **Main Homepage:** `/shop/home` or `/shop`
   - Should show 2 videos (hero + secondary)
   
2. **Enhanced Homepage:** `/shop/home-v2`
   - Should show 1 video (hero with GSAP effects)

---

## 📝 Summary

- ✅ **2 pages** now use Shopify metaobjects for videos
- ✅ **3 video instances** (2 on main, 1 on enhanced)
- ✅ **1 metaobject** manages all videos
- ✅ **Zero code** needed to update videos

**Update once, affects everywhere!** 🎉

---

**Status:** ✅ All Pages Updated  
**Date:** 2026-02-04  
**Action:** Test both pages to confirm videos load from Shopify

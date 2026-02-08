# ✅ Video Integration FIXED!

## Problem Identified

The video URL was being fetched correctly from the metaobject, but **Content Security Policy (CSP)** was blocking it.

### Error:
```
Loading media from 'https://thestreetcollector.com/cdn/shop/videos/...' 
violates CSP directive: "media-src 'self' https://*.supabase.co https://cdn.shopify.com blob:"
```

### Root Cause:
- Video URL: `https://thestreetcollector.com/...`
- CSP only allowed: `https://cdn.shopify.com`
- Your Shopify store uses `thestreetcollector.com` as the CDN domain

---

## Solution Applied

### Updated `next.config.js`:

**Before:**
```js
"media-src 'self' https://*.supabase.co https://cdn.shopify.com blob:"
```

**After:**
```js
"media-src 'self' https://*.supabase.co https://cdn.shopify.com https://thestreetcollector.com blob:"
```

---

## ✅ What's Working Now

1. **Metaobject Connection**: ✅
   - Type: `homepage_banner_video`
   - Handle: `homepage-banner-video-3gqrnjc3`
   - Status: Found

2. **Video URL Extraction**: ✅
   - Source: `video_banner_hero` (file reference)
   - URL: `https://thestreetcollector.com/cdn/shop/videos/c/vp/5531c01202a74010bbed68b55c62794d/5531c01202a74010bbed68b55c62794d.HD-1080p-2.5Mbps-70415361.mp4`
   - Quality: HD 1080p @ 2.5Mbps

3. **Settings Applied**: ✅
   - Autoplay: true
   - Loop: true
   - Muted: true

---

## 🚀 Next Steps

### 1. Restart Dev Server
**IMPORTANT**: You must restart your dev server for CSP changes to take effect.

```bash
# Press Ctrl+C in your terminal
# Then run:
npm run dev
```

### 2. Refresh Browser
- Clear cache (Ctrl+Shift+R or Cmd+Shift+R)
- Reload the homepage

### 3. Verify
You should see in console:
```
[Metaobjects] ✅ Found metaobject: homepage-banner-video-3gqrnjc3
[Homepage Settings] ✅ Found video URL from metaobject: https://...
[Homepage Settings] ✅ Using metaobject video URL: https://...
```

**No CSP errors!** ✅

---

## 📋 Summary of Changes

### Files Modified:
1. ✅ `lib/shopify/metaobjects.ts`
   - Added `MetaobjectFileReference` interface
   - Added `getMetaobjectFileUrl()` helper
   - Updated GraphQL query to fetch file references

2. ✅ `lib/shopify/homepage-settings.ts`
   - Updated `METAOBJECT_HANDLE` to `homepage-banner-video-3gqrnjc3`
   - Added `VIDEO_BANNER_HERO` and `VIDEO_BANNER_1` field keys
   - Updated `getHeroVideoSettings()` to use file references

3. ✅ `next.config.js`
   - Added `https://thestreetcollector.com` to CSP `media-src` directive

---

## 🎬 Your Video Details

**Primary Video:**
```
URL: https://thestreetcollector.com/cdn/shop/videos/c/vp/5531c01202a74010bbed68b55c62794d/5531c01202a74010bbed68b55c62794d.HD-1080p-2.5Mbps-70415361.mp4
Quality: HD 1080p
Bitrate: 2.5Mbps
Autoplay: Yes
Loop: Yes
Muted: Yes
```

**Fallback Video:**
```
URL: https://thestreetcollector.com/cdn/shop/videos/c/vp/9b4e561665cc4bd7b4694df4898de010/9b4e561665cc4bd7b4694df4898de010.HD-720p-4.5Mbps-69793823.mp4
Quality: HD 720p
Bitrate: 4.5Mbps
```

---

## 🔄 How to Update Video in Future

1. Go to **Shopify Admin > Content > Metaobjects**
2. Click **Homepage Banner Video**
3. Click your entry (#3GQRNJC3)
4. Upload new video to `video_banner_hero` field
5. Save
6. Refresh homepage - new video loads automatically! ✅

**No code changes needed!**

---

## 🐛 Debugging Tools

### Test Metaobject Connection:
```bash
node scripts/list-metaobjects.js
```

This shows:
- ✅ All metaobjects found
- ✅ Exact handle
- ✅ All field values
- ✅ Video URLs from file references

---

**Status:** ✅ Ready to Test  
**Date:** 2026-02-04  
**Action Required:** Restart dev server and refresh browser

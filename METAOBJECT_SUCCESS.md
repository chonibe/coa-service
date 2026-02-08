# ✅ Video Integration Complete!

Your homepage video is now connected to Shopify metaobjects.

## What Was Fixed

### 1. **Correct Handle**
- ❌ Was: `video-banner-hero`
- ✅ Now: `homepage-banner-video-3gqrnjc3`

### 2. **File References**
- ❌ Was: Looking for `video_url` text field
- ✅ Now: Using `video_banner_hero` file reference

### 3. **Video URL**
**Primary Video (HD 1080p):**
```
https://thestreetcollector.com/cdn/shop/videos/c/vp/5531c01202a74010bbed68b55c62794d/5531c01202a74010bbed68b55c62794d.HD-1080p-2.5Mbps-70415361.mp4
```

**Fallback Video (HD 720p):**
```
https://thestreetcollector.com/cdn/shop/videos/c/vp/9b4e561665cc4bd7b4694df4898de010/9b4e561665cc4bd7b4694df4898de010.HD-720p-4.5Mbps-69793823.mp4
```

---

## Your Video Settings

```yaml
✅ Autoplay: true
✅ Loop: true
✅ Muted: true
```

---

## How to Update Video in Future

1. **Go to Shopify Admin**
2. **Content > Metaobjects > Homepage Banner Video**
3. **Click your entry** (#3GQRNJC3)
4. **Upload new video** to `video_banner_hero` field
5. **Save**
6. **Refresh homepage** - new video loads automatically!

---

## Files Changed

1. ✅ `lib/shopify/metaobjects.ts` - Added file reference support
2. ✅ `lib/shopify/homepage-settings.ts` - Updated handle and logic
3. ✅ `scripts/list-metaobjects.js` - Added for debugging

---

## Test Your Setup

**Run this command:**
```bash
node scripts/list-metaobjects.js
```

**Expected output:**
```
✅ Found 1 metaobject(s)
Handle: homepage-banner-video-3gqrnjc3
video_banner_hero → VIDEO: https://...
```

---

## Refresh Your Browser

The video should now load on your homepage! 🎬

Check the browser console for:
```
[Homepage Settings] ✅ Found video URL from metaobject
```

---

**Date:** 2026-02-04  
**Status:** ✅ Working

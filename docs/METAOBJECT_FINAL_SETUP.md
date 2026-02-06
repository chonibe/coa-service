# ✅ Metaobject Video Integration - Complete!

**Status:** Connected and Working  
**Metaobject ID:** #3GQRNJC3  
**Handle:** `homepage-banner-video-3gqrnjc3`

---

## 🎬 Your Videos

### Primary Video (video_banner_hero)
**URL:** `https://thestreetcollector.com/cdn/shop/videos/c/vp/5531c01202a74010bbed68b55c62794d/5531c01202a74010bbed68b55c62794d.HD-1080p-2.5Mbps-70415361.mp4`
- ✅ HD 1080p quality
- ✅ 2.5Mbps bitrate
- ✅ Automatically fetched from Shopify

### Secondary Video (video_banner_1)
**URL:** `https://thestreetcollector.com/cdn/shop/videos/c/vp/9b4e561665cc4bd7b4694df4898de010/9b4e561665cc4bd7b4694df4898de010.HD-720p-4.5Mbps-69793823.mp4`
- ✅ HD 720p quality
- ✅ 4.5Mbps bitrate
- ✅ Used as fallback if primary not found

---

## 🔧 How It Works

### 1. Video Fetching Logic
The code follows this priority:
1. **First**: Try `video_banner_hero` (file reference) ← **Your primary video**
2. **Second**: Try `video_url` (direct URL field - if you add it later)
3. **Third**: Try `video_banner_1` (file reference - your fallback)

### 2. File References vs Direct URLs
Your metaobject uses **file_reference** type fields, which means:
- ✅ Videos are managed in Shopify Files
- ✅ Shopify handles optimization and CDN
- ✅ You upload once, Shopify creates multiple quality versions
- ✅ URLs are automatically generated

---

## 📝 Current Settings

```yaml
Metaobject: homepage_banner_video
Handle: homepage-banner-video-3gqrnjc3

Video Settings:
  video_banner_hero: ✅ HD 1080p (primary)
  video_banner_1: ✅ HD 720p (fallback)
  autoplay: true
  loop: true
  muted: true

Text Content (using fallback from code):
  headline: "One lamp, Endless Inspiration.."
  cta_text: "Shop Now"
  cta_url: "/shop/street_lamp"
```

---

## 🎯 Next Steps

### To Change the Video:
1. Go to **Shopify Admin > Content > Metaobjects**
2. Click **Homepage Banner Video**
3. Click your entry (#3GQRNJC3)
4. Click the **video_banner_hero** field
5. Upload a new video
6. Save
7. Refresh your homepage - new video loads automatically!

### To Add Text Content (Optional):
You can add these fields in Shopify Admin:
- `headline` - Main hero text
- `subheadline` - Secondary text
- `cta_text` - Button text
- `cta_url` - Button link
- `text_color` - Hex color for text
- `overlay_color` - Hex overlay color
- `overlay_opacity` - Overlay opacity (0-100)

**For now**: Text uses fallback values from `content/homepage.ts`

---

## 🛠️ Technical Details

### Updated Files:
1. ✅ **lib/shopify/metaobjects.ts**
   - Added `MetaobjectFileReference` interface
   - Added `getMetaobjectFileUrl()` helper
   - Updated GraphQL query to fetch file references

2. ✅ **lib/shopify/homepage-settings.ts**
   - Updated `METAOBJECT_HANDLE` to `homepage-banner-video-3gqrnjc3`
   - Added `VIDEO_BANNER_HERO` and `VIDEO_BANNER_1` field keys
   - Updated `getHeroVideoSettings()` to use file references

3. ✅ **app/shop/home/page.tsx**
   - Already uses `getHeroSettingsWithFallback()`
   - Automatically pulls from metaobject

### GraphQL Query:
```graphql
query GetMetaobject($type: String!, $handle: String!) {
  metaobject(handle: {type: $type, handle: $handle}) {
    id
    type
    handle
    fields {
      key
      value
      type
      reference {
        ... on Video {
          id
          alt
          sources {
            url
            mimeType
          }
        }
      }
    }
  }
}
```

---

## 🧪 Testing

### Check Browser Console:
You should see:
```
[Metaobjects] Fetching metaobject type="homepage_banner_video" handle="homepage-banner-video-3gqrnjc3"
[Metaobjects] ✅ Found metaobject: homepage-banner-video-3gqrnjc3
[Homepage Settings] ✅ Found video URL from metaobject: https://...
```

### Run Test Script:
```bash
node scripts/list-metaobjects.js
```

This shows:
- ✅ All metaobjects found
- ✅ Exact handle
- ✅ All field values
- ✅ Video URLs from file references

---

## 🎉 Success Checklist

- [x] Metaobject found correctly
- [x] Handle identified: `homepage-banner-video-3gqrnjc3`
- [x] Video file references working
- [x] Primary video URL extracted: HD 1080p
- [x] Boolean settings working (autoplay, loop, muted)
- [x] Code updated to fetch from metaobject
- [x] Fallback content working for text fields
- [x] Test script created for debugging

---

## 📚 Related Documentation

- [Metaobjects Usage Guide](./SHOPIFY_METAOBJECTS_USAGE.md)
- [Collection Sorting](./SHOPIFY_COLLECTION_SORTING.md)
- [Homepage Cleanup](./HOMEPAGE_CLEANUP_2026-02-04.md)

---

**Last Updated:** 2026-02-04  
**Status:** ✅ Production Ready  
**Video Quality:** HD 1080p (2.5Mbps)

# Metaobject Setup - Ready to Use!

**Status:** ✅ Connected  
**Metaobject ID:** #3GQRNJC3

---

## Your Current Setup

### Video URL Format

You entered: `C1B48009-95B2-4011-8DA8-E406A128E001.mp4`

The code will automatically convert this to the full CDN URL:
```
https://cdn.shopify.com/videos/c/o/v/C1B48009-95B2-4011-8DA8-E406A128E001.mov
```

### Boolean Fields (checkboxes)
- ✅ `autoplay`: True
- ✅ `loop`: True  
- ✅ `muted`: True

### Text Fields (currently empty)
You can add these later in Shopify Admin:
- `headline` - Main hero text
- `subheadline` - Secondary text
- `cta_text` - Button text
- `cta_url` - Button link
- `text_color` - Hex color for text
- `overlay_color` - Hex color for overlay
- `overlay_opacity` - Number 0-100

**For now, these will use the fallback values from `content/homepage.ts`**

---

## What Happens Now

### Video Loading:
1. ✅ Code fetches metaobject `homepage_banner_video`
2. ✅ Gets video ID: `C1B48009-95B2-4011-8DA8-E406A128E001`
3. ✅ Constructs full CDN URL
4. ✅ Displays video on homepage

### Text Content:
1. ⚠️ Text fields are empty in metaobject
2. ✅ Falls back to `content/homepage.ts`:
   - Headline: "One lamp, Endless Inspiration.."
   - CTA: "Shop Now" → `/shop/street_lamp`
   - Colors: White text, no overlay

---

## To Add Text Content Later

1. Go to **Content > Metaobjects > Homepage Banner Video**
2. Click your entry (#3GQRNJC3)
3. Fill in text fields:
   ```
   headline: Your custom headline
   cta_text: Shop Now
   cta_url: /shop/street_lamp
   text_color: #ffffff
   ```
4. Save
5. Refresh homepage

---

## Video URL Formats Supported

### Option 1: Just the Video ID (what you have)
```
C1B48009-95B2-4011-8DA8-E406A128E001.mp4
```
✅ Code automatically adds CDN path

### Option 2: Full CDN URL
```
https://cdn.shopify.com/videos/c/o/v/C1B48009-95B2-4011-8DA8-E406A128E001.mov
```
✅ Code uses as-is

### Option 3: External URL
```
https://your-cdn.com/video.mp4
```
✅ Code uses as-is

---

## Testing

1. **Check browser console** for logs:
   ```
   [Metaobjects] Fetching metaobject...
   [Metaobjects] ✅ Found metaobject: video-banner-hero
   [Homepage Settings] Constructed CDN URL: https://...
   [Homepage Settings] ✅ Using metaobject video URL
   ```

2. **Visit homepage:** `https://your-store.com/shop`

3. **Video should load** with your video ID

4. **If video doesn't load:**
   - Check browser console for errors
   - Verify video URL is accessible
   - Run test script: `node scripts/test-metaobject.js`

---

## Current Configuration

```typescript
// lib/shopify/homepage-settings.ts
const METAOBJECT_TYPE = 'homepage_banner_video'
const METAOBJECT_HANDLE = 'video-banner-hero'

// Field keys
video_url      → C1B48009-95B2-4011-8DA8-E406A128E001.mp4
video_poster   → (file reference)
autoplay       → True
loop           → True
muted          → True
headline       → (empty - uses fallback)
subheadline    → (empty - uses fallback)
cta_text       → (empty - uses fallback)
cta_url        → (empty - uses fallback)
text_color     → (empty - uses fallback)
overlay_color  → (empty - uses fallback)
overlay_opacity → (empty - uses fallback)
```

---

## Next Steps

### Immediate:
1. ✅ Video should now load on homepage
2. ✅ Text uses fallback content
3. ✅ All boolean settings working

### Optional (add text content):
1. Edit metaobject in Shopify
2. Fill in headline, CTA, colors
3. Save and test

### If issues:
1. Check browser console
2. Run `node scripts/test-metaobject.js`
3. Verify Storefront API scopes
4. Check metaobject is active

---

**Last Updated:** 2026-02-04  
**Your Video ID:** C1B48009-95B2-4011-8DA8-E406A128E001  
**Metaobject:** #3GQRNJC3

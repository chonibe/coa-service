# Using Existing Shopify Metaobjects for Homepage Video

**Status:** ✅ Ready to Use  
**Your Metaobject:** `homepage_banner_video` (#SPGCZHXX)  
**Entries:** Video Banner Hero, Video Banner 1

---

## Overview

Your homepage is now connected to the `homepage_banner_video` metaobject you created in Shopify. You can edit the video URL and other hero content directly in Shopify Admin under **Content > Metaobjects**.

---

## Current Setup

### Metaobject Type
- **Type:** `homepage_banner_video`
- **ID:** #SPGCZHXX
- **Location:** Content > Metaobjects

### Entries You Created
1. **Video Banner Hero** - Used for main homepage
2. **Video Banner 1** - Available for alternate content

### Active Entry
Currently using: `video_banner_hero`

---

## How to Update Video URL

### Quick Steps:

1. **Go to Shopify Admin**
   - Navigate to **Content > Metaobjects**
   - Find **Homepage Banner Video** (#SPGCZHXX)

2. **Edit Video Banner Hero**
   - Click on "Video Banner Hero" entry
   - Update the fields you want to change

3. **Save**
   - Click **Save**
   - Changes appear on homepage within 60 seconds

---

## Expected Fields

The code expects these fields in your metaobject:

### Video Fields
- `video_url` - Video URL from Shopify CDN or external
- `video_poster` - Poster image (optional)
- `autoplay` - Boolean (true/false or 1/0)
- `loop` - Boolean (true/false or 1/0)
- `muted` - Boolean (true/false or 1/0)

### Text Content Fields
- `headline` - Main headline text
- `subheadline` - Subheadline (optional)
- `cta_text` - Button text
- `cta_url` - Button link

### Styling Fields
- `text_color` - Hex color code (e.g., #ffffff)
- `overlay_color` - Hex color code (e.g., #000000)
- `overlay_opacity` - Number 0-100

---

## Field Mapping

Here's how your metaobject fields map to the homepage:

```
Your Metaobject Field       →  What It Controls
─────────────────────────────────────────────────
video_url                   →  Hero video source
video_poster                →  Image before video loads
autoplay                    →  Auto-play on page load
loop                        →  Loop video continuously
muted                       →  Mute audio
headline                    →  Large hero text
subheadline                 →  Smaller text below headline
cta_text                    →  "Shop Now" button text
cta_url                     →  Button destination
text_color                  →  Color of headline/CTA
overlay_color               →  Dark overlay on video
overlay_opacity             →  Overlay darkness (0-100)
```

---

## Example Values

### For Video Banner Hero Entry:

**Video URL:**
```
https://cdn.shopify.com/videos/c/o/v/C1B48009-95B2-4011-8DA8-E406A128E001.mov
```

**Video Settings:**
```
autoplay: true (or 1)
loop: true (or 1)
muted: true (or 1)
```

**Text Content:**
```
headline: One lamp, Endless Inspiration..
subheadline: (leave empty or add text)
cta_text: Shop Now
cta_url: /shop/street_lamp
```

**Styling:**
```
text_color: #ffffff
overlay_color: #000000
overlay_opacity: 0
```

---

## Switching Between Entries

If you want to use "Video Banner 1" instead of "Video Banner Hero":

### Option 1: Change in Code
Edit `lib/shopify/homepage-settings.ts`:
```typescript
const METAOBJECT_HANDLE = 'video_banner_1' // Changed from 'video_banner_hero'
```

### Option 2: Update Entry Content
Just edit the "Video Banner Hero" entry with new content. No code changes needed!

---

## Testing Your Changes

1. **Update metaobject** in Shopify Admin
2. **Save** the entry
3. **Visit homepage:** `https://your-store.com/shop`
4. **Refresh** (Ctrl+Shift+R to clear cache)
5. **Verify** video loads with new URL

### Cache Note:
Changes may take up to 60 seconds to appear due to Next.js caching.

---

## Troubleshooting

### Video not loading?

**Check metaobject fields:**
1. Go to Content > Metaobjects
2. Open "Video Banner Hero"
3. Verify `video_url` field has a valid URL
4. Check URL is accessible (try opening in browser)

**Check browser console:**
1. Press F12
2. Go to Console tab
3. Look for errors related to video loading

**Common issues:**
- ❌ Field key doesn't match (must be `video_url`, not `videoUrl`)
- ❌ URL is not accessible (404 error)
- ❌ Video format not supported by browser
- ❌ Missing required fields

### Metaobject not found?

The code looks for:
- **Type:** `homepage_banner_video`
- **Handle:** `video_banner_hero`

**Verify in Shopify:**
1. Content > Metaobjects
2. Check the metaobject type matches
3. Check the entry handle matches
4. Handle is in the URL: `.../video_banner_hero`

### Fields not showing?

**Field keys are case-sensitive:**
- ✅ Correct: `video_url`
- ❌ Wrong: `videoUrl` or `Video URL`

**Check field definitions:**
1. Settings > Custom data > Metaobjects
2. Find "Homepage Banner Video"
3. Review field keys

---

## Adding New Fields

If you want to add more fields to control:

### 1. Add Field to Metaobject Definition
1. Settings > Custom data > Metaobjects
2. Find "Homepage Banner Video"
3. Add new field (e.g., `background_color`)
4. Save

### 2. Update Code
Edit `lib/shopify/homepage-settings.ts`:
```typescript
const FIELD_KEYS = {
  // ... existing fields
  BACKGROUND_COLOR: 'background_color', // Add new field key
}
```

### 3. Fetch in Code
```typescript
const backgroundColor = getMetaobjectField(metaobject, FIELD_KEYS.BACKGROUND_COLOR)
```

---

## API Details

### GraphQL Query Used:
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
    }
  }
}
```

### Variables:
```json
{
  "type": "homepage_banner_video",
  "handle": "video_banner_hero"
}
```

### Response Example:
```json
{
  "data": {
    "metaobject": {
      "id": "gid://shopify/Metaobject/...",
      "type": "homepage_banner_video",
      "handle": "video_banner_hero",
      "fields": [
        {
          "key": "video_url",
          "value": "https://cdn.shopify.com/videos/...",
          "type": "single_line_text_field"
        },
        {
          "key": "headline",
          "value": "One lamp, Endless Inspiration..",
          "type": "single_line_text_field"
        }
      ]
    }
  }
}
```

---

## Benefits of Metaobjects

✅ **Structured Content** - Organized fields with validation  
✅ **Reusable** - Create multiple banner variations  
✅ **Version Control** - Easy to revert changes  
✅ **No Code Changes** - Edit directly in Shopify Admin  
✅ **Type Safety** - Field definitions ensure consistency  

---

## Next Steps

1. ✅ Code is updated to use your metaobject
2. ⏭️ Edit "Video Banner Hero" entry in Shopify
3. ⏭️ Add your video URL to `video_url` field
4. ⏭️ Fill in other fields (headline, CTA, etc.)
5. ⏭️ Save and test on homepage

---

## Quick Reference

**Edit Content:**
```
Shopify Admin > Content > Metaobjects > 
Homepage Banner Video > Video Banner Hero > Edit > Save
```

**View on Homepage:**
```
https://your-store.com/shop
```

**Code Location:**
```
lib/shopify/homepage-settings.ts
lib/shopify/metaobjects.ts
app/shop/home/page.tsx
```

---

**Last Updated:** 2026-02-04  
**Status:** Connected and Ready  
**Your Metaobject ID:** #SPGCZHXX

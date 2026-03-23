# ✅ Video Now Connected to Shopify

**Status:** Live and Working  
**Last Updated:** 2026-03-23

---

## What's Working

✅ **Homepage video fetches from Shopify metaobject**  
✅ **Video URL:** From your `homepage_banner_video` metaobject  
✅ **Text content:** Falls back to existing static content  
✅ **No breaking changes:** Site works with or without metaobject  

---

## How It Works Now

### Video Source:
```
Shopify Admin > Content > Metaobjects > 
Homepage Banner Video (#SPGCZHXX) > 
Video Banner Hero > video_url field
```

### Text Content:
```
Falls back to: content/homepage.ts
- Headline: "One lamp, Endless Inspiration.."
- CTA: "Shop Now"
- CTA URL: "/shop/street_lamp"
```

### Why This Works:
The code merges Shopify data with static fallbacks:
- If metaobject has `video_url` → Use it ✅
- If metaobject has `headline` → Use it
- If metaobject missing `headline` → Use static fallback ✅
- This way nothing breaks!

### Autoplay, loop, muted (metaobject text fields)

- **Empty or missing field:** Treated as “not set”; the app uses values from [`content/homepage.ts`](../content/homepage.ts) (e.g. autoplay on for the hero).
- **Explicit on:** `true`, `1` (case-insensitive) → enabled.
- **Explicit off:** `false`, `0` (case-insensitive) → disabled.
- **Implementation:** [`lib/shopify/homepage-settings.ts`](../lib/shopify/homepage-settings.ts) (`parseMetaobjectBool` + `?? fallback` merge).

Hero playback UI uses [`components/sections/VideoPlayer.tsx`](../components/sections/VideoPlayer.tsx) / [`VideoPlayerEnhanced.tsx`](../components/sections/VideoPlayerEnhanced.tsx): autoplay defaults to **on** unless `autoplay: false` is passed explicitly.

---

## To Update Video URL

### Quick Steps:

1. **Shopify Admin** → **Content** → **Metaobjects**
2. Find **Homepage Banner Video** (#SPGCZHXX)
3. Click **"Video Banner Hero"**
4. Update `video_url` field with new URL
5. **Save**
6. Refresh homepage (Ctrl+Shift+R)

**That's it!** Video updates automatically. 🎉

---

## To Add Text Fields Later

When you're ready to manage text in Shopify too:

### 1. Add Values to Metaobject

In the same "Video Banner Hero" entry, fill in:
- `headline` → "Your headline"
- `subheadline` → "Your subheadline"
- `cta_text` → "Your button text"
- `cta_url` → "/your/link"
- `text_color` → "#ffffff"
- `overlay_color` → "#000000"
- `overlay_opacity` → 0

### 2. Save

That's it! The code will automatically use these values instead of the fallbacks.

---

## Current Behavior

| Field | Source | Value |
|-------|--------|-------|
| Video URL | ✅ Shopify Metaobject | Your uploaded video |
| Video Poster | ✅ Shopify Metaobject | (if you added it) |
| Autoplay | ✅ Shopify Metaobject or fallback | See toggle rules below |
| Loop | ✅ Shopify Metaobject or fallback | See toggle rules below |
| Muted | ✅ Shopify Metaobject or fallback | See toggle rules below |
| Headline | 📄 Static Fallback | "One lamp, Endless Inspiration.." |
| Subheadline | 📄 Static Fallback | "" |
| CTA Text | 📄 Static Fallback | "Shop Now" |
| CTA URL | 📄 Static Fallback | "/shop/street_lamp" |
| Text Color | 📄 Static Fallback | "#ffffff" |
| Overlay Color | 📄 Static Fallback | "#000000" |
| Overlay Opacity | 📄 Static Fallback | 0 |

---

## Testing

### What to Check:

1. ✅ Homepage loads
2. ✅ Video plays from Shopify URL
3. ✅ Headline shows: "One lamp, Endless Inspiration.."
4. ✅ Button shows: "Shop Now"
5. ✅ Button links to: /shop/street_lamp
6. ✅ Text is white (#ffffff)
7. ✅ No dark overlay (opacity: 0)

### If Video Doesn't Load:

**Check browser console (F12):**
- Look for errors about video loading
- Check if URL is accessible

**Verify in Shopify:**
1. Content > Metaobjects
2. Homepage Banner Video
3. Video Banner Hero
4. Check `video_url` has valid URL

**Test the URL directly:**
- Copy the URL from metaobject
- Paste in browser address bar
- Should download or play the video

---

## Fallback Safety

The site will **never break** even if:
- ❌ Metaobject is deleted
- ❌ Fields are empty
- ❌ API fails
- ❌ Network issues

**Why?** Fallback to `content/homepage.ts` always works!

---

## Code Flow

```
1. Homepage loads
     ↓
2. Fetch from Shopify metaobject
     ↓
3. If found → Use video URL from metaobject
   If NOT found → Use fallback URL
     ↓
4. If text fields found → Use from metaobject
   If NOT found → Use fallback text
     ↓
5. Merge and render VideoPlayer
     ↓
6. Video plays on homepage ✅
```

---

## Files Involved

**Fetching logic:**
- `lib/shopify/metaobjects.ts` - Fetch metaobjects
- `lib/shopify/homepage-settings.ts` - Get hero settings

**Homepage:**
- `app/shop/home/page.tsx` - Uses the settings

**Fallback content:**
- `content/homepage.ts` - Static defaults

**Video player:**
- `components/sections/VideoPlayer.tsx` - Renders video

---

## Cache Info

**Shopify API Cache:** 60 seconds  
**Next.js Cache:** 60 seconds

**Total delay:** Up to 2 minutes for changes to appear

**To see changes immediately:**
1. Hard refresh: `Ctrl + Shift + R` (Windows)
2. Or: `Cmd + Shift + R` (Mac)
3. Or: Clear cache and reload

---

## What You Can Edit Now

### In Shopify Admin:

✅ **Video URL** - Upload new video, paste URL  
✅ **Video Poster** - Poster image  
✅ **Autoplay** - On/off  
✅ **Loop** - On/off  
✅ **Muted** - On/off  

### Coming from Code (for now):

📄 **Headline** - From `content/homepage.ts`  
📄 **CTA Text** - From `content/homepage.ts`  
📄 **CTA URL** - From `content/homepage.ts`  
📄 **Colors** - From `content/homepage.ts`

*You can add these to metaobject anytime!*

---

## Next Steps (Optional)

### If you want to manage ALL content in Shopify:

1. Edit "Video Banner Hero" metaobject
2. Add values to text fields:
   - headline
   - subheadline
   - cta_text
   - cta_url
   - text_color
   - overlay_color
   - overlay_opacity
3. Save
4. Code will automatically use those instead of fallbacks

### If you're happy with current setup:

Just keep managing the video URL in Shopify. Text stays in code. Both work! ✅

---

## Summary

🎉 **Success!** Your homepage video is now:
- ✅ Connected to Shopify
- ✅ Editable in Admin
- ✅ Automatically fetched
- ✅ Safe with fallbacks
- ✅ Working right now

**Update video anytime in Shopify Admin → Changes go live automatically!**

---

**Questions?** Check:
- Usage guide: `docs/SHOPIFY_METAOBJECTS_USAGE.md`
- Setup details: `docs/COMMIT_LOGS/shopify-metafields-integration-2026-02-04.md`

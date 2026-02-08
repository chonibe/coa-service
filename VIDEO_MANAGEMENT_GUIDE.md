# 🎬 Video Management Guide

## Quick Reference: How to Update Videos

### 🚀 Method 1: Shopify Admin (Recommended)

1. **Go to:** Shopify Admin → Content → Metaobjects
2. **Click:** Homepage Banner Video
3. **Click:** Your entry (#3GQRNJC3)
4. **Upload video to:**
   - `video_banner_hero` → Updates hero on BOTH pages
   - `video_banner_1` → Updates secondary on main homepage
5. **Save**
6. **Refresh website** → Videos update instantly!

**✅ No code changes needed!**

---

## 📍 Where Videos Appear

### `video_banner_hero` (Primary)
**Appears on:**
- Main Homepage (`/shop` or `/shop/home`) - Top of page
- Enhanced Homepage (`/shop/home-v2`) - Top of page

**Current Video:**
- Quality: HD 1080p @ 2.5Mbps
- URL: `https://thestreetcollector.com/.../HD-1080p-2.5Mbps-70415361.mp4`

### `video_banner_1` (Secondary)
**Appears on:**
- Main Homepage (`/shop` or `/shop/home`) - After Featured Product

**Current Video:**
- Quality: HD 720p @ 4.5Mbps
- URL: `https://thestreetcollector.com/.../HD-720p-4.5Mbps-69793823.mp4`

---

## ⚙️ Shared Settings

These settings affect **all videos**:
- ✅ **autoplay**: True
- ✅ **loop**: True
- ✅ **muted**: True

To change these, edit the metaobject fields in Shopify Admin.

---

## 🎯 One Change, Multiple Updates

When you update `video_banner_hero`:
1. ✅ Main homepage hero updates
2. ✅ Enhanced homepage hero updates

**That's the power of centralized management!**

---

## 🛠️ Troubleshooting

### Video not showing?
1. **Check console** for errors
2. **Verify metaobject** is active in Shopify
3. **Confirm video uploaded** to correct field
4. **Restart dev server** (if local)
5. **Hard refresh browser** (Ctrl+Shift+R)

### CSP errors?
The Content Security Policy already allows:
- `https://thestreetcollector.com`
- `https://cdn.shopify.com`

If you see CSP errors, restart your dev server.

### Fallback behavior
If metaobject fails, videos fall back to:
- `content/homepage.ts` → `heroSection.video.url`
- `content/homepage.ts` → `secondaryVideoSection.video.url`

---

## 📊 Current Configuration

```yaml
Metaobject Details:
  Type: homepage_banner_video
  Handle: homepage-banner-video-3gqrnjc3
  ID: #3GQRNJC3
  Status: Active ✅

Video Fields:
  video_banner_hero: gid://shopify/Video/66854735708546
    └─ Used by: Main homepage (hero), Enhanced homepage (hero)
    
  video_banner_1: gid://shopify/Video/66838763635074
    └─ Used by: Main homepage (secondary)

Settings Fields:
  autoplay: true
  loop: true
  muted: true
```

---

## 🎓 Best Practices

### Video Formats
- **Recommended:** MP4 (H.264)
- **Quality:** 720p or 1080p
- **Bitrate:** 2-5 Mbps for web
- **Max size:** Keep under 50MB for fast loading

### File Naming
Use descriptive names:
- ✅ `hero-video-2025.mp4`
- ✅ `product-showcase.mp4`
- ❌ `video1.mp4`

### Testing
After uploading:
1. Check on desktop
2. Check on mobile
3. Test autoplay works
4. Verify loop behavior

---

## 🔄 Update Workflow

```mermaid
1. Upload video to Shopify
   ↓
2. Shopify processes and optimizes
   ↓
3. Video available at CDN URL
   ↓
4. Next.js fetches from metaobject
   ↓
5. Video displays on homepage
   ↓
6. Cached for fast loading
```

**Time to update:** ~30 seconds after upload ✅

---

## 📞 Need Help?

**Check these files:**
- `lib/shopify/homepage-settings.ts` - Video fetching logic
- `app/shop/home/page.tsx` - Main homepage
- `app/shop/home-v2/page.tsx` - Enhanced homepage
- `next.config.js` - CSP configuration

**Documentation:**
- `BOTH_VIDEOS_CONNECTED.md` - Technical details
- `ALL_PAGES_UPDATED.md` - Page-by-page breakdown
- `VIDEO_FIXED.md` - CSP fix history

---

**Last Updated:** 2026-02-04  
**Status:** ✅ Fully Configured  
**Managed Videos:** 2 (hero + secondary)  
**Affected Pages:** 2 (main + enhanced)

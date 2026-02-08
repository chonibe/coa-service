# Quick Start: Connect Video to Shopify

**Goal:** Edit your homepage video URL directly in Shopify Admin

**Time:** 5 minutes

---

## Step 1: Get Admin API Token

1. Go to **Shopify Admin**
2. **Apps** > **Develop apps** > **Create an app**
3. Name it: "Homepage Content Manager"
4. **Configuration** > **Admin API**
5. Select scopes:
   - ✅ `write_metaobject_definitions`
   - ✅ `write_pages`
6. **Save**
7. **Install app**
8. Copy the **Admin API access token** (starts with `shpat_...`)

---

## Step 2: Add to .env File

Add these two lines to your `.env` file:

```env
SHOPIFY_SHOP=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
```

Replace with your actual values!

---

## Step 3: Run Setup Script

Open terminal in your project root:

```bash
node scripts/shopify/setup-metafields.js
```

**Windows PowerShell:**
```powershell
.\scripts\shopify\setup-metafields.ps1
```

You should see:
```
✅ Created: Hero Video URL (custom.hero_video_url)
✅ Created: Hero Headline (custom.hero_headline)
...
✅ Created page: Homepage Settings
🎉 Setup complete!
```

---

## Step 4: Add Your Video URL

1. Go to **Shopify Admin** > **Online Store** > **Pages**
2. Open **"Homepage Settings"** page
3. Scroll to **Metafields** section
4. Find **Hero Video URL**
5. Paste your video URL:
   ```
   https://cdn.shopify.com/videos/c/o/v/YOUR-VIDEO-ID.mov
   ```
6. **Save** the page

---

## Step 5: Test

1. Visit your homepage
2. Video should load from Shopify metafield
3. ✅ Done!

---

## To Change Video in Future:

1. Upload new video to **Content** > **Files**
2. Copy CDN URL
3. **Pages** > **Homepage Settings**
4. Update **Hero Video URL**
5. **Save**
6. Refresh homepage

**No code changes needed!** 🎉

---

## Troubleshooting

**Script fails?**
- Check `.env` file has correct values
- Verify Admin API token has correct scopes
- See full guide: `scripts/shopify/README.md`

**Metafields not showing?**
- Refresh Shopify Admin
- Re-run script
- Check `Settings > Custom data > Pages`

**Video not loading?**
- Verify URL in metafield is correct
- Check browser console for errors
- Wait 60 seconds for cache to clear

---

**Full Documentation:**
- Setup guide: `docs/SHOPIFY_HOMEPAGE_METAFIELDS_SETUP.md`
- Script docs: `scripts/shopify/README.md`
- Integration details: `docs/COMMIT_LOGS/shopify-metafields-integration-2026-02-04.md`

# Shopify Metafields Setup Scripts

Automated scripts to set up homepage metafields via Shopify Admin API.

---

## Quick Start

### Prerequisites

1. **Shopify Admin API Access Token**
   - Go to Shopify Admin > Apps > **Develop apps**
   - Create an app (e.g., "Homepage Content Manager")
   - Configure **Admin API scopes:**
     - `write_metaobject_definitions`
     - `write_pages`
   - Install the app
   - Copy the **Admin API access token** (starts with `shpat_...`)

2. **Environment Variables**
   Add to your `.env` file:
   ```env
   SHOPIFY_SHOP=your-store.myshopify.com
   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
   ```

---

## Running the Setup

### Option 1: Node.js (Recommended)

```bash
# From project root
node scripts/shopify/setup-metafields.js
```

### Option 2: PowerShell (Windows)

```powershell
# From project root
.\scripts\shopify\setup-metafields.ps1
```

### Option 3: Bash (Mac/Linux)

```bash
# From project root
chmod +x scripts/shopify/setup-homepage-metafields.sh
./scripts/shopify/setup-homepage-metafields.sh
```

---

## What the Script Does

### 1. Creates Metafield Definitions

The script creates these metafield definitions for Pages:

| Name | Key | Type | Description |
|------|-----|------|-------------|
| Hero Video URL | `custom.hero_video_url` | Single line text | Video URL from Shopify CDN |
| Hero Video Poster | `custom.hero_video_poster` | File reference | Poster image |
| Hero Video Settings | `custom.hero_video_settings` | JSON | Playback settings |
| Hero Headline | `custom.hero_headline` | Single line text | Main headline |
| Hero Subheadline | `custom.hero_subheadline` | Single line text | Subheadline |
| Hero CTA Text | `custom.hero_cta_text` | Single line text | Button text |
| Hero CTA URL | `custom.hero_cta_url` | URL | Button link |
| Hero Text Color | `custom.hero_text_color` | Color | Text color |
| Hero Overlay Color | `custom.hero_overlay_color` | Color | Overlay color |
| Hero Overlay Opacity | `custom.hero_overlay_opacity` | Integer | Opacity (0-100) |

### 2. Creates Homepage Settings Page

- **Title:** Homepage Settings
- **Handle:** `homepage-settings`
- **Published:** No (hidden from customers)
- **Purpose:** Stores metafield values

---

## After Running the Script

### 1. Verify in Shopify Admin

**Check Metafield Definitions:**
1. Go to **Settings > Custom data > Pages**
2. You should see all 10 metafield definitions listed

**Check Homepage Page:**
1. Go to **Online Store > Pages**
2. Find "Homepage Settings" page
3. Open it

### 2. Add Metafield Values

1. Open **Homepage Settings** page
2. Scroll to **Metafields** section
3. Fill in the values:

#### Example Values:

**Hero Video URL:**
```
https://cdn.shopify.com/videos/c/o/v/C1B48009-95B2-4011-8DA8-E406A128E001.mov
```

**Hero Video Settings (JSON):**
```json
{
  "autoplay": true,
  "loop": true,
  "muted": true
}
```

**Hero Headline:**
```
One lamp, Endless Inspiration..
```

**Hero CTA Text:**
```
Shop Now
```

**Hero CTA URL:**
```
/shop/street_lamp
```

**Hero Text Color:**
```
#ffffff
```

**Hero Overlay Color:**
```
#000000
```

**Hero Overlay Opacity:**
```
0
```

4. Click **Save**

### 3. Test Your Homepage

1. Visit your homepage: `https://your-store.com/shop`
2. The hero video should load from the metafield
3. Changes should appear within 60 seconds

---

## Troubleshooting

### Script Errors

**"Missing required environment variables"**
- Ensure `SHOPIFY_SHOP` and `SHOPIFY_ADMIN_ACCESS_TOKEN` are set
- Check your `.env` file
- Restart your terminal/IDE

**"Access denied" or "401 Unauthorized"**
- Verify your Admin API access token is correct
- Check the token has required scopes:
  - `write_metaobject_definitions`
  - `write_pages`
- Make sure you're using an **Admin API token** (starts with `shpat_`)

**"Metafield already exists"**
- This is normal if you run the script multiple times
- The script will skip existing metafields
- No action needed

**"Page already exists"**
- The homepage-settings page already exists
- No action needed
- You can manually edit it in Shopify Admin

### Metafields Not Appearing

**In Shopify Admin:**
1. Go to **Settings > Custom data > Pages**
2. Check if definitions are listed
3. If not, re-run the script

**On Homepage Page:**
1. Open "Homepage Settings" page
2. If metafields section is missing, refresh the page
3. If still missing, check metafield definitions

### API Rate Limiting

If you see rate limit errors:
- Wait 1-2 minutes
- Re-run the script
- The script handles this automatically

---

## Manual Setup (If Script Fails)

If the automated script doesn't work, you can set up manually:

### 1. Create Metafield Definitions

Go to **Settings > Custom data > Pages** and create each definition:

**Example - Hero Video URL:**
- Click **Add definition**
- Name: `Hero Video URL`
- Namespace and key: `custom.hero_video_url`
- Type: Single line text
- Description: Main homepage hero video URL (MP4 or MOV)
- Save

Repeat for all 10 metafields (see table above).

### 2. Create Page

Go to **Online Store > Pages**:
- Click **Add page**
- Title: `Homepage Settings`
- Handle: `homepage-settings`
- Content: Description of purpose
- Save

### 3. Add Values

Open the page and fill in metafields.

---

## Updating Video URL

### Quick Update Process:

1. Upload new video to **Content > Files**
2. Copy the CDN URL
3. Go to **Pages > Homepage Settings**
4. Update `custom.hero_video_url` metafield
5. Save
6. Refresh homepage

**No code changes needed!**

---

## Required Shopify API Scopes

### Admin API (for setup script):
- ✅ `write_metaobject_definitions` - Create metafield definitions
- ✅ `write_pages` - Create homepage settings page

### Storefront API (for frontend):
- ✅ `unauthenticated_read_content` - Read page metafields
- Already configured in your store

---

## Files

- **`setup-metafields.js`** - Node.js setup script (recommended)
- **`setup-metafields.ps1`** - PowerShell wrapper for Windows
- **`setup-homepage-metafields.sh`** - Bash script for Mac/Linux
- **`README.md`** - This file

---

## Security Notes

- ✅ Admin API token is never committed to git
- ✅ Stored securely in `.env` file
- ✅ Only used for one-time setup
- ✅ Can be revoked after setup complete

---

## Support

**Documentation:**
- Main guide: `/docs/SHOPIFY_HOMEPAGE_METAFIELDS_SETUP.md`
- Changelog: `/docs/COMMIT_LOGS/shopify-metafields-integration-2026-02-04.md`

**Shopify Docs:**
- [Metafields documentation](https://shopify.dev/docs/apps/custom-data/metafields)
- [Admin API reference](https://shopify.dev/docs/api/admin-graphql)

---

**Last Updated:** 2026-02-04  
**Status:** Ready to Use

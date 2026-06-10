# Google Search Console — property setup checklist

Complete configuration for **The Street Collector** so discovery, sitemaps, and reporting work end-to-end. Pair with [`GSC_API.md`](./GSC_API.md) for local CLI exports.

## Canonical URLs (must stay aligned)

| Setting | Value |
|--------|--------|
| Intended primary host | **`https://www.thestreetcollector.com`** — matches [`middleware.ts`](../../../middleware.ts) canonical redirect behavior |
| Env | Set **`NEXT_PUBLIC_SITE_URL=https://www.thestreetcollector.com`** on Vercel so [`lib/seo/site-url.ts`](../../../lib/seo/site-url.ts), **robots `Host:`**, and **sitemap URLs** stay consistent (avoid mixing `app.` and `www` in the same robots file). |
| Sitemap path | **`/sitemap.xml`** — Next.js [`app/sitemap.ts`](../../../app/sitemap.ts) |
| Robots | **`/robots.txt`** — [`app/robots.ts`](../../../app/robots.ts) |

**Verify production:** `curl -s https://www.thestreetcollector.com/robots.txt` — the `Sitemap:` line should match the URL you submit in Search Console (prefer **www** if that is your canonical shop host).

Use **one** Search Console property type consistently with API env `GSC_SITE_URL`:

- **Domain property** (recommended): `sc-domain:thestreetcollector.com` — covers all protocols and subdomains after DNS verification.
- **URL-prefix** (optional extra): only if you need legacy tooling tied to `https://www.thestreetcollector.com/` — avoid duplicating work; pick domain **or** ensure both see the same sitemap.

## Technical prerequisites (site)

- [ ] **`/sitemap.xml`** returns HTTP 200 and valid XML (shop index + artists + products + blog where Storefront allows).
- [ ] **`/robots.txt`** allows crawling of public shop paths and lists `Sitemap: https://www.thestreetcollector.com/sitemap.xml`.
- [ ] **HTTPS** valid certificate on www (and apex redirect policy matches how you want users indexed — usually apex → www).
- [ ] **No accidental `noindex`** on money pages (check page HTML and `robots` meta on staging vs prod).

## Manual steps in Search Console UI

Complete these once per property (domain property covers both `www` and apex if verified).

1. **Ownership**
   - [ ] Domain verified via **DNS TXT** (Google site verification) at the registrar / DNS host.
   - [ ] Confirm no conflicting unverified owners.

2. **Sitemaps** (Indexing → Sitemaps)
   - [ ] Submit: `https://www.thestreetcollector.com/sitemap.xml`
   - [ ] Wait for “Success” / discovered URL counts (can take days on new or low-traffic sites).

3. **Associations** (Settings → Associations), if you use them
   - [ ] Link **Google Analytics** property (GA4) for organic alignment in reports.
   - [ ] Link **Chrome UX Report** / other Google surfaces only if applicable.

4. **International targeting** (legacy; often N/A)
   - [ ] If you use `hreflang`, validate in **URL Inspection** per template; domain property does not replace correct `link` tags in HTML.

5. **Removals** (only when needed)
   - [ ] Use **Removals** for urgent URL takedowns from Google’s index — temporary; fix the source (`noindex` or 404) for a permanent solution.

6. **User & permissions**
   - [ ] Add **Full** vs **Restricted** users for team/agency as needed.

7. **Reports to watch first**
   - [ ] **Performance**: queries, pages, countries, devices (when data appears).
   - [ ] **Indexing → Pages**: why URLs are / aren’t indexed.
   - [ ] **Experience** (Core Web Vitals / HTTPS) if shown for the property.

## Automated: submit sitemap via API (same property as CLI)

Requires `.env.local` with `GSC_*` — see [`.env.example`](../../../.env.example).

Default OAuth scope is **read-only**. Listing sitemaps works; **submit** needs the full Search Console scope:

1. In `.env.local` set `GSC_OAUTH_SCOPE=https://www.googleapis.com/auth/webmasters`
2. Run **`npm run gsc:oauth`** again (new consent), update `GSC_OAUTH_REFRESH_TOKEN`

Then:

```bash
npm run gsc:sitemaps -- list
npm run gsc:sitemaps -- submit https://www.thestreetcollector.com/sitemap.xml
```

If you prefer to keep read-only tokens, skip CLI submit and use **Indexing → Sitemaps** in the UI instead.

This registers the sitemap with the property matching `GSC_SITE_URL` (e.g. `sc-domain:thestreetcollector.com`). **Insufficient Permission** usually means (a) read-only OAuth, (b) Google account is not Owner/Full user on the property, or (c) wrong `GSC_SITE_URL`.

## Version

| Version | Date       | Notes |
|---------|------------|-------|
| 1.0.0   | 2026-04-19 | Checklist + sitemap/robots URLs; links to implementation files. |

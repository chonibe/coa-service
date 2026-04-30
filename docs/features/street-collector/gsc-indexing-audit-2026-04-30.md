# Street Collector GSC Indexing Audit Response

Source: Google Search Console indexing CSV exports supplied on 2026-04-30.

## Audit Snapshot

| Issue | Pages | Read |
| --- | ---: | --- |
| Page with redirect | 658 | Legacy and parameterized URLs are consuming crawl attention. |
| Alternate page with proper canonical tag | 141 | Duplicate canonical variants exist and should be consolidated over time. |
| Duplicate without user-selected canonical | 76 | Google sees duplicate pages without enough canonical clarity. |
| Not found (404) | 44 | Old URLs still exist in Google's crawl memory. |
| Blocked by robots.txt | 24 | Some blocked URLs are still being discovered. |
| Excluded by noindex tag | 12 | Expected for internal or non-public surfaces. |
| Crawled - currently not indexed | 345 | Google crawled many URLs but did not see enough reason to index. |
| Discovered - currently not indexed | 214 | Crawl queue is bloated relative to authority. |
| Indexed pages | 64-79 during sampled dates | The public indexable footprint is still very small. |

## Interpretation

The main problem is index hygiene. Street Collector has too many legacy, redirected, duplicated, or low-value URLs relative to its small indexed footprint. The content expansion only helps if Google sees a cleaner canonical set: product pages, artist pages, category pages, and the new editorial articles.

## Code Actions Taken

1. Canonical blog feed narrowed:
   - `content/shopify-content.ts` now exports only the new Street Collector SEO articles as the canonical `articles` feed.
   - Legacy synced Shopify articles are preserved as `legacyShopifyArticles` but no longer appear in the blog index, sitemap, or `llms-full.txt`.
   - Reason: old broad Shopify articles mention unrelated artists and can create brand-trust issues.

2. Internal app routes marked noindex:
   - `middleware.ts` now adds `X-Robots-Tag: noindex, follow` to internal/admin/auth/collector/vendor/utility route families.
   - Reason: these pages are not SEO landing pages and should not compete with public shop content.

3. Sitemap remains focused:
   - `app/sitemap.ts` already emits canonical static shop pages, SEO category pages, canonical blog articles, artist pages, and product pages.
   - Because `articles` is now SEO-only, the sitemap now stops promoting legacy unrelated articles.

4. Existing redirect/canonical work remains active:
   - app subdomain redirects include `X-Robots-Tag: noindex, follow`.
   - legacy `/products/untitled-3` redirects to `/shop/street_lamp`.
   - legacy `/collections/{artist}` redirects to `/shop/artists/{slug}`.

## Expected GSC Impact

Short term:

- More URLs may temporarily show as excluded due to redirects/noindex while Google reprocesses old crawl data.
- Indexed count may not rise immediately.

Medium term:

- Redirect and duplicate noise should decline.
- Sitemap-discovered URLs should become more representative of the pages Street Collector actually wants indexed.
- Crawl attention should shift toward artist pages, product pages, category pages, and the new blog articles.

## Post-Deploy Validation

After deploy:

1. Submit `/sitemap.xml` in GSC.
2. Request indexing for:
   - `/shop/street_lamp`
   - `/shop/explore-artists`
   - `/limited-edition-street-art-prints`
   - `/backlit-art-lamp`
   - `/shop/blog/what-is-a-limited-edition-print`
   - `/shop/blog/what-is-a-print-run-in-art`
   - `/shop/blog/loreta-isac-limited-edition-prints`
3. Recheck these GSC issue buckets weekly:
   - Page with redirect
   - Duplicate without user-selected canonical
   - Crawled - currently not indexed
   - Discovered - currently not indexed
   - Indexed, though blocked by robots.txt

## Remaining Manual Work

- Export detailed example URLs for each GSC issue bucket. The current CSVs only contain aggregate counts, not URLs.
- Review live product claims before expanding edition-size or COA statements.
- Decide whether legacy Shopify blog URLs should be redirected to new canonical guides when exact topical matches exist.

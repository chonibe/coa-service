# Street Collector SEO Growth Plan

Last updated: 2026-04-29

## Executive Summary

Street Collector is already indexable and visible for branded search. The site has a dynamic sitemap, robots.txt, canonical host helpers, product and artist metadata templates, and JSON-LD for products, artists, breadcrumbs, FAQs, and the brand. Lighthouse SEO in the stored `lighthouse-full-audit.report.json` is 100, but performance is 75 and best practices are 77, so rankings are more likely constrained by page speed, content depth, canonical clarity, and authority than by basic crawlability.

The fastest path to category leadership is to own three lanes at the same time:

1. Product category: backlit art lamp, illuminated art, interchangeable art lamp.
2. Collection category: limited edition street art prints, urban art prints, collectible art prints.
3. Trust category: certificate of authenticity for art, limited edition print value, how edition pricing works.

## Current Standing

### What Is Working

- Google has indexed the canonical www site. Search results show `https://www.thestreetcollector.com/` for branded and category-adjacent queries.
- `robots.txt` allows crawling, blocks `/api/`, and explicitly allows major AI crawlers.
- `sitemap.xml` includes the homepage, storefront pages, artist pages, and product pages.
- `middleware.ts` redirects the bare domain, app subdomain, and old `thestreetlamp.com` hosts to `www.thestreetcollector.com`.
- Product and artist templates use answer-first copy, constrained title/description builders, JSON-LD, and breadcrumb schema.
- The homepage already communicates high-value proof points: 100+ artists, 3000+ collectors, free worldwide shipping, COA, 12-month guarantee, and 30-day returns.

### Main Gaps

- Root metadata previously defaulted to "Limited Edition Certificate System", which can leak into uncached or non-store pages and weakens brand consistency.
- `/` reused `/shop/street-collector` metadata, including its canonical. That caused the homepage URL and canonical signal to disagree.
- Brand JSON-LD used `/shop/street-collector` as the organization URL instead of the homepage.
- The strongest commercial category pages are not yet fully separated into intent-specific landing pages. `/` is doing too much: product explanation, collection proof, artist discovery, trust, and conversion.
- Existing competitors in organic SERPs have sharper category pages for "urban art prints", "limited edition prints", and "backlit artwork".
- The current sitemap uses `new Date()` for every static URL on each request. This can create noisy lastmod churn; replace with content-driven dates once product/artist update timestamps are reliable.
- Lighthouse performance score in the stored audit is 75, below the SEO/GEO skill target of LCP under 2.5s, INP under 200ms, and CLS under 0.1.

## Keyword Lanes

### Tier 1: Commercial Pages

| Target | Primary intent | Page |
| --- | --- | --- |
| backlit art lamp | Buy / compare | `/` or new `/backlit-art-lamp` |
| illuminated art lamp | Buy / compare | new `/illuminated-art-lamp` |
| interchangeable art prints | Buy / understand | new `/interchangeable-art-prints` |
| limited edition street art prints | Browse / buy | `/shop/products` plus collection hub |
| urban art prints | Browse / buy | new `/urban-art-prints` |

### Tier 2: Trust And Education

| Target | Primary intent | Page |
| --- | --- | --- |
| what is a certificate of authenticity for art | Learn / trust | new guide |
| are limited edition prints worth collecting | Learn / buy confidence | new guide |
| how limited edition print pricing works | Learn / price trust | new guide |
| how to start collecting street art prints | Learn / beginner | new guide |

### Tier 3: Programmatic Long Tail

| Target | Primary intent | Page type |
| --- | --- | --- |
| `[artist] limited edition print` | Artist-specific purchase | `/shop/artists/[slug]` |
| `[artwork] by [artist] print` | Product-specific purchase | `/shop/[handle]` |
| `street art prints from [city/country]` | Discovery | future curated collection pages |

## Competitive Notes

Manual search checks on 2026-04-29 show:

- The Street Collector ranks for its brand and appears in category-adjacent SERPs.
- "limited edition street art prints online" surfaces category pages from galleries and artist stores before Street Collector in many results.
- "backlit art lamp / backlit artwork" surfaces more decor-oriented competitors such as LED artwork sites, which have clearer category vocabulary but weaker artist/collectibility positioning.
- The strategic opening is the overlap: Street Collector can own "backlit art lamp + limited edition street art prints", because most competitors are either art marketplaces or lightbox decor stores, not both.

## Roadmap

### Stage 1: Technical Foundation, 1-2 Weeks

- Align root metadata, homepage canonical, and Organization/WebSite JSON-LD.
- Add a canonical URL test for `/`, `/shop/street-collector`, one artist page, and one product page.
- Replace sitemap `lastModified: new Date()` for static pages with stable release/update dates.
- Add `ItemList` schema to `/shop/products` if not already present in rendered output.
- Add `CollectionPage` or `WebPage` schema to artist directory and product listing hubs.
- Run Lighthouse on `/`, `/shop/products`, `/shop/explore-artists`, and a product page. Prioritize LCP and video/image payload issues.

### Stage 2: Category Ownership, 2-4 Weeks

- Build dedicated category landing pages:
  - `/backlit-art-lamp`
  - `/limited-edition-street-art-prints`
  - `/urban-art-prints`
  - `/interchangeable-art-prints`
- Each page should have one clear H1, answer-first intro, product/artist modules, FAQs, internal links, and conversion CTAs.
- Cross-link category pages from homepage, footer, product pages, and artist pages.
- Create comparison copy that frames the site as neither a normal lamp store nor a generic print marketplace.

### Stage 3: Content Authority, 4-8 Weeks

- Publish 6 evergreen guides:
  - What is a Certificate of Authenticity for art?
  - Are limited edition prints worth collecting?
  - How edition sizes affect artwork value.
  - How to start collecting street art prints.
  - Street art prints vs posters: what collectors should know.
  - How to display art in small apartments.
- Add author/reviewer attribution where possible.
- Turn strong FAQs into visible content blocks, not only JSON-LD.
- Use artist pages as authority assets by adding richer biographies, exhibitions, location, style, and collection context.

### Stage 4: Programmatic Scale, 8-12 Weeks

- Generate curated pages by style, location, and use case only where content is genuinely unique.
- Add internal related links:
  - product to artist
  - artist to related artists
  - artist to collection guide
  - product to "how pricing works" guide
- Avoid publishing 100+ thin pages until each template has unique copy, products, images, FAQs, and canonical rules.

### Stage 5: Authority And Distribution, Ongoing

- Build backlinks from artist websites, Instagram link-in-bio pages, Kickstarter updates, design blogs, interior decor publications, and urban art communities.
- Create PR hooks around 100+ artists, 3000+ collectors, independent artist revenue, and the backlit physical art format.
- Use GA4 and Search Console to track impressions, CTR, average position, and conversions per keyword lane.

## Measurement Plan

Weekly:

- Search Console: impressions, clicks, CTR, average position for the three keyword lanes.
- Index coverage: submitted vs indexed sitemap URLs.
- Top pages by organic sessions and assisted conversions.
- Queries with positions 4-20, because these are the fastest wins.

Monthly:

- Lighthouse/Core Web Vitals on representative URLs.
- Internal linking audit for orphan product and artist pages.
- Content gap review against top ranking competitors.
- Conversion rate by landing page and query cluster.

## Immediate Completed Work In This Pass

- Updated app-level default metadata from certificate-system language to Street Collector brand/category language.
- Split root `/` metadata from `/shop/street-collector` so the homepage canonical is `/`.
- Updated brand JSON-LD so the Organization/WebSite URL points at the canonical homepage.
- Added AI/search crawler rules for OpenAI search, ChatGPT user actions, Anthropic, Perplexity, Google, Bing, Apple, and Common Crawl.
- Added `/llms.txt` and `/llms-full.txt` for AI-facing entity summaries and citation targets.
- Added dedicated category pages for `/backlit-art-lamp`, `/limited-edition-street-art-prints`, `/urban-art-prints`, and `/interchangeable-art-prints`.
- Added blog article URLs and category pages to the sitemap.
- Added Article JSON-LD to blog article pages and ItemList/CollectionPage JSON-LD to the product listing page.
- Added a dedicated AI search and blog content strategy in `docs/AI_SEARCH_AND_BLOG_CONTENT_STRATEGY_2026.md`.
- Published the first six SEO/GEO foundation guides and linked them from the matching category hubs.

## Next Implementation Backlog

1. Add tests or static checks for canonical metadata on core routes.
2. Build production-ready editorial workflows for the remaining blog briefs.
3. Add related-product modules to category pages.
4. Add stable dynamic `lastModified` values for product and artist URLs once source update timestamps are reliable.
5. Run fresh Lighthouse audits after deployment and compare against the stored baseline.

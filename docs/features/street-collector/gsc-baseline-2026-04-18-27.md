# Street Collector GSC Baseline

Source: Google Search Console CSV export supplied on 2026-04-29.

Observed chart range in export: 2026-04-18 to 2026-04-27.

## Executive Summary

Street Collector is nearly invisible in non-branded Google search today. The export shows 279 impressions and 6 clicks across the chart period. That is a clean baseline, not a failure: there is little existing non-branded footprint to protect, and the first gains should come from fixing URL consolidation, improving Street Lamp metadata, and building artist/category content from the current roster.

## Headline Metrics

| Metric | Value |
| --- | ---: |
| Clicks | 6 |
| Impressions | 279 |
| Overall CTR | 2.15% |
| Query rows exported | 13 |
| Page rows exported | 21 |
| Product snippet clicks | 3 |
| Product snippet impressions | 56 |
| Product snippet CTR | 5.36% |

## Query Findings

| Query | Clicks | Impressions | CTR | Position | Action |
| --- | ---: | ---: | ---: | ---: | --- |
| `street collector` | 1 | 8 | 12.5% | 1.5 | Branded query working, but volume is tiny. |
| `street lamp art` | 0 | 12 | 0% | 7.42 | Same-week metadata and URL target fix. |
| `street lamp` | 0 | 7 | 0% | 9.29 | Support with Street Lamp product/category copy. |
| `the street lamp` | 0 | 3 | 0% | 5.33 | Support with canonical Street Lamp page. |
| `loreta isac` | 0 | 1 | 0% | 23 | Proof that artist pages can surface with little optimization. |

Interpretation:

- Current search visibility is branded or product-name driven.
- There is no meaningful traction yet for collector education, city/scene, or generic category terms.
- The content strategy is additive: it is aimed at territory where Street Collector has no current search presence.

## Page Findings

| Page | Clicks | Impressions | Position | Action |
| --- | ---: | ---: | ---: | --- |
| `https://www.thestreetcollector.com/` | 6 | 225 | 11.51 | Homepage carries most visibility. Improve internal links to category/content hubs. |
| `https://thestreetcollector.com/products/untitled-3` | 0 | 17 | 6.41 | Legacy product URL ranking for lamp-adjacent query. Redirect to canonical Street Lamp product path. |
| `https://thestreetcollector.com/collections/loreta-isac` | 0 | 10 | 7.8 | Legacy collection URL has artist demand. Redirect to canonical artist profile. |
| `https://www.thestreetcollector.com/shop/faq` | 0 | 8 | 3 | FAQ has high rank potential. Expand trust/COA guide network. |
| `https://www.thestreetcollector.com/shop/experience` | 0 | 8 | 5 | Product experience is visible; should link to lamp/category explanation. |
| `https://app.thestreetcollector.com/shop/street-collector` | 0 | 7 | 13.86 | App subdomain is leaking indexation. Redirect/noindex/canonicalize. |
| `https://app.thestreetcollector.com/` | 0 | 4 | 4 | App subdomain is splitting signals. Redirect/noindex/canonicalize. |

Interpretation:

- Legacy Shopify-style URLs are still in Google's picture.
- App subdomain impressions should be consolidated into the canonical `www` domain.
- Artist collection URLs can rank. The Loreta page validates the artist SEO strategy.

## Device And Appearance Notes

| Segment | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
| Desktop | 4 | 234 | 1.71% | 13.3 |
| Mobile | 2 | 45 | 4.44% | 7.49 |
| Product snippets | 3 | 56 | 5.36% | 8.2 |

Interpretation:

- Product snippets already drive half of all clicks. Product schema and PDP metadata are worth improving early.
- Mobile performs better than desktop, but desktop has most impressions. Desktop SERP titles/descriptions need sharper intent matching.

## Country Notes

| Country | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
| Israel | 2 | 3 | 66.67% | 3 |
| United States | 1 | 72 | 1.39% | 7.99 |
| France | 1 | 9 | 11.11% | 5.56 |
| United Kingdom | 1 | 7 | 14.29% | 5.57 |
| Germany | 1 | 4 | 25% | 6 |
| Canada | 0 | 11 | 0% | 4 |

Interpretation:

- The US has the most impressions but weak CTR.
- Israel, France, UK, Germany, and Canada align with current artist clusters and should be used in country/city content planning.

## Immediate Technical Actions

1. Street Lamp metadata:
   - Target `street lamp art`, `street lamp`, and `the street lamp`.
   - Use direct title/description language around Street Lamp, backlit art lamp, illuminated art display, and swappable limited edition prints.
   - Implementation status: product metadata now detects the Street Lamp and writes intent-matched title, description, and answer-first copy.

2. Legacy product URL consolidation:
   - Redirect old `/products/untitled-3` Street Lamp URL to the canonical Street Lamp product path.
   - Preserve tracking cookies where needed, but avoid redirecting high-intent legacy product URLs only to the homepage.
   - Implementation status: legacy Street Lamp handles now redirect to `/shop/street_lamp`.

3. Legacy collection URL consolidation:
   - Redirect `/collections/{artist}` to `/shop/artists/{artist}`.
   - This is especially important for `loreta-isac`, which already shows 10 impressions at average position 7.8 as a legacy collection URL.
   - Implementation status: artist-like legacy collection handles now redirect to `/shop/artists/{slug}`; known non-artist collection handles redirect to `/shop/products`.

4. App subdomain consolidation:
   - Keep redirecting `app.thestreetcollector.com` to `www.thestreetcollector.com`.
   - Add `X-Robots-Tag: noindex, follow` on app-subdomain redirects.
   - Monitor GSC for declining app-subdomain impressions after deploy.
   - Implementation status: app-subdomain redirects now include `X-Robots-Tag: noindex, follow`.

5. Artist page SEO scale-up:
   - Use the Loreta signal as the artist template proof of concept.
   - Artist titles now target `[artist] limited edition prints`.
   - Artist descriptions and lead copy now use roster/location/product facts without forcing unrelated street-art claims.
   - Artist FAQ schema now includes a `Where can I buy [artist] prints?` question for every artist page.

## Content Priority Changes From GSC

GSC confirms this order:

1. Fix Street Lamp metadata and legacy URL consolidation.
2. Build/strengthen canonical Street Lamp and backlit art pages.
3. Build artist page authority, starting with artists that already show impressions or have strong source/product data.
4. Expand FAQ/COA trust content because FAQ already ranks well.
5. Add collector education and city/scene content because there is currently zero non-branded presence there.

## First Watchlist After Deploy

Track these weekly:

- `street lamp art`
- `street lamp`
- `the street lamp`
- `loreta isac`
- `/shop/street_lamp`
- `/backlit-art-lamp`
- `/shop/artists/loreta-isac`
- app subdomain impressions
- legacy `/products/` and `/collections/` impressions

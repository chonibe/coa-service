# Blog Inventory Audit

Updated: May 1, 2026

## Current exposed inventory
- Total exposed articles: `75`
- Local flagship guides: `4`
- Generated artist watch articles: `69`
- Roundups: `2`
- Shopify fallback articles currently exposed: `0`

## What is currently happening
- The three legacy Shopify blog posts with overlapping handles are suppressed by the local editorial layer.
- The exposed blog is mostly composed of artist-enrichment articles generated from [`content/artist-research-data.json`](/C:/Users/choni/.cursor/coa-service/content/artist-research-data.json).
- Roundups only appear when there are enough thin artist records to justify a group article.

## Existing URL decisions
- `israeli-street-artists-a-look-at-some-of-the-countrys-talents`
  - Keep handle, rewrite fully as collector-first field guide.
- `discover-the-best-tel-aviv-gifts-and-home-decor-from-modern-jewish-artists`
  - Keep handle, rewrite fully as collector note on buying Tel Aviv art for the home.
- `exploring-the-vibrant-art-scene-in-tel-aviv`
  - Keep handle, rewrite fully as city field guide.
- `how-to-collect-street-art-prints-without-buying-blind`
  - New flagship article added as the benchmark-led sample.
- `artist-guide-*`
  - Keep handles, upgrade template, taxonomy, and structured rendering.
- `roundup-street-to-studio-artists-to-watch`
  - Keep, rewrite through structured watchlist format.
- `roundup-graphic-voices-to-watch`
  - Keep, rewrite through structured watchlist format.

## Consolidation notes
- Shopify duplicates of the three legacy guide handles should remain hidden or be retired upstream if Shopify is still serving them elsewhere.
- Duplicate artist names in enrichment data are already deduped at runtime, but the raw data still contains multiple source records for some names.

## Editorial lanes now in use
- `City Field Guides`
- `Street-to-Studio Collecting`
- `Graphic Art & Print Culture`
- `Artists to Watch`
- `Collector Notes`

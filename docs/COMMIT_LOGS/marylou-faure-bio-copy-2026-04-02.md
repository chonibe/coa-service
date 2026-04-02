# Commit log: Marylou Faure bio copy + purge auto-extracted additional history

**Date:** 2026-04-02

## Checklist

- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — `marylou-faure`: rewritten `storyFullText` and `heroHook`; cleared `additionalHistoryText`; simplified `activeSince`. Script pass cleared **auto-extracted / web-research** `additionalHistoryText` rows repo-wide (**70** slugs touched on last run).
- [x] [`scripts/refine_artist_research_bios_for_shop.py`](../../scripts/refine_artist_research_bios_for_shop.py) — `strip_unusable_additional_history()`; `DROP_PARA_PREFIXES` + `INTERNAL_SENTENCE_RES` for scrape noise.
- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../../docs/features/street-collector/artist-research-sheet.csv) — Synced from JSON.

## Notes

- Merged shop bios were appending poison `additionalHistoryText` (HTML scrape + “Web research (verify)”) via [`mergeShopifyCollectionBioWithResearch`](../../lib/shop/artist-research-merge.ts).

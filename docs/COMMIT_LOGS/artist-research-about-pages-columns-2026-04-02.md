# Commit log: artist research — about pages, history columns, bio merge

**Date:** 2026-04-02

## Checklist

- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../../features/street-collector/artist-research-sheet.csv) — added **About Page URL (primary)** and **Additional History & CV (text)** after Story (all rows migrated, empty by default).
- [x] [`scripts/migrate_artist_research_csv_about_columns.py`](../../scripts/migrate_artist_research_csv_about_columns.py) — idempotent CSV migration helper.
- [x] [`scripts/csv_to_artist_research_json.py`](../../scripts/csv_to_artist_research_json.py) — maps new columns → `aboutPageUrl`, `additionalHistoryText`.
- [x] [`scripts/merge_artist_research_to_csv.py`](../../scripts/merge_artist_research_to_csv.py) — batch merge `HEADERS` / `research_row` aligned with new columns.
- [x] [`lib/shop/artist-research-merge.ts`](../../lib/shop/artist-research-merge.ts) — `mergeResearchBio` appends `additionalHistoryText` after `storyFullText` when Shopify bio is empty.
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — regenerated via `npm run research:json`.
- [x] [`docs/features/street-collector/artist-research-about-pages.md`](../../features/street-collector/artist-research-about-pages.md) — methodology: about-first research, exhibitions/press formats, column map.
- [x] [`docs/features/street-collector/artist-profile-content-spec.md`](../../features/street-collector/artist-profile-content-spec.md) — v1.3.0; links + worksheet lines for new fields.

## Notes

Researchers should fill **Exhibitions** and **Press** aggressively from About/CV/Press pages; use **Additional History** for CV facts that are not yet one-per-line exhibitions.

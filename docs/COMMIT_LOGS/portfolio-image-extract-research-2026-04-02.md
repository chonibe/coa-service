# Commit log: Portfolio / Instagram image URLs → research sheet

**Date:** 2026-04-02

## Checklist

- [x] [`scripts/extract_artist_portfolio_images.py`](../../scripts/extract_artist_portfolio_images.py) — Fetch portfolio + IG HTML; extract `og:image`, `twitter:image`, `<img>` / `data-src` / `srcset`; score URLs (CDN, artist-name match); fill **Process Image 1–4** and **Instagram Images (URLs)**; `ig_only` fetch when process already full.
- [x] [`scripts/apply_artist_enrichment_json_to_csv.py`](../../scripts/apply_artist_enrichment_json_to_csv.py) — Support `processImageUrls`, per-slot URLs/labels, `instagramPostImageUrls` (string or array).
- [x] [`package.json`](../../package.json) — `npm run research:images:extract` (bounded `--max-artists 80` + `research:json`).
- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../../docs/features/street-collector/artist-research-sheet.csv) — Populated process (and partial IG) URLs via extractor runs.
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — Regenerated from CSV.
- [x] [`docs/features/street-collector/artist-profile-content-spec.md`](../../docs/features/street-collector/artist-profile-content-spec.md) — Documented pipeline and rights caveat.

## Notes

Re-run `python3 scripts/extract_artist_portfolio_images.py --max-artists 0` (no limit) to backfill remaining rows; respect rate limits. Verify licensing on auto-picked images before production.

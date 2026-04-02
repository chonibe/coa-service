# Commit log: process images — recency, dedupe (2026-04-02)

## Summary

- **Python** (`scripts/extract_artist_portfolio_images.py`): Prefer newer path years, penalize press-aggregator hosts, unify winner selection on a canonical CDN key (strip `-WxH` / `__WxH`), dimension tie-break, Instagram fetch order preserved; **dedupe Instagram URL list** by canonical key before scoring so the same asset is not considered multiple times.
- **TypeScript** (`lib/shop/artist-research-merge.ts`): Replace full-URL lowercase keys with **`processGalleryDedupeKey`** (host + path, same size-stripping rules) for process gallery and Instagram showcase merges; **dedupe raw CSV process slots** so columns 1–4 cannot surface the same artwork twice; **dedupe `instagramShowcaseFromRaw`** lines by the same key before the 12-item cap.

## Implementation

- [x] [`scripts/extract_artist_portfolio_images.py`](../../scripts/extract_artist_portfolio_images.py) — ranking, IG pre-dedupe, merge winners
- [x] [`lib/shop/artist-research-merge.ts`](../../lib/shop/artist-research-merge.ts) — merge + `processGalleryFromRaw` dedupe

## Follow-up

- Re-run extraction with `--force` to refresh CSV cells: `python3 scripts/extract_artist_portfolio_images.py --force`
- Then regenerate research JSON if your pipeline uses it: `npm run research:json` (if defined)

## Version

- lastUpdated: 2026-04-02
- version: 1.0.0

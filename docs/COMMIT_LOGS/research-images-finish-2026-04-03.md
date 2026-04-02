# Commit log: Finish process / IG image backfill + research sync

**Date:** 2026-04-03

## Checklist

- [x] [`scripts/extract_artist_portfolio_images.py`](../../scripts/extract_artist_portfolio_images.py) — Full run (no `--max-artists` cap); Instagram `profile_pic` / `thumbnail_src` fallback when feed `display_url` missing (often still empty under login wall).
- [x] [`package.json`](../../package.json) — `research:images:extract` runs full extract + `research:json`.
- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../../docs/features/street-collector/artist-research-sheet.csv) — Backfill updates; **Notes** for five artists where automation cannot fetch URLs (IG wall / `officialjackacart.com` 403).
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — `npm run research:json` + `npm run research:refine:bios`.

## Coverage

- **79 / 84** artists have at least one **Process Image** URL after extraction passes.
- **5** remain without process images: Aviv Shamir, Refiloe Mnisi, S A R G O N, Jake Ac art, Igor Mikutski — add **verified** direct post/still URLs manually (see Notes on each row).

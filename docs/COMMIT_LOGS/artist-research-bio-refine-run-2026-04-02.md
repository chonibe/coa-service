# Commit log: Artist research bio refine run (JSON + CSV)

**Date:** 2026-04-02

## Checklist

- [x] [`scripts/refine_artist_research_bios_for_shop.py`](../../scripts/refine_artist_research_bios_for_shop.py) — Extended `INTERNAL_SENTENCE_RES` (domain-led “site says”, meta research lines) and `HERO_RESEARCH_TAIL_RES` + loop in `refine_hero` to strip press/CV tails from hooks.
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — **30** slugs updated (`storyFullText` and/or `heroHook` + notes tag when first change).
- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../../docs/features/street-collector/artist-research-sheet.csv) — Synced Hero Hook + Story columns from JSON.

## Notes

- Re-run: `python3 scripts/refine_artist_research_bios_for_shop.py` from repo root.

# Commit log: Editorial artist bios (blog-style rewrite)

**Date:** 2026-04-03

## Checklist

- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — Replaced `heroHook`, `storyFullText`, and `activeSince` (where set) for all **86** artist slugs with short magazine-style blurbs: inviting tone, third person, practice-focused; removed CV-style sourcing and internal research voice from public fields.
- [x] [`scripts/editorial_shop_bios_data.py`](../../scripts/editorial_shop_bios_data.py) — Part 1 of hand-written shop bios (47 slugs).
- [x] [`scripts/editorial_shop_bios_data_2.py`](../../scripts/editorial_shop_bios_data_2.py) — Part 2 (39 slugs).
- [x] [`scripts/merge_blog_style_artist_bios.py`](../../scripts/merge_blog_style_artist_bios.py) — Merge script (loads both parts into research JSON).
- [x] [`scripts/refine_artist_research_bios_for_shop.py`](../../scripts/refine_artist_research_bios_for_shop.py) — Cleared `STORY_OVERRIDES` / `HERO_OVERRIDES` so merged JSON stays canonical; refine pass still sanitizes `activeSince` and syncs [`docs/features/street-collector/artist-research-sheet.csv`](../../docs/features/street-collector/artist-research-sheet.csv).

## Notes

- Press, exhibitions, and citations remain in `pressText` / `exhibitionsText` / metafields—not in the overview bio body.
- Future bio edits: change `editorial_shop_bios_data*.py`, run `merge_blog_style_artist_bios.py`, then `refine_artist_research_bios_for_shop.py`.

# Commit log: Artist bios — rewritten MD applied to shop data

**Date:** 2026-04-03

## Checklist

- [x] [`docs/features/street-collector/artist-bios-rewritten.md`](../features/street-collector/artist-bios-rewritten.md) — Source copy: editorial bios for all shop artists (sections `**Name** — place` + body).
- [x] [`scripts/apply_artist_bios_rewritten_md.py`](../../scripts/apply_artist_bios_rewritten_md.py) — Parses MD, sets `heroHook` + `storyFullText` in JSON, regenerates editorial modules, syncs CSV. Slug overrides: `emelio-cerezo`, `jake-ac-art`, `twoone-hiroyasu-tsuri`, `sancho`.
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — All **86** slugs updated; notes tag references MD + script.
- [x] [`scripts/editorial_shop_bios_data.py`](../../scripts/editorial_shop_bios_data.py) / [`scripts/editorial_shop_bios_data_2.py`](../../scripts/editorial_shop_bios_data_2.py) — Regenerated so `merge_blog_style_artist_bios.py` stays aligned.
- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../features/street-collector/artist-research-sheet.csv) — Hero / Story / Notes synced from JSON.

## Re-run after editing the MD

```bash
python3 scripts/apply_artist_bios_rewritten_md.py
```

## Notes

- Shop UI reads merged research via [`lib/shop/artist-research-merge.ts`](../../lib/shop/artist-research-merge.ts).

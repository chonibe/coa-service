# Commit log: artist research web enrichment batch 6 (2026-04-02)

## Checklist

- [x] [docs/dev/artist-web-enrichment-2026-04-02-batch6.json](../dev/artist-web-enrichment-2026-04-02-batch6.json) — Web-sourced About URL, Additional History, Exhibitions, Press for Geometric Bang, Laura Fridman, Keya Tama, Iain Macarthur, Thibaud Herem, Frederique Mati (verify notes inline).
- [x] [package.json](../../package.json) — `research:enrich:apply-web` includes batch6 apply step.
- [x] [docs/features/street-collector/artist-research-sheet.csv](../features/street-collector/artist-research-sheet.csv) — Merged via apply script (regenerate `content/artist-research-data.json` with `npm run research:json`).

## Post-apply counts (approx.)

- Exhibitions column empty: ~44 rows (down from ~50).
- Press column empty: ~16 rows.
- About URL empty: 0.

## Notes

- Prefer official bios and CV PDFs over snippets; several lines marked “verify.”
- Iain Macarthur / Sancho rows may still need cleanup if prior paste noise appears in story cells.

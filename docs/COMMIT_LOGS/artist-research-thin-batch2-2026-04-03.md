# Commit log: Artist research thin batch 2 (2026-04-03)

## Summary

Second thin-first enrichment pass for **12 artists** (after batch 1): added **Exhibitions** and/or **Press** from primary sites and indexed articles; **Chubby Nida** and **Ollie Smither** avoided duplicate press lines already present; **NASCA Uno** STRAAT URL flagged in **Additional History** (404 on automated fetch—verify on museum site).

## Checklist

- [x] [`docs/dev/artist-web-enrichment-2026-04-03-batch2-thin.json`](../dev/artist-web-enrichment-2026-04-03-batch2-thin.json) — Batch 2 patches.
- [x] [`docs/dev/artist-research-metrics-2026-04-03-batch2.json`](../dev/artist-research-metrics-2026-04-03-batch2.json) — Batch roster + metrics stub.
- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../features/street-collector/artist-research-sheet.csv) — Merged via `apply_artist_enrichment_json_to_csv.py`.
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — Regenerated (`npm run research:json`).

## Artists in batch 2

Wotto, Yippie Hey, saturn_png, Chubby Nida, Crackthetoy, Frederique Mati, Kaka Chazz, Lobster Robin, Mathew Gagnon, Max Diamond, NASCA Uno, Ollie Smither.

## Deployment

- **Production:** `vercel --prod --yes` completed; alias **https://app.thestreetcollector.com** (deployment `street-collector-c5qtkt764-chonibes-projects.vercel.app`).

# Commit log: Artist research thin batch 1 (2026-04-03)

## Summary

Thin-first web enrichment pass for the 12 sparsest rows in [`docs/features/street-collector/artist-research-sheet.csv`](../features/street-collector/artist-research-sheet.csv): filled **Exhibitions**, **Press**, and **Additional History** where verifiable; set **Igor Mikutski** primary About to `igormikutski.com` and **process images** from site; **cleared Refiloe Mnisi Press** after verifying VISI roundup does not list `@urfavsweatpants`.

## Checklist

- [x] [`docs/dev/artist-web-enrichment-2026-04-03-batch1-thin.json`](../dev/artist-web-enrichment-2026-04-03-batch1-thin.json) — Batch 1 patches (keyed by Artist Name).
- [x] [`docs/dev/artist-research-metrics-2026-04-03-batch1.json`](../dev/artist-research-metrics-2026-04-03-batch1.json) — Thin scores + quantitative batch notes.
- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../features/street-collector/artist-research-sheet.csv) — Merged via `apply_artist_enrichment_json_to_csv.py`; Igor About + Refiloe Press correction; Thomas Stary Behance handle typo fix (`5tar.t`).
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — Regenerated (`npm run research:json`).

## Artists in batch 1

Jake Ac art, Aviv Shamir, Igor Mikutski, Jennypo Art, Refiloe Mnisi, S A R G O N, Levi Jacobs, Odsk, Rik Lee, Thomas Stary, Woizo, Vivaladybug.

## Follow-ups

- Remaining ~72 artists: continue thin-first batch 2+ using the same JSON + apply workflow.
- [`scripts/extract_artist_portfolio_images.py`](../../scripts/extract_artist_portfolio_images.py) returned **0 updates** for this batch (IG/login limits); rely on site CDNs or manual permalinks where needed.

## Deployment

- **Production:** `vercel --prod --yes` completed; alias **https://app.thestreetcollector.com** (deployment `street-collector-ea82ionzy-chonibes-projects.vercel.app`).
- **Note:** First CLI run hit `EPIPE` mid-build; redeploy succeeded on retry.

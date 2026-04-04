# Commit log: Artist research thin batch 5 (final sweep, 2026-04-03)

## Summary

**Final thin-first pass** for the **36 artists** not covered by batches 1–4 (April 2026). Adds exhibitions and/or press where sparse, replaces placeholder **Exhibitions** notes for **Cubi Boumclap**, **Thales Towers**, and **kymo_one**, and clears **Moshe Gilboa** exhibition placeholder (game/illustration practice is press-first). Splits payloads across two merge files for traceability: [`batch5-final-thin.json`](../dev/artist-web-enrichment-2026-04-03-batch5-final-thin.json) (34 artists) and [`batch5b-final-thin.json`](../dev/artist-web-enrichment-2026-04-03-batch5b-final-thin.json) (additional history for **Emelio Cerezo**, **Keya Tama**).

## Checklist

- [x] [`docs/dev/artist-web-enrichment-2026-04-03-batch5-final-thin.json`](../dev/artist-web-enrichment-2026-04-03-batch5-final-thin.json)
- [x] [`docs/dev/artist-web-enrichment-2026-04-03-batch5b-final-thin.json`](../dev/artist-web-enrichment-2026-04-03-batch5b-final-thin.json)
- [x] [`docs/dev/artist-research-metrics-2026-04-03-batch5-final.json`](../dev/artist-research-metrics-2026-04-03-batch5-final.json)
- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../features/street-collector/artist-research-sheet.csv)
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json)

## Caveats

- **Psoman** Liège 2026 show URL is French **visitezliege.be** listing; confirm hours/artists before event copy.
- **Thales Towers** 2018 Kikar Atrim line is from **Dror Hadadi**; corroborate organizer naming if required for legal/comms.
- **Sancho** Saatchi line points at a **representative work** URL, not the full artist shop index.

## Deployment

- **Production:** `vercel --prod --yes` after push to `main`; confirm **https://app.thestreetcollector.com**.

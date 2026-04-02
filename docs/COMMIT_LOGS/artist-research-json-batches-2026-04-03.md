# Commit log: artist research JSON batches (2026-04-03)

## Commit

- Hash: `145e21528` (local main)
- Message: `docs(dev): add UTF-8 artist research JSON batches (04-21, 22-37, 53-68, 69-84)`

## Checklist

- [x] [docs/dev/artist-research-04-21-rich.json](../dev/artist-research-04-21-rich.json) — 18 artists (Marc David Spengler → Psoman); UTF-8 JSON, indent 2; `python3 -c "import json; json.load(open('...'))"` OK
- [x] [docs/dev/artist-research-22-37.json](../dev/artist-research-22-37.json) — 16 artists (Agus Rucula → Laura Fridman); validation OK
- [x] [docs/dev/artist-research-53-68.json](../dev/artist-research-53-68.json) — 16 artists (saturn_png → Ollie Smither); validation OK
- [x] [docs/dev/artist-research-69-84.json](../dev/artist-research-69-84.json) — 16 artists (NASCA Uno → Igor Mikutski); Facio anchored to Tomás Facio / `@tomas_facio`; Jennypo anchored to jennypoart.com + `@jennypoart`
- [x] [scripts/_generate_artist_research_batches.py](../../scripts/_generate_artist_research_batches.py) — regenerates all four files; enforces heroHook 120–180 chars
- [x] [scripts/artist_research_batches_234.py](../../scripts/artist_research_batches_234.py) — data for batches 22-37, 53-68, 69-84

## Notes

- `exclusiveCallout` left empty (no verified Street Collector exclusives cited from sources).
- `instagramPostImageUrls` only populated where `instagram.com/p/...` permalinks were taken from search results; most artists left blank for rights review.

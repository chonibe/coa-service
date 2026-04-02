# Commit log — Artist research sheet full merge (2026-04-03)

## Checklist

- [x] [docs/features/street-collector/artist-research-sheet.csv](../features/street-collector/artist-research-sheet.csv) — Rebuilt from JSON research batches; 81 artists filled (Status: Research pass — review). First three rows (Jerome Masi, Moritz Adam Schmitt, Loreta Isac) preserved from the 2026-04-02 manual draft.
- [x] [docs/dev/artist-research-04-21-rich.json](../dev/artist-research-04-21-rich.json) — Web-research batch (artists 4–21).
- [x] [docs/dev/artist-research-22-37.json](../dev/artist-research-22-37.json) — Batch 22–37.
- [x] [docs/dev/artist-research-38-52.json](../dev/artist-research-38-52.json) — Batch 38–52.
- [x] [docs/dev/artist-research-53-68.json](../dev/artist-research-53-68.json) — Batch 53–68.
- [x] [docs/dev/artist-research-69-84.json](../dev/artist-research-69-84.json) — Batch 69–84.
- [x] [scripts/merge_artist_research_to_csv.py](../../scripts/merge_artist_research_to_csv.py) — Merge driver (loads batches in order, writes CSV).
- [x] [scripts/_generate_artist_research_batches.py](../../scripts/_generate_artist_research_batches.py) — Regenerator for JSON batches (optional).
- [x] [scripts/artist_research_batches_234.py](../../scripts/artist_research_batches_234.py) — Payload module for generator.

## Regenerate CSV

From repo root:

```bash
python3 scripts/merge_artist_research_to_csv.py
```

## Honest gaps

Some fields stay empty where sources did not provide verifiable text (e.g. pull quotes, some process `instagram.com/p/...` URLs, thin bios for a few handles). See per-artist `Notes` in the CSV and batch JSON. `exclusiveCallout` is blank unless a primary Street Collector exclusive is confirmed.

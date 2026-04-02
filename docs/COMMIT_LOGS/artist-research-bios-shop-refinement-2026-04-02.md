# Commit log: Artist research bios (shop-ready)

**Date:** 2026-04-02

## Checklist

- [x] [`scripts/refine_artist_research_bios_for_shop.py`](../../scripts/refine_artist_research_bios_for_shop.py) — Refines `storyFullText` / `heroHook`: strips internal research sentences, Street Lamp closers, slug overrides; syncs CSV.
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — Public-facing bios updated for shop (86 slugs).
- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../features/street-collector/artist-research-sheet.csv) — Hero, Story, Notes synced from JSON.

## Summary

Second pass on **bios themselves** (`storyFullText`): removed ops language (verify/re-check/treat as self-reported, etc.), fixed `Inc.` sentence-split artifact for Maalavidaa via override, restored Psoman Taiwan paragraph without internal phrasing, new overrides for Igal, Beto, Max Diamond, plus sentence-level filters for remaining artists.

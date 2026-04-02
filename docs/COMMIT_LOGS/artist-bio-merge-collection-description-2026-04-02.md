# Commit log: Artist bio — merge Shopify collection description with research

**Date:** 2026-04-02

## Checklist

- [x] [`lib/shop/artist-research-merge.ts`](../../lib/shop/artist-research-merge.ts) — `mergeShopifyCollectionBioWithResearch`: merges collection `description` with `storyFullText` (+ optional `additionalHistoryText`); dedupes when redundant; stacks collection then research when both add value; normalized duplicate prefers plain research over HTML collection.
- [x] [`lib/shop/artist-research-merge.test.ts`](../../lib/shop/artist-research-merge.test.ts) — Jest coverage for merge cases.
- [x] [`docs/features/street-collector/artist-profile-copywriting-playbook.md`](../../docs/features/street-collector/artist-profile-copywriting-playbook.md) — §3.2 + agent checklist + testing note; version **1.4.1**.
- [x] [`scripts/refine_artist_research_bios_for_shop.py`](../../scripts/refine_artist_research_bios_for_shop.py) — Docstring: editors should use collection description as a source; script does not call Shopify.

## Notes

- `mergeResearchBio(slug, …)` now always routes through `mergeShopifyCollectionBioWithResearch`, so artist list cards and profile API get the combined bio when both sources exist.

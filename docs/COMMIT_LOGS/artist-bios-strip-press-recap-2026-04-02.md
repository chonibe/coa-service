# Commit log: Artist bios — strip press recap paragraphs + dedupe

**Date:** 2026-04-02

## Checklist

- [x] [`scripts/refine_artist_research_bios_for_shop.py`](../../scripts/refine_artist_research_bios_for_shop.py) — Drop paragraphs starting with “Recent recognition includes discussion in…” and “Recent projects on the calendar span…” (playbook §2.2). Added `dedupe_consecutive_paragraphs` before drop. Snippet fixes: Loreta Isac “Apple-sized clients” → “Commercial commissions”; Moritz “Research stacks” → “Sketches stack”.
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — **68** slugs updated on press-recap strip + dedupe; **1** follow-up (Moritz Adam Schmitt “Sketches stack” wording). Stories end on practice, not outlet lists; removed repeated template lines (e.g. Marc David Spengler).
- [x] [`docs/features/street-collector/artist-research-sheet.csv`](../../docs/features/street-collector/artist-research-sheet.csv) — Synced from JSON.
- [x] [`lib/shop/artist-research-merge.test.ts`](../../lib/shop/artist-research-merge.test.ts) — `npx jest lib/shop/artist-research-merge.test.ts` passed after changes.

## Notes

- Re-run: `python3 scripts/refine_artist_research_bios_for_shop.py` from repo root. Credits stay in `pressText` / `exhibitionsText`; overview bios no longer read like a bibliography.

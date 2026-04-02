# Commit log: Artist bios — story + artist quotes, not CV/magazine citations

**Date:** 2026-04-02

## Checklist

- [x] [`docs/features/street-collector/artist-profile-copywriting-playbook.md`](../../docs/features/street-collector/artist-profile-copywriting-playbook.md) — §2.2 tightened; new **§2.3** (overview job); §3.2 intent line; §5 research vs public copy; §6 examples; §7 agent checklist; version **1.5.0**.
- [x] [`docs/features/street-collector/artist-profile-content-creator-brief.md`](../../docs/features/street-collector/artist-profile-content-creator-brief.md) — Sources + long-form story table; version **1.2.0**.
- [x] [`docs/features/street-collector/artist-profile-content-spec.md`](../../docs/features/street-collector/artist-profile-content-spec.md) — §B core bio row + changelog; version **1.5.0**.
- [x] [`scripts/refine_artist_research_bios_for_shop.py`](../../scripts/refine_artist_research_bios_for_shop.py) — Docstring + `INTERNAL_SENTENCE_RES` patterns for portfolio/CV/interview-meta ledes.

## Notes

- Re-run the refine script when regenerating JSON/CSV if you want new regex drops applied to existing `storyFullText` rows.

---
title: "Artist Research Data — Street Collector roster"
type: source
tags: [artists, street-collector, research, bios]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Artist Research Data — Street Collector roster

Structured research dataset covering 84 featured artists on The Street Collector platform.

## Metadata

- **File**: `content/artist-research-data.json`
- **Supporting doc**: `docs/features/street-collector/all-artist-bios.md`
- **CSV source**: `docs/features/street-collector/artist-research-sheet.csv`
- **Generated / enriched**: 2026-04-02 through 2026-04-21 (multiple enrichment passes)
- **Artist count**: 84 unique artists (2 duplicate slugs deduplicated)

## Summary

This dataset is the canonical research record for every artist featured on The Street Collector shop. It was assembled through a multi-pass pipeline: an initial seed list from `content/street-collector.ts` was enriched via Shopify + Supabase lookups, then further enriched through web research (DuckDuckGo and direct URL fetching), Instagram discovery, and LLM-assisted bio rewriting.

Each record contains: artist name, location, active-since date, a hero hook (one-line intro for shop display), a full narrative story bio, portfolio URL, Instagram handle, exhibitions list, press mentions with URLs, pull quotes, and process image URLs.

The bios went through multiple stylistic refinement passes — the final "story not bibliography" pass (April 2026) strips press-recap language in favour of narrative voice that reads like editorial, not a CV.

## Key Takeaways

- 84 artists across ~25 countries, with heavy concentration in Israel (Tel Aviv, Haifa), France, UK, Germany, and Netherlands
- Every artist has a narrative bio ("storyFullText") and a hero hook designed for shop/profile display
- Most records include exhibitions history and press links with source URLs
- Pull quotes exist for roughly half the artists, sourced from primary interviews
- Instagram handles are documented for all artists; post image URLs were not auto-filled and require manual verification
- Some location fields contain inline caveats ("verify before publishing") — treat as research notes, not confirmed facts
- The `notes` field on each record documents which enrichment passes were applied and what needs manual verification

## New Information

- Full biographical narratives for 84 artists not previously in the wiki
- Exhibition histories spanning 2011–2024 for major artists
- Press archive links (Creative Boom, Adobe Blog, WePresent, etc.) per artist
- Pull quotes in original language with attribution
- Representation details (agents, galleries) where known

## Contradictions

None identified at time of ingest. Some records contain inline `[CONFLICT]`-style notes within the `notes` field (e.g. Instagram handle discrepancies, unverified exhibition dates) — these are flagged in the source data.

## Entities Mentioned

All 84 artist entity pages were created from this source. See [[street-collector-artists]] for the full roster index.

## Concepts Touched

- [[the-street-collector]] — platform whose artist roster this documents
- [[certificate-of-authenticity]] — the product context for these artists' work on the platform

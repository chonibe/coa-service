# Commit log: Bulk LLM bio rewrite script + history sanitization

**Date:** 2026-04-02

## Checklist

- [x] [`scripts/rewrite_artist_bios_anthropic.py`](../../scripts/rewrite_artist_bios_anthropic.py) — Batch rewrite `heroHook` + `storyFullText` via **Anthropic** (if `ANTHROPIC_API_KEY`) or **Groq** (`GROQ_API_KEY` from `.env.local`); loads `.env.local` and `~/.config/coa-service/skill-evolution.env`.
- [x] [`scripts/refine_artist_research_bios_for_shop.py`](../../scripts/refine_artist_research_bios_for_shop.py) — `--sanitize-history-only` to clear bad `additionalHistoryText` without re-running story/hero refiners.
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) + [`artist-research-sheet.csv`](../../docs/features/street-collector/artist-research-sheet.csv) — Ran `--sanitize-history-only` (**71** rows cleaned).

## Run bulk rewrite (local machine)

Cloud CI / some sandboxes get **HTTP 403 (Cloudflare 1010)** from Groq; run on a normal laptop:

```bash
cd /path/to/coa-service-main
python3 scripts/rewrite_artist_bios_anthropic.py
# optional: ANTHROPIC_API_KEY for Anthropic (preferred quality) or rely on GROQ_API_KEY in .env.local
```

Then:

```bash
python3 scripts/refine_artist_research_bios_for_shop.py --sanitize-history-only
```

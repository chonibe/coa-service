# Commit log: sanitize press + bio highlights (2026-04-03)

## Checklist

- [x] [`scripts/sanitize_press_and_enrich_bios.py`](../../scripts/sanitize_press_and_enrich_bios.py) — Semicolon `pressText` lines: derive outlet names before quoted titles; strip duplicate impact paragraphs; strip trailing paragraphs that equal `impactCallout`; skip lone `impact` highlights when wording already appears in bio body; join highlights without `..` doubles.
- [x] [`content/artist-research-data.json`](../../content/artist-research-data.json) — Re-run script; fix Eden Kalif `pullQuote` / `impactCallout`; Tiffany Chin `pullQuote` attribution (`— TWKCHIN` only).
- [x] [`lib/shop/parse-pull-quote.ts`](../../lib/shop/parse-pull-quote.ts) — Trailing attribution split requires spaces around em/en dash so in-sentence dashes (e.g. `occupation—traveling`) are not treated as attribution.

## Notes

- `npx tsc --noEmit` may still report existing `.next/types` route param issues unrelated to these edits.
- `sourcesLinks` is still unsanitized for third-party shops; filter there if those URLs surface in the UI.

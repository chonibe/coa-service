# Commit context: Spline minimal canvas nudge down (2026-04-06)

**Commit:** `5fb734d23` — `fix(ui): nudge Spline minimal canvas down (translateY -6% to -3%)`

## Checklist

- [x] [spline-3d-preview.tsx](../../app/template-preview/components/spline-3d-preview.tsx) — Minimal mode WebGL canvas `translateY(-6%)` → `translateY(-3%)` (still composed with quarter-turn `rotate`).
- [x] [docs/features/experience/README.md](../../docs/features/experience/README.md) — Documented new `-3%` framing and history (`-10%` / `-6%`).
- [x] [docs/features/experience-v2/README.md](../../docs/features/experience-v2/README.md) — Shared minimal framing line updated to `-3%`.

## Notes

Moves the lamp **down** slightly in the experience / configurator minimal preview versus the March 2026 `-6%` setting ([spline-minimal-translatey-6pct-2026-03-28.md](./spline-minimal-translatey-6pct-2026-03-28.md)).

**Deploy (2026-04-06):** `vercel --prod --yes` uploads succeeded but the CLI repeatedly failed while polling `api.vercel.com` (`read ETIMEDOUT`, then `read EADDRNOTAVAIL`). Check [Vercel dashboard](https://vercel.com/chonibes-projects/street-collector) for whether `dpl_Bu3jZNVy6EYz1KPSu4Sduc9cfG7p` / latest deployment reached **Ready**; re-run `vercel --prod --yes` locally when the network is stable if needed.

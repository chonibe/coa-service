# Street Collector — niche GTM & SEO battle plan

## Purpose

Operational summary for owning the **artist prints + illuminated display + collectibles (COA)** wedge. Full narrative, checklists, competitive templates, and wikilinks live in the **Obsidian wiki** — this doc is for readers who browse `docs/features` only.

## Canonical sources

| Asset | Location |
|-------|-----------|
| **Wiki (primary)** | [`wiki/concepts/gtm-battle-plan.md`](../../../wiki/concepts/gtm-battle-plan.md) |
| **Positioning one-pager** | [`wiki/concepts/positioning-wedge.md`](../../../wiki/concepts/positioning-wedge.md) |
| **Tier rubric** | [`wiki/syntheses/tier-artist-priority-rubric.md`](../../../wiki/syntheses/tier-artist-priority-rubric.md) |
| **Competitive templates** | [`wiki/syntheses/competitive-intelligence-templates.md`](../../../wiki/syntheses/competitive-intelligence-templates.md) |
| **GSC runbook** | [`wiki/sources/seo-gsc-baseline-runbook.md`](../../../wiki/sources/seo-gsc-baseline-runbook.md) (includes optional API: `npm run gsc:oauth`, `npm run gsc:report`) |
| **GSC fill-in template** | [`wiki/sources/gsc-baseline-fill-in-template.md`](../../../wiki/sources/gsc-baseline-fill-in-template.md) |
| **Hero-drop playbook** | [`wiki/sources/hero-drop-playbook.md`](../../../wiki/sources/hero-drop-playbook.md) |
| **Pillar articles (Shopify HTML)** | [`pillar-articles-shopify-draft.md`](pillar-articles-shopify-draft.md) |
| **Technical SEO** | [`SEO-shop.md`](SEO-shop.md) |

## Snapshot (strategy)

1. **Wedge:** Limited-edition prints + premium illuminated display + COA — one story everywhere (site, PR, artists).
2. **Measure:** Google Search Console for rankings/queries; GA4 organic landings + PostHog paths for behavior.
3. **Iterate:** Monthly GSC review → title/body experiments on Tier A URLs (`/shop/artists/{slug}`, PDPs).
4. **Competitive:** Quarterly SERP snapshots + competitor matrix — use wiki templates.

## Analytics note

Artist profile quick-add ecommerce events use **`item_list_name: 'artist_profile'`** — see [`EVENTS_MAP.md`](../analytics/EVENTS_MAP.md).

## Related

- [`SEO-shop.md`](SEO-shop.md) — implementation map, Rich Results, sitemap.

## Change log

| Version | Date | Notes |
|---------|------|-------|
| 1.1.1 | 2026-04-19 | GSC API: `gsc:oauth` / `gsc:report` scripts; runbook section. |
| 1.1.0 | 2026-04-19 | GSC fill-in template, hero-drop playbook (wiki); four pillar article HTML drafts for Shopify. |
| 1.0.0 | 2026-04-19 | Initial doc — mirrors wiki battle plan stack. |

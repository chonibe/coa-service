---
title: "GTM & SEO battle plan"
type: concept
tags: [gtm, seo, analytics, competitive-intelligence]
created: 2026-04-19
updated: 2026-04-19
sources: []
---

# GTM & SEO battle plan

Canonical **strategy note** for the prints + lighting + collectibles wedge. Keeps parity with `.cursor/plans/niche_dominance_battle_plan_*.plan.md` — update both when strategy shifts.

## Wikilinks

- [[the-street-collector]] — platform story
- [[positioning-wedge]] — messaging single source
- [[analytics-tracking]] — GA4, PostHog, Meta CAPI
- [[certificate-of-authenticity]] — trust / proof
- [[affiliate-program]] — artist-led distribution
- [[experience-page]] — configurator entry
- Syntheses: [[2026-04-14-street-collector-artists]], [[2026-04-14-platform-architecture-overview]]
- Competitive templates: [[competitive-intelligence-templates]]
- Tier rubric: [[tier-artist-priority-rubric]]

## 90-day cadence (checklist)

### Days 1–30 — Baseline

- [ ] Lock copy with [[positioning-wedge]]
- [ ] Google Search Console: export top pages/queries for `/shop/artists/` and PDPs — see [[seo-gsc-baseline-runbook]]
- [ ] Fill [[competitive-intelligence-templates]] (competitor tiers + first SERP snapshot)
- [ ] Build Tier A/B using [[tier-artist-priority-rubric]] + GSC
- [ ] Align analytics: `item_list_name` **`artist_profile`** on artist profile quick-add — see repo `docs/features/analytics/EVENTS_MAP.md`

### Days 31–60 — Surge

- [ ] **Hero drops (3–5):** coordinated social + email + `?ref=` / UTMs + canonical `/shop/artists/{slug}`
- [ ] **Pillar guides (2–4):** editions, COA, illuminated collection — internal links to shop hubs

### Days 61–90 — Compound

- [ ] Repeat winners; stop losers
- [ ] Quarterly competitive refresh — [[competitive-intelligence-templates]]

## Operational todos (marketing)

These require humans + tools outside the repo:

| Task | Owner | Evidence |
|------|--------|------------|
| GSC baseline export | Marketing | Spreadsheet + date |
| Hero drops | Marketing + artists | Calendar + links |
| Pillar articles | Content | Published URLs |
| SERP snapshots | SEO | Dated rows in templates |

## Repo pointers (implementation)

- Shop SEO stack: `docs/features/street-collector/SEO-shop.md`
- Artist metadata: `lib/seo/artist-meta.ts`
- Optional mirror for non-Obsidian readers: `docs/features/street-collector/NICHE_BATTLE_PLAN.md`

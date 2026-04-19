---
title: "SEO baseline runbook (Search Console)"
type: source
tags: [seo, gsc, ops]
created: 2026-04-19
updated: 2026-04-19
sources: []
---

# SEO baseline runbook (Google Search Console)

Manual steps — run **monthly** for Tier A URLs; **full export** quarterly.

## 1) Performance → Pages

1. Property: production domain (`www.thestreetcollector.com` or configured property).
2. Date range: last **3 months** (or 16 months for trends).
3. Filter **Page** contains: `/shop/artists/`
4. Export (or screenshot) **top 30–50 URLs** by clicks; note impressions for **low CTR** candidates.

## 2) Performance → Queries

1. Same date range.
2. Optional filter: **Query** contains `print`, `edition`, `street`, `collector`, or artist names.
3. Export top queries driving impressions to `/shop/artists/` and PDP paths `/shop/[handle]`.

## 3) Tier A/B list

Merge with [[tier-artist-priority-rubric]]:

- **Tier A:** High impressions / revenue potential / hero campaigns — match slug to `wiki/entities/<slug>.md`.
- **Tier B:** Maintain template quality; revisit quarterly.

## 4) GA4 / PostHog (organic behavior)

- **GA4:** Explore — landing page + session medium `organic` — paths `/shop/artists/` and `/shop/*` PDPs.
- **PostHog:** `$pageview` where path contains `/shop/artists/`; funnels using `view_item` / `add_to_cart` with `item_list_name` (artist profile uses **`artist_profile`** in code).

## Related

- [[analytics-tracking]]
- [[gtm-battle-plan]]
- [[competitive-intelligence-templates]]

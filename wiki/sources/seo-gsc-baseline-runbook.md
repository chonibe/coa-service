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

## Optional — Search Console API (repo scripts)

Requires Google Cloud project with **Search Console API** enabled and OAuth client secrets **not** committed to git.

1. Set `GSC_OAUTH_CLIENT_SECRETS_PATH` to your downloaded `client_secret_….json` (absolute path).
2. In Google Cloud → Credentials → your OAuth Web client → **Authorized redirect URIs**, add: `http://127.0.0.1:3333/oauth2callback`
3. Run `npm run gsc:oauth`, complete the browser consent, then add `GSC_OAUTH_REFRESH_TOKEN` and `GSC_SITE_URL` to `.env.local`.
4. `npm run gsc:report` — JSON with queries and **position**; `npm run gsc:report -- --sites` lists verified properties.

**Troubleshooting:** If the browser shows **ERR_CONNECTION_REFUSED** on `127.0.0.1`, the CLI server was closed before Google redirected — run `npm run gsc:oauth` again and **leave the terminal open**. Or paste the redirect URL from the address bar (contains `?code=`):  
`npm run gsc:oauth -- --url='FULL_URL'`  
See `scripts/gsc-oauth-token.mjs` header comments.

Scripts: `scripts/gsc-oauth-token.mjs`, `scripts/gsc-search-analytics.mjs`.

## Related

- [[gsc-baseline-fill-in-template]] — paste exports into tables
- [[analytics-tracking]]
- [[gtm-battle-plan]]
- [[competitive-intelligence-templates]]

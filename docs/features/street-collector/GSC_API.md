# Google Search Console API (local CLI)

Programmatic access to Search Console using OAuth (same verified property as the UI). **Does not change rankings** — use for measurement, prioritization, and hygiene.

**Property setup (sitemap, verification, UI checklist):** [`GSC_PROPERTY_SETUP.md`](./GSC_PROPERTY_SETUP.md).

## Implementation files

| File | Purpose |
|------|---------|
| [`scripts/gsc-lib.mjs`](../../../scripts/gsc-lib.mjs) | Shared auth + CSV helpers |
| [`scripts/gsc-oauth-token.mjs`](../../../scripts/gsc-oauth-token.mjs) | One-time OAuth refresh token |
| [`scripts/gsc-search-analytics.mjs`](../../../scripts/gsc-search-analytics.mjs) | Performance / search analytics |
| [`scripts/gsc-sitemaps.mjs`](../../../scripts/gsc-sitemaps.mjs) | List / submit sitemaps |
| [`scripts/gsc-url-inspection.mjs`](../../../scripts/gsc-url-inspection.mjs) | Batch URL Inspection (quota) |
| [`scripts/gsc-export-all.mjs`](../../../scripts/gsc-export-all.mjs) | Multi-table CSV export |
| [`config/gsc-default-urls.txt`](../../../config/gsc-default-urls.txt) | Default URLs for inspection |

Env vars: see [`.env.example`](../../../.env.example) (`GSC_*`). Wiki runbook: [`wiki/sources/seo-gsc-baseline-runbook.md`](../../../wiki/sources/seo-gsc-baseline-runbook.md).

## Setup (once)

1. Google Cloud: enable **Search Console API**; OAuth Web client + redirect `http://127.0.0.1:3333/oauth2callback`.
2. `.env.local`: `GSC_OAUTH_CLIENT_SECRETS_PATH`, `GSC_OAUTH_REFRESH_TOKEN` (`npm run gsc:oauth`), `GSC_SITE_URL` (run `npm run gsc:report -- --sites` for the exact string — domain properties use `sc-domain:…`). Optional `GSC_OAUTH_SCOPE=https://www.googleapis.com/auth/webmasters` if you need **`gsc:sitemaps submit`** (default OAuth is read-only).

## Commands

### Sites & OAuth

```bash
npm run gsc:oauth
npm run gsc:report -- --sites
```

### Search analytics (queries, pages, country, device)

Default: last 28 days, JSON to stdout.

```bash
npm run gsc:report
npm run gsc:report -- --days 90 --limit 5000 --dimensions query
npm run gsc:report -- --dimensions page --days 28
npm run gsc:report -- --dimensions query,page --days 90
npm run gsc:report -- --dimensions country --days 28
npm run gsc:report -- --dimensions device --days 28
npm run gsc:report -- --format csv --output ./queries.csv --dimensions query --days 90
npm run gsc:report -- --start-row 25000 --dimensions page   # pagination (advanced)
```

### Sitemaps

```bash
npm run gsc:sitemaps -- list
npm run gsc:sitemaps -- submit https://www.thestreetcollector.com/sitemap.xml
```

Use the real public sitemap URL for your deployment.

### URL Inspection (batch, uses API quota)

```bash
npm run gsc:inspect
npm run gsc:inspect -- --file ./my-urls.txt
```

Default list: [`config/gsc-default-urls.txt`](../../../config/gsc-default-urls.txt). Throttle: `GSC_INSPECT_DELAY_MS` (default `1100`).

### Full CSV export pack

Writes timestamped folder under `docs/dev/gsc-exports/<timestamp>/` (gitignored): `queries.csv`, `pages.csv`, `queries-by-page.csv`, `country.csv`, `device.csv`, plus `manifest.json`.

```bash
npm run gsc:export-all
npm run gsc:export-all -- --days 90
```

## Version

| Version | Date | Notes |
|---------|------|--------|
| 1.0.0 | 2026-04-19 | Analytics CSV, sitemaps, inspection, export-all, `gsc-lib`. |

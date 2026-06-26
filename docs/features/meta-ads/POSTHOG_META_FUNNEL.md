# PostHog — Meta paid traffic funnels

Copy-paste specs for building insights in the PostHog UI. **UI-managed** — not synced from `scripts/setup-posthog-insights.js` (person-property cohorts are fragile via API on some regions).

**Related:** [Meta Ads README](./README.md), [analytics INSIGHT_TEMPLATES](../analytics/INSIGHT_TEMPLATES.md), [EVENTS_MAP](../analytics/EVENTS_MAP.md), [`lib/posthog.ts`](../../../lib/posthog.ts).

**Version:** 1.0.0  
**Last updated:** 2026-06-25

---

## Prerequisites

After deploy, confirm these person properties populate on first paid visit:

- `initial_utm_source`, `initial_utm_medium`, `initial_utm_campaign`, `initial_utm_content`, `initial_fbclid`

`begin_checkout` and `purchase` should include session `utm_*` and `fbclid` event properties.

Test URL:

```
https://www.thestreetcollector.com/experience?utm_source=facebook&utm_medium=paid&utm_campaign=test
```

---

## Dashboard: Meta Ads — Paid Social

Suggested tiles:

1. Funnel 1 (primary) — paid entry to purchase
2. Funnel 2 — retargeting health
3. Trends — client vs CAPI purchases
4. Breakdown table — purchases by `initial_utm_campaign`

---

## Funnel 1 — Paid entry to purchase (primary)

**Insight type:** Funnel  
**Order:** Strict / ordered  
**Conversion window:** 14 days

| Step | Event | Filter |
|------|-------|--------|
| 1 | `$pageview` | Person property `initial_utm_source` = `facebook` **OR** event property `utm_source` = `facebook` |
| 2 | `view_item` | Optional: `item_list_name` contains `experience` |
| 3 | `add_to_cart` | Optional: same as step 2 |
| 4 | `begin_checkout` | — |
| 5 | `purchase` | — |

**Breakdowns (run separately):**

- Person property `initial_utm_campaign`
- Person property `initial_utm_content`

**Comparison:** Last 30 days vs previous 30 days.

---

## Funnel 2 — Retargeting health

Models the winning affiliate campaign pattern (website visitors → checkout → purchase).

**Insight type:** Funnel  
**Conversion window:** 14 days

**Person filter:**

- `initial_utm_medium` = `paid`
- `last_session_entry_path` contains `/experience` (or event `session_entry_path` on step 1)

| Step | Event |
|------|-------|
| 1 | `$pageview` |
| 2 | `begin_checkout` |
| 3 | `purchase` |

---

## Trends — Meta CAPI vs client purchases

**Insight type:** Trends  
**Interval:** Day  
**Range:** Last 30 days

| Series | Event | Filter |
|--------|-------|--------|
| A | `purchase` | Event property `source` = `meta_capi` |
| B | `purchase` | No filter (all client + server) |

Use to sanity-check deduplication between Pixel/CAPI mirror and browser events.

Implementation: [`lib/meta-conversions-server.ts`](../../../lib/meta-conversions-server.ts) sets `source: meta_capi` on mirrored events.

---

## Cohort — Paid checkout abandoners (UI-managed)

**Do not** add to `setup-posthog-insights.js` sync — create in PostHog UI.

**Intent:** Users who began checkout from Facebook paid traffic in the last 7 days without purchasing. Export to Meta Custom Audience for retargeting.

Example HogQL sketch (validate schema in your project):

```sql
SELECT DISTINCT person_id
FROM events
WHERE event = 'begin_checkout'
  AND timestamp > now() - INTERVAL 7 DAY
  AND person_id IN (
    SELECT person_id FROM persons
    WHERE properties.initial_utm_source = 'facebook'
  )
  AND person_id NOT IN (
    SELECT DISTINCT person_id FROM events
    WHERE event = 'purchase'
      AND timestamp > now() - INTERVAL 7 DAY
  )
```

Name: `Cohort · Meta Paid Abandoned Checkout`

---

## Session replay filters

| Filter | Use |
|--------|-----|
| Event `$pageview` where `utm_source` = `facebook` | Watch paid landing behavior |
| Event `session_tagged` where `tag` = `checkout-error` | Payment friction |
| Event `session_tagged` where `tag` = `payment-error` | Stripe failures |

---

## Weekly Meta + PostHog join (spreadsheet)

Export from Pipeboard (`get_insights` by campaign) and PostHog (purchases breakdown by `initial_utm_campaign`) for the same date range:

| Week | Campaign (Meta) | Spend | Meta purchases | PostHog purchases (`initial_utm_campaign`) | CPA Meta | CPA PostHog |
|------|-----------------|-------|----------------|--------------------------------------------|----------|-------------|

Discrepancies often indicate pixel mismatch, attribution window, or missing UTMs on ad URLs.

---

## Version

- **lastUpdated:** 2026-06-25
- **version:** 1.0.0

# Warehouse daily Slack summary

## Overview

Automated **daily Slack message** with a warehouse operations snapshot from **ChinaDivision** (same `CHINADIVISION_API_KEY` as the rest of the app):

1. **Open orders** (not canceled, not delivered): **recipient name** (`ship_name` from API when present, else `first_name` + `last_name`), warehouse + track status, **Local** (order-info `tracking_number` / `last_mile_tracking`) vs **STONE3PL** (same fields from the `order-track-list` row when present), and **last known location** from tracking events (via STONE3PL-style parsing). Only the **newest N open orders** are listed and only those receive `order-track-list` calls (default **N = 50**) so the job finishes within the server time limit and can post to Slack.
2. **Approving** orders (`status === 0`): **computed** global SKU shortfall vs `sku-inventory-all` (line quantities summed vs reported available stock).
3. **Core SKUs**: reported quantities for **StreetLamp001** and **Streetlamp002** (case-insensitive), aligned with [`app/api/warehouse/inventory/route.ts`](../../../app/api/warehouse/inventory/route.ts).

## Technical implementation

| Area | Path |
|------|------|
| Summary builder | [`lib/warehouse/daily-slack-summary.ts`](../../../lib/warehouse/daily-slack-summary.ts) |
| Slack poster | [`lib/notifications/slack-webhook.ts`](../../../lib/notifications/slack-webhook.ts) |
| Cron route | [`app/api/cron/warehouse-daily-slack/route.ts`](../../../app/api/cron/warehouse-daily-slack/route.ts) |
| ChinaDivision client | [`lib/chinadivision/client.ts`](../../../lib/chinadivision/client.ts) |
| Tracking / location parsing | [`lib/stone3pl/client.ts`](../../../lib/stone3pl/client.ts) |
| Status constants | [`lib/notifications/tracking-link.ts`](../../../lib/notifications/tracking-link.ts) |

**Schedule:** Vercel Cron [`vercel.json`](../../../vercel.json) — `0 13 * * *` (13:00 UTC daily). Adjust as needed.

**Auth (production):** `Authorization: Bearer ${CRON_SECRET}` (same pattern as [`app/api/cron/update-exchange-rates/route.ts`](../../../app/api/cron/update-exchange-rates/route.ts)).

## API / env

| Variable | Required | Description |
|----------|----------|-------------|
| `CHINADIVISION_API_KEY` | Yes | ChinaDivision API |
| `CRON_SECRET` | Yes (prod) | Vercel cron bearer token |
| `SLACK_WEBHOOK_URL` | Yes (unless `dryRun=1`) | Slack Incoming Webhook URL |
| `WAREHOUSE_SLACK_SUMMARY_DAYS` | No | Lookback for `orders-info` (default **`90`**, max `365`) |
| `WAREHOUSE_SLACK_OPEN_ORDER_LIMIT` | No | Max open orders to show + to fetch tracking for (default `50`, max `100`) |

**Endpoint:** `GET /api/cron/warehouse-daily-slack`

- `?dryRun=1` — build summary; **does not** post to Slack (`SLACK_WEBHOOK_URL` optional). Response includes `slackPosted: false`.
- `?days=1-365` — lookback for `orders-info` for **this request** (overrides `WAREHOUSE_SLACK_SUMMARY_DAYS` when valid).
- `?openLimit=1-100` — max open orders to list + track for **this request** (overrides `WAREHOUSE_SLACK_OPEN_ORDER_LIMIT` when valid).
- **Response (every run):** `preview` is the message body (up to 4000 chars) so production matches what you see in a dry run; `previewWasTruncated` if longer. When Slack runs successfully, `slackPosted: true`.

**Vercel Cron** uses [`vercel.json`](../../../vercel.json): `/api/cron/warehouse-daily-slack?days=90&openLimit=50` so behavior matches a good local dry run even if env vars are missing on the project.

## Database

None. Live ChinaDivision APIs only.

## UI / UX

N/A (Slack message). Open-order section capped by `WAREHOUSE_SLACK_OPEN_ORDER_LIMIT` (default 50); total message length trimmed near 3500 chars.

## Testing

**Automated**

- `npm run build` — TypeScript / Next compile (passes in CI/local as of 2026-04-04).
- `npx jest tests/daily-slack-summary-tracking.test.ts` — `formatTrackingNumbersForSlack` (Local vs STONE3PL labels).

**Manual**

1. **Dry run (local or preview):** Ensure `CHINADIVISION_API_KEY` is set. `NODE_ENV=development` skips cron auth, or use `Authorization: Bearer <CRON_SECRET>` in production-like mode. Runtime is mostly `orders-info` + inventory + **≤2** `order-track-list` batches when the open cap is 50.
   ```bash
   curl -s "http://localhost:3000/api/cron/warehouse-daily-slack?dryRun=1"
   ```
2. **Slack:** Remove `dryRun`, set `SLACK_WEBHOOK_URL` to a test channel webhook, call the same URL with Bearer `CRON_SECRET` in production, or temporarily set `NODE_ENV=development` only on a safe environment.

**Automated tests:** Not required for this feature; pure helpers can be unit-tested later if desired.

## Deployment

- Add `SLACK_WEBHOOK_URL` (and optional `WAREHOUSE_SLACK_SUMMARY_DAYS`) in Vercel project env.
- Confirm `vercel.json` cron path is enabled on your Vercel plan.
- If timeouts occur, increase `maxDuration` for `app/api/cron/warehouse-daily-slack/route.ts` in `vercel.json`, reduce `WAREHOUSE_SLACK_SUMMARY_DAYS`, or lower `WAREHOUSE_SLACK_OPEN_ORDER_LIMIT`.

### Troubleshooting: no orders in section 1

- **MCP vs webhook:** Messages sent with **Cursor Slack MCP** are manual text only — they do **not** pull ChinaDivision. Order lines come from **`/api/cron/warehouse-daily-slack`** (Incoming Webhook) with `CHINADIVISION_API_KEY`.
- **Empty list but you have open orders:** They may be **outside the date window** — raise `WAREHOUSE_SLACK_SUMMARY_DAYS` (up to 365). The digest now appends a **short diagnostic** (counts from `orders-info`) when the API returns rows but “open” filters to zero.
- **Delivered filter:** Orders count as closed if `track_status` is **121** (numeric or string) or `track_status_name` matches **“delivered”** (word boundary), or if warehouse status is **23** (canceled).
- **PII:** Recipient names are included in section 1; post only to channels your policy allows (private ops channel + Incoming Webhook scope).

### Troubleshooting: no Slack message

- **Vercel:** `SLACK_WEBHOOK_URL` and `CRON_SECRET` must be set for Production. Cron jobs send `Authorization: Bearer <CRON_SECRET>`.
- **502 / timeout:** ChinaDivision `orders-info` over a long window can still be slow; check function logs. Open-order tracking is capped (default 50) to avoid hundreds of track API calls.
- **Webhook errors:** Logs may show `Slack webhook rejected: invalid_payload` (bad URL or body). Incoming Webhook URLs must be the full `https://hooks.slack.com/services/...` value.

## Known limitations

- **Approving “shortage”** is derived from **line-item quantities** vs **global** `sku-inventory-all` counts, not from ChinaDivision’s internal allocation or pick exceptions.
- **Last location** depends on `order-track-list` / `track_list` text; Approving orders often have **no** tracking yet. The digest **Last:** line uses the **newest** scan and includes **event date/time** (locale string), **place**, parsed **country** when distinct, and **order ship-to country** when it adds context.
- **`order-track-list` batches** of up to 40 IDs: a batch failure is logged and skipped; those orders may show “No tracking yet” even if tracking exists.
- **Delivered** is inferred from `track_status === 121` ([`TRACK_STATUS_STAGES.DELIVERED`](../../../lib/notifications/tracking-link.ts)).

## Performance / monitoring

- Logs: `[cron/warehouse-daily-slack]` with `slackPosted`, counts, `openOrderCap`, and `slackCharCount`.
- Broader monitoring patterns: [`lib/monitoring/README.md`](../../../lib/monitoring/README.md).

## Version

- **Version:** 1.0.2  
- **Last updated:** 2026-04-04

## Change log

| Date | Change |
|------|--------|
| 2026-04-04 | Open-order lines: **Local** vs **STONE3PL** tracking (`main` / `LM` from order-info vs `order-track-list`). |
| 2026-04-04 | Initial cron + Slack summary (open orders, Approving shortage view, StreetLamp001/002 counts). |
| 2026-04-04 | Cap open orders + tracking fetches to 50 (configurable); stricter Slack webhook response handling; `slackPosted` in API response. |
| 2026-04-04 | Default lookback 90d; coerce `track_status` / name-based delivered; diagnostic block when API has rows but open list empty. |
| 2026-04-04 | Query overrides `days` + `openLimit`; JSON always includes `preview`; cron path sets `?days=90&openLimit=50`. |
| 2026-04-04 | Richer **Last:** line: scan date/time, place, country, ship-to country when useful. |
| 2026-04-04 | Open-order lines include **recipient** (`ship_name` or first + last). |

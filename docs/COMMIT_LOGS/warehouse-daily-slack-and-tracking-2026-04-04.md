# Commit log: Warehouse daily Slack + Local/STONE3PL tracking (2026-04-04)

## Summary

Ships the secured cron `GET /api/cron/warehouse-daily-slack` that posts a daily Slack digest from ChinaDivision (open orders, Approving SKU gap, StreetLamp counts). Open-order lines include **Local** (order-info `tracking_number` / `last_mile_tracking`) and **STONE3PL** (same from `order-track-list` when present), plus existing **Last:** location text.

## Checklist

- [x] Summary builder: [`lib/warehouse/daily-slack-summary.ts`](../../lib/warehouse/daily-slack-summary.ts)
- [x] `formatTrackingNumbersForSlack` + tests: [`tests/daily-slack-summary-tracking.test.ts`](../../tests/daily-slack-summary-tracking.test.ts)
- [x] Slack webhook: [`lib/notifications/slack-webhook.ts`](../../lib/notifications/slack-webhook.ts)
- [x] Cron route: [`app/api/cron/warehouse-daily-slack/route.ts`](../../app/api/cron/warehouse-daily-slack/route.ts)
- [x] `OrderTrackListItem.last_mile_tracking?`: [`lib/chinadivision/client.ts`](../../lib/chinadivision/client.ts)
- [x] Vercel cron + limits: [`vercel.json`](../../vercel.json)
- [x] Env docs: [`.env.example`](../../.env.example), [`docs/VERCEL_DEPLOYMENT_ENV.md`](../VERCEL_DEPLOYMENT_ENV.md)
- [x] Feature README: [`docs/features/warehouse-daily-slack/README.md`](../features/warehouse-daily-slack/README.md)
- [x] Root README: [`README.md`](../../README.md)
- [x] Tests: `npx jest tests/daily-slack-summary-tracking.test.ts --no-coverage`
- [x] Manual: digest posted to Slack [`#all-jonathan`](https://street-collector.slack.com/archives/C0AE3UZ3FME/p1775339400847889) (preview from `dryRun=1` local run; Vercel env has no `SLACK_WEBHOOK_URL` yet — add it for webhook-based cron posts)

## Env vars

| Name | Purpose |
|------|---------|
| `CHINADIVISION_API_KEY` | ChinaDivision API |
| `SLACK_WEBHOOK_URL` | Incoming Webhook (required unless `dryRun=1`) |
| `CRON_SECRET` | Bearer for production cron |
| `WAREHOUSE_SLACK_SUMMARY_DAYS` | Optional lookback (default 90) |
| `WAREHOUSE_SLACK_OPEN_ORDER_LIMIT` | Optional open-order cap (default 50) |

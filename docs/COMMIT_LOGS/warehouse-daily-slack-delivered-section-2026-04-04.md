# Commit log: Warehouse Slack — single tracking line + last 5 delivered (2026-04-04)

## Summary

Dedupes open-order tracking to one **main** + **LM** line (track-list preferred over order-info). Adds **section 4**: **last 5 delivered** with recipient and inferred delivery time; merges `order-track-list` ids with open + delivered candidate pool; extends cron `meta` with `deliveredInWindowCount` / `deliveredSectionShown`.

## Checklist

- [x] Summary + delivered logic: [`lib/warehouse/daily-slack-summary.ts`](../../lib/warehouse/daily-slack-summary.ts)
- [x] `resolveDeliveredWhenForSlack`: [`lib/warehouse/daily-slack-summary.ts`](../../lib/warehouse/daily-slack-summary.ts)
- [x] Tracking format tests: [`tests/daily-slack-summary-tracking.test.ts`](../../tests/daily-slack-summary-tracking.test.ts)
- [x] Delivered-when tests: [`tests/delivered-when-slack.test.ts`](../../tests/delivered-when-slack.test.ts)
- [x] Feature README: [`docs/features/warehouse-daily-slack/README.md`](../features/warehouse-daily-slack/README.md)
- [x] `npx jest tests/daily-slack-summary-tracking.test.ts tests/delivered-when-slack.test.ts --no-coverage`

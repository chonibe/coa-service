# Commit log: Street Collector roadmap wrap (2026-03-27)

Context: close remaining items from the product-aligned Street Collector plan (watchlist analytics copy, collector API, Reserve reminder cron) without editing the plan file.

## Checklist

- [x] [app/(store)/shop/reserve/page.tsx](../../app/(store)/shop/reserve/page.tsx) — **Follow-up:** default export wraps content in `<Suspense>` so `useSearchParams()` satisfies Next.js 15 static prerender rules.
- [x] [lib/shop/edition-watchlist-notifications.ts](../../lib/shop/edition-watchlist-notifications.ts) — Watchlist stage emails append **Street Collector ladder** line when edition size is S1 (90) or S2 (44); PostHog `watchlist_notification_sent` includes `street_stage_key`, `street_stage_price_usd`, `street_pricing_line`.
- [x] [app/api/collector/dashboard/route.ts](../../app/api/collector/dashboard/route.ts) — Response includes **`streetReserveLocks`**: non-expired rows from `street_reserve_locks` for the session email (Shopify product id, locked USD, `expires_at`).
- [x] [app/api/cron/street-reserve-reminders/route.ts](../../app/api/cron/street-reserve-reminders/route.ts) — Daily reminder (Bearer `CRON_SECRET`): emails members whose lock expires in the ~20–28h window to limit duplicate sends.
- [x] [vercel.json](../../vercel.json) — Cron schedule `0 10 * * *` → `/api/cron/street-reserve-reminders`.
- [x] [docs/features/experience-v2/README.md](../features/experience-v2/README.md) — Version note linking implementation files above.

## Deployment / ops

- Apply migration **`supabase/migrations/20260327183000_street_collector_reserve.sql`** on the target Supabase project if not already applied (local `supabase db push` may require migration history repair if remote drift exists).
- Set **`STREET_RESERVE_STRIPE_PRICE_*`** (per `lib/shop/street-reserve-config.ts`) and ensure **`CRON_SECRET`** is set in Vercel for cron auth.

## Testing

- [ ] `GET /api/collector/dashboard` (authenticated collector): JSON contains `streetReserveLocks` array (may be empty).
- [ ] `GET /api/cron/street-reserve-reminders` with `Authorization: Bearer $CRON_SECRET`: returns `{ success, sent }` (0 if no locks in window).
- [ ] Watchlist flow: trigger stage change in staging; email body includes ladder paragraph when product is S1/S2-sized.

# Phase 1 — Payouts depth (cancel, retry, reasons, pending disclosure)

**Date:** 2026-04-17
**Branch:** main
**Related plan:** `restore-profile-nfc-payout-affordances` → Phase 1 ("payouts depth")
**Predecessor:** `2026-04-17_vendor_appshell_v1_retirement.md`

---

## What this commit ships

Closes the loop on the artist-facing payouts surface so every status the
backend can produce is now explained and actionable from the AppShell:

1. **Cancel** a `requested` payout from the Pending tab (already had an
   endpoint; the UI never wired it).
2. **Retry** a `failed` payout from History (endpoint existed; UI ignored it).
3. **See _why_** a payout was rejected or failed — admin-side endpoints now
   write to `rejection_reason` / `failure_reason`, and the artist UI renders
   them with a clear callout.
4. **Disclose line items** locked inside an in-flight `requested` payout, so
   the artist can answer "what's actually in this $X request?" without an
   email to support.
5. **Honor configuration**: ETA copy comes from
   `/api/vendor/payouts/config.processingWindowDays` instead of being baked
   in; the `Held` balance card hides itself when there's nothing held; the
   invoice download icon only appears for `completed` / `paid` rows.
6. **Type fixes**: `OverviewTab` was reading `config.minimumPayoutAmount`
   without it being declared as a prop (TS would have failed in strict
   builds). Same for `PendingTab` (cancel) and `HistoryTab` (retry) — props
   were passed but never destructured.

## Files touched

### Artist UI
- `app/vendor/(app)/insights/payouts/page.tsx`
  - `OverviewTab`: declare `config: PayoutsConfig`; render ETA from
    `config.processingWindowDays`; conditionally render the `Held` card.
  - `PendingTab`: accept `cancelPayout`, `cancelingId`, `config`; render
    `<details>` line-item disclosure; render Cancel button only while
    status === `requested`.
  - `HistoryTab`: accept `retryPayout`, `retryingId`; gate invoice icon to
    paid statuses only; render rejection/failure reason callout; render Retry
    button on `failed` rows.
  - Add `canceled` to `StatusFilter` type, dropdown, status styles/labels.
  - Helper `isPaidStatus()` for the invoice gate.

### Admin endpoints (write the reason columns the UI now reads)
- `app/api/admin/payouts/approve/route.ts`
  - On `reject`: write `rejection_reason` + `processed_at`, not just `notes`.
  - On `approve` SUCCESS: stamp `processed_at`.
  - On PayPal failure: write `failure_reason` + `processed_at`.
- `app/api/admin/payouts/mark-paid/route.ts`
  - Stamp `processed_at` when admin marks a record as completed.
- `app/api/admin/payouts/mark-month-paid/route.ts`
  - Same — `processed_at` on bulk monthly payouts.

### Already-landed scaffolding consumed by this commit
- `supabase/migrations/20260417200000_vendor_payouts_status_fields.sql`
  (idempotent — adds `rejection_reason`, `failure_reason`, `processed_at`,
  `canceled_at`, `canceled_by`, `cancel_reason` + helpful partial indexes).
- `app/api/vendor/payouts/[id]/cancel/route.ts`
- `app/api/vendor/payouts/[id]/retry/route.ts`
- `app/api/vendor/payouts/route.ts` — already returned the new fields with
  null fallbacks (Phase 0).

## Migration apply note

`20260417200000_vendor_payouts_status_fields.sql` is on disk and idempotent
(`ADD COLUMN IF NOT EXISTS`), but **was not auto-pushed** in this commit
because there are 13 other unapplied migrations from in-flight teammate work
that running `supabase db push` would also send to production. Apply when
the rest of the migration queue is ready:

```bash
supabase migration list   # confirm what would land
supabase db push
```

Until applied, the new columns return `null` and the UI gracefully renders
nothing in the reason callout. No regressions.

## Deferred (intentional)

- **PayPal email change confirmation flow** (double-opt-in + readiness
  gating) — needs its own migration + email template + verify endpoint.
  Tracked as the Phase 4 / banking sweep follow-up.
- **Artist email notifications for cancel / rejection / failure** — the
  admin already gets notified via `notifications/payout-notifications`; the
  artist-facing emails are part of the broader notif sweep.
- **Unit tests for redeem/cancel/retry** — folded into the Phase 5 test
  pass.
- **"Net amount" / commission breakdown polish on metric cards** — purely
  cosmetic, pushed into Phase 2 alongside Studio polish.

## QA checklist

- [ ] As an artist with $0 held: balance strip shows two cards, not three.
- [ ] As an artist with > $0 held: third card reappears.
- [ ] Pending tab: cancel a `requested` payout → row leaves Pending,
      balance restored, payout shows up in History as `Canceled`.
- [ ] Pending tab: line-item disclosure expands and totals match the
      payout amount.
- [ ] Admin rejects a payout → artist History shows red callout with the
      reason text.
- [ ] Admin approval triggers PayPal failure → artist History shows
      `Failed` row with reason text and a working Retry button. Retry
      flips status back to `Reviewing`.
- [ ] Invoice download icon is **absent** for `requested` / `processing` /
      `rejected` / `failed` / `canceled` rows; **present** for `paid`.
- [ ] ETA copy matches the value in
      `/api/vendor/payouts/config.processingWindowDays`.

## Next phase

Phase 2 — Studio polish: artwork autosave, slug auto-generation, image
warnings, Studio filter pills (Approved / Rejected), bulk artwork upload,
series archive/duplicate/preview.

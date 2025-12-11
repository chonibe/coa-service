# ChinaDivision Auto-Fulfillment Tests

## Scope
Manual validation for `/api/warehouse/orders/auto-fulfill`.

## Preconditions
- Env vars: `CRON_SECRET`, `CHINADIVISION_API_KEY`, `SHOPIFY_ACCESS_TOKEN`, `SHOPIFY_SHOP`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.
- Shopify order exists matching ChinaDivision `order_id` and has fulfillment order open.

## Test Cases
1. Dry run
   - Call `POST /api/warehouse/orders/auto-fulfill?dryRun=true` with `x-cron-secret`.
   - Expect `success: true`, counts populated, `linksCreated/emailsSent/fulfillmentsCreated` remain 0.
2. Live run
   - Call without `dryRun`.
   - Expect `linksCreated` >= 0, `emailsSent` increments, `fulfillmentsCreated` increments.
   - Shopify order shows new fulfillment with tracking number.
3. Idempotency
   - Re-run on same orders; expect no duplicate fulfillment (status shows processed/skipped) and no extra emails if status unchanged.
4. Email content
   - Verify email uses recipient name and link points to `/track/{token}`.
5. Tracking link
   - Open link; orders render with tracking number/status; no auth required.
6. Failure handling
   - Temporarily remove `RESEND_API_KEY`; expect email send failure surfaced in `results` with partial status, other steps continue.

## Performance/Monitoring
- Monitor run duration and API rate limits via logs; follow `lib/monitoring/README.md` guidance.


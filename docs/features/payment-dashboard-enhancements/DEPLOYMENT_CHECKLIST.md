# Payment Dashboard Enhancements - Vercel Deployment Checklist

## Pre-Deployment Checklist

### 1. Database Tables Required

The following tables need to be created in Supabase before deployment:

#### `payout_schedules`
```sql
CREATE TABLE IF NOT EXISTS payout_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly')),
  day_of_week INTEGER,
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 28),
  auto_process BOOLEAN DEFAULT false,
  threshold DECIMAL(10, 2),
  vendor_name TEXT,
  enabled BOOLEAN DEFAULT true,
  next_run TIMESTAMPTZ,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_schedules_vendor ON payout_schedules(vendor_name);
CREATE INDEX IF NOT EXISTS idx_payout_schedules_enabled ON payout_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_payout_schedules_next_run ON payout_schedules(next_run);
```

#### `payout_disputes`
```sql
CREATE TABLE IF NOT EXISTS payout_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'escalated', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_disputes_vendor ON payout_disputes(vendor_name);
CREATE INDEX IF NOT EXISTS idx_payout_disputes_status ON payout_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payout_disputes_payout_id ON payout_disputes(payout_id);
```

#### `payout_dispute_comments`
```sql
CREATE TABLE IF NOT EXISTS payout_dispute_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES payout_disputes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_dispute_comments_dispute ON payout_dispute_comments(dispute_id);
```

### 2. Vercel Configuration Updates

#### Update `vercel.json` to include cron job for scheduled payouts:

```json
{
  "version": 2,
  "crons": [
    {
      "path": "/api/cron/process-scheduled-payouts",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/process-scheduled-payouts",
      "schedule": "0 */6 * * *"
    }
  ],
  "functions": {
    "app/api/payouts/notifications/stream/route.ts": {
      "maxDuration": 60
    }
  }
}
```

**Note**: Server-Sent Events (SSE) endpoints may need longer timeout. The `maxDuration` setting helps with this.

### 3. Environment Variables

Ensure these are set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` ✅ (already configured)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ (already configured)
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
- `SHOPIFY_ACCESS_TOKEN` (if not already set)
- `SHOPIFY_SHOP` (if not already set)

### 4. API Route Considerations

#### Server-Sent Events (SSE)
The `/api/payouts/notifications/stream/route.ts` endpoint uses SSE which:
- Requires longer timeout (configured above)
- May need Vercel Pro plan for extended function execution
- Consider using WebSockets for production if SSE has limitations

#### Cron Jobs
- Already configured in `vercel.json` for scheduled payouts
- May need to create `/api/cron/process-scheduled-payouts/route.ts` if it doesn't exist

### 5. Build Considerations

All new components use:
- ✅ Existing UI library (no new dependencies)
- ✅ Recharts (already in package.json)
- ✅ TypeScript (fully typed)
- ✅ Next.js 15 (compatible)

No additional build steps required.

### 6. Deployment Steps

1. **Run Database Migrations**
   ```bash
   # Connect to Supabase and run the SQL above
   # Or use Supabase migration tool
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Verify Deployment**
   - Check build logs for errors
   - Test API endpoints
   - Verify SSE connection works
   - Test scheduled payout cron job

### 7. Post-Deployment Testing

- [ ] Test analytics endpoints
- [ ] Verify real-time notifications work
- [ ] Test export functionality
- [ ] Verify scheduled payouts execute
- [ ] Test reconciliation tool
- [ ] Verify dispute management
- [ ] Check mobile responsiveness

### 8. Known Limitations

1. **SSE Timeout**: Vercel free tier has 10s timeout for serverless functions. SSE may need Pro plan or alternative solution.

2. **Cron Frequency**: Vercel cron jobs have limitations on frequency. Current setup uses daily at 9 AM and every 6 hours.

3. **Database Tables**: Must be created manually in Supabase before features work.

### 9. Rollback Plan

If issues occur:
1. Revert to previous deployment in Vercel dashboard
2. Components are isolated and won't break existing functionality
3. API endpoints return errors gracefully

### 10. Monitoring

After deployment, monitor:
- API response times
- SSE connection stability
- Cron job execution logs
- Database query performance
- Error rates in Vercel logs

## Quick Deploy Command

```bash
# 1. Ensure database tables are created
# 2. Deploy to Vercel
vercel --prod

# 3. Verify deployment
curl https://your-domain.vercel.app/api/payouts/analytics/metrics
```

## Troubleshooting

### SSE Not Working
- Check Vercel function timeout settings
- Verify `maxDuration` in vercel.json
- Consider upgrading to Vercel Pro plan

### Cron Jobs Not Running
- Verify cron configuration in vercel.json
- Check Vercel cron job logs
- Ensure route exists: `/api/cron/process-scheduled-payouts`

### Database Errors
- Verify tables exist in Supabase
- Check RLS (Row Level Security) policies
- Verify service role key is set



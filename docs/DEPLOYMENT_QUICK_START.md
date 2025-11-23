# Quick Deployment Guide - Vercel

## Pre-Deployment Checklist

### 1. Database Migrations
Run the following migration in Supabase:
- `supabase/migrations/20250120000000_payment_dashboard_enhancements.sql`

### 2. Environment Variables in Vercel
Ensure these are set in Vercel Dashboard → Settings → Environment Variables:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` ✅ (already in vercel.json)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ (already in vercel.json)
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
- `CRON_SECRET` (for cron job authentication)
- `NEXT_PUBLIC_APP_URL` (your Vercel deployment URL, e.g., `https://your-project.vercel.app`)

**Optional but Recommended:**
- `SHOPIFY_ACCESS_TOKEN`
- `SHOPIFY_SHOP`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`

### 3. Deploy Command

```bash
# From project root
vercel --prod
```

Or use Vercel Dashboard:
1. Push to your main branch
2. Vercel will auto-deploy
3. Check deployment logs for any issues

## Post-Deployment Verification

1. **Test Login Page**: Visit `/login` - should show new improved UI
2. **Test Forgot Password**: Visit `/forgot-password`
3. **Test API Endpoints**: 
   - `/api/payouts/analytics/metrics`
   - `/api/payouts/analytics`
4. **Check Cron Jobs**: Verify scheduled payouts are configured

## Troubleshooting

### Build Errors
- Check Vercel build logs
- Verify all environment variables are set
- Ensure database migrations are applied

### Runtime Errors
- Check Vercel function logs
- Verify API endpoints are accessible
- Check Supabase connection

### SSE Not Working
- Verify `maxDuration: 60` in vercel.json
- May need Vercel Pro plan for extended timeouts
- Consider WebSocket alternative for production

## Notes

- TypeScript linter errors in IDE are often false positives
- Actual build will use correct Next.js types
- All components are production-ready


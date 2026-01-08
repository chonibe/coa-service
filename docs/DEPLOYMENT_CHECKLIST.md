# Deployment Checklist - Final Verification

## ✅ Environment Variables in Vercel

Verify all these are set in Vercel Dashboard → Settings → Environment Variables:

### Required Variables
- [x] `PAYPAL_CLIENT_ID` - Your PayPal Client ID
- [x] `PAYPAL_CLIENT_SECRET` - Your PayPal Client Secret
- [x] `PAYPAL_ENVIRONMENT` - Set to `sandbox` or `production`
- [x] `PAYPAL_WEBHOOK_SECRET` - PayPal webhook secret (if provided)
- [x] `NEXT_PUBLIC_APP_URL` - Should be `https://app.thestreetcollector.com`
- [x] `CRON_SECRET` - Random secret for cron authentication
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Already Configured (verify they exist)
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `NEXT_PUBLIC_STREET_LAMP_CLIENT_ID`

## ✅ PayPal Configuration

### PayPal Dashboard
- [x] REST API app created
- [x] Client ID and Secret copied
- [x] Webhook URL configured: `https://app.thestreetcollector.com/api/webhooks/paypal`
- [x] Webhook events subscribed:
  - `PAYMENT.PAYOUTSBATCH.SUCCESS`
  - `PAYMENT.PAYOUTSBATCH.DENIED`
  - `PAYMENT.PAYOUTSBATCH.CANCELED`
  - `PAYMENT.PAYOUTSBATCH.PROCESSING`
- [x] Webhook status: Active

## ✅ Domain Configuration

- [x] `app.thestreetcollector.com` added to Vercel project
- [x] DNS records configured correctly
- [x] SSL certificate active (HTTPS working)
- [x] Domain verified in Vercel

## ✅ Database Migrations

- [x] Run migration: `supabase/migrations/20250120000000_payment_dashboard_enhancements.sql`
  - Creates `payout_disputes` table
  - Creates `payout_dispute_comments` table
  - Updates `payout_schedules` structure

## ✅ Testing Checklist

After deployment, test:

### 1. Vendor Redeem Feature
- [ ] Login as vendor
- [ ] Navigate to Payouts page
- [ ] Click "Redeem Payout" button
- [ ] Verify PayPal payment is processed
- [ ] Check payout status updates to "processing" or "completed"

### 2. PayPal Webhook
- [ ] Process a test payout
- [ ] Check Vercel function logs for webhook events
- [ ] Verify payout status updates automatically
- [ ] Check vendor receives notification

### 3. Payment Status Display
- [ ] Check admin dashboard - paid items show "Paid" badge
- [ ] Check vendor dashboard - paid items show "Paid" badge
- [ ] Click payment reference links - should show details

### 4. Cron Jobs
- [ ] Check Vercel cron job logs
- [ ] Verify scheduled payouts run (if configured)
- [ ] Check `CRON_SECRET` authentication works

## 🐛 Troubleshooting

### If Vendor Redeem Fails:
1. Check PayPal credentials are correct
2. Verify `PAYPAL_ENVIRONMENT` matches your credentials (sandbox/production)
3. Check vendor has valid PayPal email in settings
4. Review Vercel function logs for errors

### If Webhooks Don't Work:
1. Verify webhook URL is accessible: `https://dashboard.thestreetlamp.com/api/webhooks/paypal`
2. Check PayPal webhook is active in PayPal dashboard
3. Review Vercel function logs for webhook events
4. Verify `PAYPAL_WEBHOOK_SECRET` is set (optional but recommended)

### If Cron Jobs Fail:
1. Verify `CRON_SECRET` is set correctly
2. Check cron job path matches in `vercel.json`
3. Review Vercel cron job logs
4. Verify cron job schedule is correct

## 📝 Next Steps

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Test in Production:**
   - Start with PayPal sandbox mode
   - Test vendor redeem with small amount
   - Verify webhooks work
   - Switch to production when ready

3. **Monitor:**
   - Check Vercel function logs regularly
   - Monitor PayPal dashboard for payout status
   - Review error logs for any issues

## 🎉 You're All Set!

Once all checkboxes are marked, your deployment is ready. The vendor redeem feature will automatically process PayPal payments when vendors click "Redeem Payout".




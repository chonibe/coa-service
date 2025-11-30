# Vercel Environment Variables Checklist

## Required Environment Variables

Add these environment variables in your Vercel Dashboard → Settings → Environment Variables

### 1. Supabase (Already in vercel.json, but verify in Vercel Dashboard)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` - **ADD THIS** - Required for admin operations and server-side queries

### 2. PayPal (Required for Vendor Redeem & Payout Processing)
- ⚠️ `PAYPAL_CLIENT_ID` - **REQUIRED** - Your PayPal API Client ID
- ⚠️ `PAYPAL_CLIENT_SECRET` - **REQUIRED** - Your PayPal API Client Secret
- ⚠️ `PAYPAL_ENVIRONMENT` - Set to `sandbox` for testing or `production` for live
- ⚠️ `PAYPAL_WEBHOOK_SECRET` - (Optional but recommended) For webhook signature verification

### 3. Application URL
- ⚠️ `NEXT_PUBLIC_APP_URL` - **REQUIRED** - Your Vercel deployment URL (e.g., `https://your-project.vercel.app`)
  - Used for invoice links, callback URLs, etc.

### 4. Cron Jobs
- ⚠️ `CRON_SECRET` - **REQUIRED** - Secret token for authenticating cron job requests
  - Generate a random string: `openssl rand -base64 32`
  - Must match the secret used in cron job configuration

### 5. Shopify (If using Shopify integration)
- `SHOPIFY_ACCESS_TOKEN` - Shopify Admin API access token
- `SHOPIFY_SHOP` - Your Shopify shop domain (e.g., `your-shop.myshopify.com`)

### 6. Street Lamp (Already in vercel.json)
- ✅ `NEXT_PUBLIC_STREET_LAMP_CLIENT_ID` - Already configured

## Quick Setup Steps

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add Required Variables:**
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_ENVIRONMENT=sandbox  # or 'production'
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   CRON_SECRET=your_random_secret_string
   ```

3. **For Production PayPal:**
   - Get credentials from: https://developer.paypal.com/dashboard/
   - Create a REST API app
   - Copy Client ID and Secret
   - Set `PAYPAL_ENVIRONMENT=production`

4. **For Supabase Service Role Key:**
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key (keep this secret!)

5. **Generate CRON_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

6. **Set Environment for:**
   - Production
   - Preview (optional, can use same values)
   - Development (optional, can use same values)

## Verification Checklist

After adding variables, verify:
- [ ] All variables are set for "Production" environment
- [ ] PayPal credentials are correct (test with sandbox first)
- [ ] `NEXT_PUBLIC_APP_URL` matches your actual Vercel URL
- [ ] `CRON_SECRET` is set and matches your cron job configuration
- [ ] Supabase service role key has proper permissions

## Testing After Deployment

1. Test vendor redeem functionality:
   - Login as vendor
   - Click "Redeem Payout"
   - Should process PayPal payment

2. Test cron jobs:
   - Check Vercel logs for cron job execution
   - Verify `CRON_SECRET` authentication works

3. Test PayPal webhooks:
   - Configure webhook URL in PayPal dashboard
   - URL: `https://your-project.vercel.app/api/webhooks/paypal`

## Important Notes

- ⚠️ **Never commit secrets to git** - Always use Vercel environment variables
- ⚠️ **PayPal Sandbox vs Production** - Use sandbox for testing, production for live
- ⚠️ **Service Role Key** - Has full database access, keep it secret
- ⚠️ **CRON_SECRET** - Must be the same value used in cron job configuration

## Troubleshooting

If payouts fail:
1. Check PayPal credentials are correct
2. Verify `PAYPAL_ENVIRONMENT` matches your credentials (sandbox/production)
3. Check vendor PayPal emails are valid
4. Review Vercel function logs for errors

If cron jobs fail:
1. Verify `CRON_SECRET` is set correctly
2. Check cron job path matches in `vercel.json`
3. Review Vercel cron job logs




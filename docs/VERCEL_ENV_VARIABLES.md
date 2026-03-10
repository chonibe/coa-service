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
- ⚠️ `PAYPAL_WEBHOOK_ID` - **REQUIRED** - Your PayPal Webhook ID for automated status updates
- ⚠️ `PAYPAL_WEBHOOK_SECRET` - (Optional but recommended) For webhook signature verification

### 3. Application URL
- ⚠️ `NEXT_PUBLIC_APP_URL` - **REQUIRED** - Your production domain: `https://app.thestreetcollector.com`
  - Used for invoice links, callback URLs, etc.

### 4. Cron Jobs
- ⚠️ `CRON_SECRET` - **REQUIRED** - Secret token for authenticating cron job requests
  - Generate a random string: `openssl rand -base64 32`
  - Must match the secret used in cron job configuration

### 5. Shopify (If using Shopify integration)
- `SHOPIFY_ACCESS_TOKEN` - Shopify Admin API access token
- `SHOPIFY_SHOP` - Your Shopify shop domain (e.g., `your-shop.myshopify.com`)

### 5b. Shopify Storefront API (Required for Shop/Experience pages)
- `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` - **REQUIRED for product data** - Storefront API access token (not Admin API)
- `SHOPIFY_SHOP` - Same as above, or use `NEXT_PUBLIC_SHOPIFY_SHOP` for client-side

**To create a Storefront API token:**
1. Shopify Admin → Apps → Develop apps → Create an app (or use existing)
2. Configure Admin API scopes (optional for Storefront)
3. Under **API credentials** → **Storefront API integration** → Configure Storefront API scopes
4. Enable required scopes (e.g. `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`)
5. Install app → copy the **Storefront API access token**

### 6. Street Lamp (Already in vercel.json)
- ✅ `NEXT_PUBLIC_STREET_LAMP_CLIENT_ID` - Already configured

### 7. WhatsApp Business API (Meta Cloud API)
- ⚠️ `WHATSAPP_WEBHOOK_SECRET` - **REQUIRED** for webhook signature verification when using WhatsApp webhook
  - Use your WhatsApp App Secret from Meta Developer Console
  - Without this, POST webhook requests will be rejected with 401

### 8. CRM Webhook (Attio)
- ⚠️ `CRM_WEBHOOK_SECRET` or `ATTIO_WEBHOOK_SECRET` - **REQUIRED** for inbound CRM webhook signature verification
  - Use your webhook secret from Attio Developer Settings
  - Without this, inbound webhook requests will be rejected with 401

### 9. CORS – Allowed origins (optional)
- `ALLOWED_ORIGINS` – Optional. Comma-separated list of origins allowed for CORS (e.g. `https://admin.example.com,https://portal.example.com`).
- **Production:** Use **explicit origins only**. Do not set to `*`. Wildcard subdomain entries (e.g. `*.example.com`) from this variable are **ignored** in production; only full URLs are used.
- **Recommended for production:** Set to explicit URLs if you have additional frontends (e.g. `https://admin.thestreetcollector.com`). If unset, the app URL, `https://app.thestreetcollector.com`, and `https://thestreetcollector.com` are already allowed by default.
- See [`lib/middleware/cors.ts`](../lib/middleware/cors.ts) and [Security Policy](./SECURITY_POLICY.md).

## Quick Setup Steps

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add Required Variables:**
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_ENVIRONMENT=sandbox  # or 'production'
   NEXT_PUBLIC_APP_URL=https://app.thestreetcollector.com
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
- [ ] `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` and `SHOPIFY_SHOP` are set (for shop/experience pages)
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
   - URL: `https://app.thestreetcollector.com/api/webhooks/paypal`

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

If "Shopify Storefront API Not Configured" appears:
1. Go to Vercel → Project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` (Storefront API token, **not** Admin API token)
3. Add `SHOPIFY_SHOP` (e.g. `your-store.myshopify.com`) if not already set
4. Ensure both are enabled for Production
5. Redeploy (Vercel → Deployments → … → Redeploy)
6. For local dev: copy these to `.env.local`




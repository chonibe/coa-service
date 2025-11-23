# Vercel Deployment - Required Environment Variables

## 🔴 CRITICAL - Must Add These

### 1. PayPal (Required for Vendor Redeem Feature)
```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox  # or 'production' for live
```

**How to get:**
- Go to https://developer.paypal.com/dashboard/
- Create a REST API app
- Copy Client ID and Secret
- Use `sandbox` for testing, `production` for live

### 2. Application URL (Required)
```
NEXT_PUBLIC_APP_URL=https://dashboard.thestreetlamp.com
```
**Note:** Use your custom domain (if configured) or your Vercel deployment URL

### 3. Cron Secret (Required for Scheduled Payouts)
```
CRON_SECRET=your_random_secret_string
```

**Generate it:**
```bash
openssl rand -base64 32
```

### 4. Supabase Service Role Key (Required for Admin Operations)
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**How to get:**
- Supabase Dashboard → Settings → API
- Copy the `service_role` key (⚠️ Keep this secret!)

## ✅ Already Configured (in vercel.json)

These are already in your `vercel.json`, but verify they're also set in Vercel Dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://ldmppmnpgdxueebkkpid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_STREET_LAMP_CLIENT_ID=594cf36a-179f-4227-821d-1dd00f778900
```

## 📋 Optional (If Using These Features)

### Shopify Integration
```
SHOPIFY_ACCESS_TOKEN=your_shopify_token
SHOPIFY_SHOP=your-shop.myshopify.com
```

### PayPal Webhook (Recommended)
```
PAYPAL_WEBHOOK_SECRET=your_webhook_secret
```

### ChinaDivision Warehouse API (Required for Warehouse Order Tracking)
```
CHINADIVISION_API_KEY=your_chinadivision_api_key
```

**How to get:**
- Log in to your ChinaDivision account at https://www.chinadivision.com
- Navigate to Settings → API
- Copy your API key
- Your API key: `5f91972f8d59ec8039cecfec3adcead5`


## 🚀 Quick Setup Steps

1. **Go to Vercel Dashboard**
   - Your Project → Settings → Environment Variables

2. **Add Required Variables:**
   - Click "Add New"
   - Add each variable above
   - Set environment to "Production" (and Preview/Development if needed)

3. **Verify:**
   - All variables are set for Production
   - No typos in variable names
   - Values are correct

4. **Redeploy:**
   - After adding variables, trigger a new deployment
   - Or push a commit to trigger auto-deploy

## ⚠️ Important Notes

- **Never commit secrets to git** - Always use Vercel environment variables
- **PayPal Sandbox vs Production** - Start with sandbox for testing
- **Service Role Key** - Has full database access, keep it secret
- **CRON_SECRET** - Must match in all environments

## 🧪 Testing After Deployment

1. **Test Vendor Redeem:**
   - Login as vendor
   - Click "Redeem Payout"
   - Should process PayPal payment

2. **Test Cron Jobs:**
   - Check Vercel logs
   - Verify scheduled payouts run

3. **Check Logs:**
   - Vercel Dashboard → Functions → Logs
   - Look for any missing environment variable errors

## 📝 Complete List for Copy-Paste

Add these in Vercel Dashboard:

```
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENVIRONMENT=sandbox
NEXT_PUBLIC_APP_URL=https://dashboard.thestreetlamp.com
CRON_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
CHINADIVISION_API_KEY=5f91972f8d59ec8039cecfec3adcead5
```

Replace empty values with your actual credentials!

## ✅ Your PayPal Webhook URL

You've configured:
```
https://dashboard.thestreetlamp.com/api/webhooks/paypal
```

**Make sure:**
- ✅ Domain `dashboard.thestreetlamp.com` is configured in Vercel
- ✅ Domain points to your Vercel deployment
- ✅ SSL certificate is active (HTTPS works)
- ✅ Webhook events are subscribed in PayPal dashboard


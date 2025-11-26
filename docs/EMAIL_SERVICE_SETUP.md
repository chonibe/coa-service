# Email Service Setup Guide - Resend

This guide will help you set up Resend email service for order tracking notifications and other email features.

## Why Resend?

- ✅ **Free tier:** 3,000 emails/month
- ✅ **Easy setup:** Simple API integration
- ✅ **Good deliverability:** High email delivery rates
- ✅ **Developer-friendly:** Great documentation and dashboard

## Step-by-Step Setup

### 1. Create Resend Account

1. Go to https://resend.com
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with your email or GitHub account
4. Verify your email address

### 2. Get Your API Key

1. After logging in, go to **API Keys**: https://resend.com/api-keys
2. Click **"Create API Key"**
3. Give it a descriptive name:
   - For production: `Production - Street Collector`
   - For testing: `Development`
4. Click **"Add"**
5. **⚠️ IMPORTANT:** Copy the API key immediately (it starts with `re_`)
   - You won't be able to see it again after closing the modal
   - If you lose it, you'll need to create a new one

### 3. Verify Your Domain (Recommended)

**Why verify?**
- Better email deliverability
- Use your own domain (e.g., `noreply@yourdomain.com`)
- Professional appearance
- Avoid spam filters

**How to verify:**

1. Go to **Domains**: https://resend.com/domains
2. Click **"Add Domain"**
3. Enter your domain (e.g., `yourdomain.com` or `mail.yourdomain.com`)
4. Resend will provide DNS records to add:
   - **SPF record** (TXT)
   - **DKIM record** (TXT)
   - **DMARC record** (TXT) - Optional but recommended

5. Add these records to your domain's DNS:
   - Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
   - Navigate to DNS settings
   - Add each record exactly as Resend provides
   - Wait for DNS propagation (usually 5-30 minutes)

6. Resend will automatically verify once DNS records are detected
   - Status will change from "Pending" to "Verified"

### 4. Add to Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Navigate to your project
   - Click **Settings** → **Environment Variables**

2. **Add `RESEND_API_KEY`:**
   - Click **"Add New"**
   - Name: `RESEND_API_KEY`
   - Value: Your API key (starts with `re_`)
   - Environment: Select **Production** (and **Preview** if you want it there too)
   - Click **"Save"**

3. **Add `EMAIL_FROM` (Optional but Recommended):**
   - Click **"Add New"**
   - Name: `EMAIL_FROM`
   - Value: Your verified domain email (e.g., `noreply@yourdomain.com`)
     - Or use Resend's default: `onboarding@resend.dev` (for testing only)
   - Environment: Select **Production**
   - Click **"Save"**

### 5. Redeploy Your Application

After adding environment variables:

1. **Option A - Automatic:**
   - Push a commit to trigger auto-deployment
   - Vercel will pick up the new environment variables

2. **Option B - Manual:**
   - Go to Vercel Dashboard → Deployments
   - Click **"Redeploy"** on the latest deployment
   - Select **"Use existing Build Cache"** (optional)
   - Click **"Redeploy"**

### 6. Test Email Notifications

1. **Go to your tracking page:**
   - Navigate to a tracking link (e.g., `/track/[token]`)

2. **Open Settings:**
   - Click the **Settings** button in the header

3. **Enable Email Notifications:**
   - Toggle **"Email Notifications"** ON
   - Enter your email address
   - Click **"Send Test Email"**

4. **Check your inbox:**
   - You should receive a test email within seconds
   - Check spam folder if you don't see it

## Troubleshooting

### "Email service not configured" Error

**Problem:** The `RESEND_API_KEY` environment variable is not set or not accessible.

**Solution:**
1. Verify the variable is set in Vercel Dashboard
2. Make sure it's set for the correct environment (Production/Preview)
3. Redeploy your application after adding the variable
4. Check Vercel function logs for errors

### Emails Going to Spam

**Problem:** Emails are being marked as spam.

**Solutions:**
1. **Verify your domain** (see Step 3 above)
2. **Use a verified domain** in `EMAIL_FROM`
3. **Set up DMARC** records (Resend provides these)
4. **Warm up your domain** by sending a few test emails first

### "Invalid API Key" Error

**Problem:** The API key is incorrect or has been revoked.

**Solution:**
1. Go to Resend Dashboard → API Keys
2. Check if the key is still active
3. Create a new API key if needed
4. Update it in Vercel environment variables
5. Redeploy

### Test Email Not Sending

**Check:**
1. ✅ `RESEND_API_KEY` is set in Vercel
2. ✅ Email address is valid
3. ✅ Email notifications are enabled in settings
4. ✅ Check browser console for errors
5. ✅ Check Vercel function logs

## Resend Dashboard Features

Once set up, you can:

- **View email logs:** See all sent emails
- **Monitor deliverability:** Track open rates, bounces, etc.
- **Manage domains:** Add/remove verified domains
- **View usage:** Check your monthly email count
- **API keys:** Manage multiple keys for different environments

## Pricing

- **Free Tier:** 3,000 emails/month
- **Pro:** $20/month for 50,000 emails
- **Business:** Custom pricing for higher volumes

For most use cases, the free tier is sufficient.

## Security Best Practices

1. **Never commit API keys to git**
   - Always use environment variables
   - Use `.env.local` for local development (and add to `.gitignore`)

2. **Rotate API keys regularly**
   - Create new keys every 3-6 months
   - Delete old unused keys

3. **Use different keys for different environments**
   - Production key for production
   - Development key for testing

4. **Monitor usage**
   - Check Resend dashboard regularly
   - Set up alerts for unusual activity

## Support

- **Resend Docs:** https://resend.com/docs
- **Resend Support:** support@resend.com
- **Resend Status:** https://status.resend.com

## Next Steps

After setup:
1. ✅ Test email notifications work
2. ✅ Verify emails are delivered (not spam)
3. ✅ Monitor Resend dashboard for any issues
4. ✅ Set up domain verification for better deliverability



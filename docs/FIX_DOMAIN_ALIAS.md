# Fix Dashboard Domain Alias

## Problem
The domain `dashboard.thestreetlamp.com` is pointing to an old Vercel deployment that doesn't have the PKCE OAuth fixes, causing a login loop.

## Solution: Update Domain via Vercel Dashboard

### Step 1: Access Your Project
Go to: **https://vercel.com/chonibes-projects/street-collector**

### Step 2: Navigate to Domains Settings
1. Click **"Settings"** in the top navigation
2. Click **"Domains"** in the left sidebar

### Step 3: Check Current Domain Status
- Look for `dashboard.thestreetlamp.com` in the domains list
- If it's **NOT listed**, proceed to Step 4
- If it **IS listed** but pointing to wrong deployment, proceed to Step 5

### Step 4: Add Domain (if not present)
1. Click **"Add Domain"** button
2. Enter: `dashboard.thestreetlamp.com`
3. Click **"Add"**
4. If DNS verification is needed, follow the instructions
5. Wait for verification (may take a few minutes)

### Step 5: Assign to Latest Deployment
1. Go to **"Deployments"** tab
2. Find the latest deployment: `street-collector-3hoj9vs2d-chonibes-projects.vercel.app`
3. Click the **"..."** menu (three dots) on that deployment
4. Select **"Assign Domain"**
5. Choose `dashboard.thestreetlamp.com` from the list
6. Confirm the assignment

### Step 6: Verify DNS Configuration
If the domain was just added, ensure DNS is configured:
- **CNAME Record**: `dashboard.thestreetlamp.com` → `cname.vercel-dns.com`
- Or use the A record provided by Vercel

### Step 7: Test the Fix
1. Visit: `https://dashboard.thestreetlamp.com/login`
2. Sign in with Google
3. You should be redirected to `/vendor/dashboard` or `/admin/dashboard`
4. **No more login loop!**

## Alternative: If Domain is in Another Project

If you see an error that the domain is "already assigned to another project":

1. **Find the other project:**
   - Go to your Vercel dashboard
   - Check all projects for `dashboard.thestreetlamp.com`
   - Or contact Vercel support to identify it

2. **Remove from other project:**
   - Go to that project's Settings → Domains
   - Remove `dashboard.thestreetlamp.com`

3. **Add to street-collector:**
   - Follow Steps 4-7 above

## Current Production Deployment Info

- **Deployment URL**: `street-collector-3hoj9vs2d-chonibes-projects.vercel.app`
- **Project**: `street-collector`
- **Team**: `chonibes-projects`
- **Status**: Ready (has PKCE OAuth fixes)

## Troubleshooting

### Domain verification fails
- Check DNS records are correct
- Wait 5-10 minutes for DNS propagation
- Try verifying again

### Still seeing login loop after update
- Clear browser cookies for `dashboard.thestreetlamp.com`
- Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check Supabase redirect URLs include the domain

### Can't find domain in any project
- Domain may be managed externally (DNS only)
- Check your DNS provider for CNAME records
- Update DNS to point to: `cname.vercel-dns.com`

## Quick Reference Links

- **Project Dashboard**: https://vercel.com/chonibes-projects/street-collector
- **Domains Settings**: https://vercel.com/chonibes-projects/street-collector/settings/domains
- **Deployments**: https://vercel.com/chonibes-projects/street-collector/deployments


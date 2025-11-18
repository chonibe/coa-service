# Update Vercel Domain Alias

The domain `dashboard.thestreetlamp.com` is currently assigned to a different Vercel project. To fix the login loop, you need to reassign it to the latest deployment.

## Steps to Fix via Vercel Dashboard

1. **Go to the Vercel project**: https://vercel.com/chonibes-projects/street-collector

2. **Navigate to Settings → Domains**

3. **Find `dashboard.thestreetlamp.com`** in the list (it may be assigned to a different project)

4. **If it's in another project:**
   - Go to that project's Settings → Domains
   - Remove `dashboard.thestreetlamp.com` from that project

5. **Add the domain to street-collector:**
   - In the street-collector project, go to Settings → Domains
   - Click "Add Domain"
   - Enter `dashboard.thestreetlamp.com`
   - Follow the DNS verification steps if needed

6. **Assign to latest deployment:**
   - Go to the latest deployment: `street-collector-3hoj9vs2d-chonibes-projects.vercel.app`
   - Click "Assign Domain"
   - Select `dashboard.thestreetlamp.com`

## Alternative: Use Vercel CLI (if you have access to the other project)

If you know which project currently has the domain:

```bash
# 1. Link to the project that has the domain
cd /path/to/other/project
vercel link

# 2. Remove the domain from that project
vercel domains rm dashboard.thestreetlamp.com

# 3. Link to street-collector
cd /Users/chonib/coa-service
vercel link --project street-collector

# 4. Add domain to street-collector
vercel domains add dashboard.thestreetlamp.com

# 5. Assign to latest deployment
vercel alias set street-collector-3hoj9vs2d-chonibes-projects.vercel.app dashboard.thestreetlamp.com
```

## Verify It's Working

After updating the domain:

1. Visit `https://dashboard.thestreetlamp.com/login`
2. Sign in with Google
3. You should be redirected to `/vendor/dashboard` or `/admin/dashboard` (not back to login)

## Current Production Deployment

- **Latest**: `street-collector-3hoj9vs2d-chonibes-projects.vercel.app`
- **Project**: `street-collector`
- **Team**: `chonibes-projects`


# Reassign Domain to Latest Deployment

The domain `dashboard.thestreetlamp.com` is attached to a deployment, but it needs to point to the latest one with PKCE fixes.

## Quick Steps

1. **Go to**: https://vercel.com/chonibes-projects/street-collector/settings/domains

2. **Find** `dashboard.thestreetlamp.com` in the list

3. **Click on it** to see which deployment it's assigned to

4. **Change the assignment**:
   - Click "Edit" or the deployment name
   - Select the latest deployment: `street-collector-3hoj9vs2d-chonibes-projects.vercel.app`
   - Or look for the most recent deployment (5 days ago)

5. **Save** the changes

## Alternative: Via Deployments Tab

1. Go to: https://vercel.com/chonibes-projects/street-collector/deployments

2. Find the latest deployment: `street-collector-3hoj9vs2d-chonibes-projects.vercel.app`

3. Click the **"..."** menu (three dots)

4. Select **"Assign Domain"**

5. Choose `dashboard.thestreetlamp.com`

6. This will automatically reassign the domain to this deployment

## Verify

After reassigning:
- Visit `https://dashboard.thestreetlamp.com/login`
- Sign in with Google
- Should redirect to dashboard (no loop)


# Reassign Domain to Latest Deployment

Since `dashboard.thestreetlamp.com` is already attached to a deployment, you just need to change which deployment it points to.

## Quick Steps (2 minutes)

### Option 1: Via Domains Settings (Recommended)

1. **Go to**: https://vercel.com/chonibes-projects/street-collector/settings/domains

2. **Find** `dashboard.thestreetlamp.com` in the list

3. **Click on the domain** to see its current assignment

4. **Change the deployment**:
   - You'll see which deployment it's currently assigned to
   - Click **"Change"** or **"Edit"** next to the deployment
   - Select: **`street-collector-3hoj9vs2d-chonibes-projects.vercel.app`**
   - (Or look for the most recent deployment from 5 days ago)

5. **Save** the changes

### Option 2: Via Deployments Tab

1. **Go to**: https://vercel.com/chonibes-projects/street-collector/deployments

2. **Find the latest deployment**:
   - Look for: `street-collector-3hoj9vs2d-chonibes-projects.vercel.app`
   - It should show "5d" (5 days ago) in the age column
   - Status should be "Ready" with a green dot

3. **Click the "..." menu** (three dots) on that deployment

4. **Select "Assign Domain"**

5. **Choose** `dashboard.thestreetlamp.com` from the dropdown

6. **Confirm** - This will automatically reassign the domain

## Verify It's Fixed

After reassigning:

1. **Wait 1-2 minutes** for the change to propagate

2. **Visit**: `https://dashboard.thestreetlamp.com/login`

3. **Sign in with Google**

4. **Expected result**: You should be redirected to `/vendor/dashboard` or `/admin/dashboard` (no login loop!)

## If You Still See Login Loop

1. **Clear browser cookies** for `dashboard.thestreetlamp.com`
2. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. **Check the deployment URL** in your browser's address bar - it should show the new deployment ID

## Current Deployment Info

- **Target Deployment**: `street-collector-3hoj9vs2d-chonibes-projects.vercel.app`
- **Has PKCE OAuth fixes**: ✅ Yes
- **Has hash-based redirect handling**: ✅ Yes
- **Status**: Ready for production


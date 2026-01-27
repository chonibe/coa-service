# Deployment Instructions - Artwork Pages Fix

## Current Status
✅ Local changes completed and tested
⏳ **Pending: Deployment to production**

## What Was Changed
Fixed 404 errors when trying to edit artwork pages for:
1. Pending submissions (UUID IDs from `vendor_product_submissions` table)
2. Accepted products with UUID IDs in the `products` table

### Modified Files
- `app/api/vendor/artwork-pages/[productId]/route.ts` (POST, PUT, DELETE handlers)
- `app/api/vendor/artwork-pages/[productId]/apply-template/route.ts` (POST handler)

## Why Production is Still Failing
The production site (`app.thestreetcollector.com`) is running the old code that doesn't have the submission support fixes. The changes only exist in your local development environment.

## How to Deploy

### Option 1: Deploy via Vercel (Recommended)
```bash
# 1. Commit your changes
git add .
git commit -m "Fix: Support artwork pages for submissions and UUID products

- Extended POST/PUT/DELETE handlers to support both submissions and products
- Added UUID detection and dual lookup strategy
- Submissions store blocks in product_data.benefits array
- Products store blocks in product_benefits table
- Fixes 404 errors when editing content blocks"

# 2. Push to your main branch
git push origin main

# 3. Vercel will automatically deploy
# Monitor deployment at: https://vercel.com/your-project/deployments
```

### Option 2: Manual Deployment
If you're not using automatic deployments:
```bash
# Deploy to Vercel manually
vercel --prod
```

### Option 3: Deploy to Another Platform
Follow your platform's deployment process (Netlify, AWS, etc.)

## Testing After Deployment

### 1. Test with a Pending Submission
1. Go to `https://app.thestreetcollector.com/vendor/dashboard/artwork-pages`
2. Click on a pending submission (UUID ID like `e2c1425f-0b19-4472-b523-323b7d91849a`)
3. Try to:
   - Apply template
   - Add content blocks
   - Edit blocks
   - Delete blocks

### 2. Test with an Accepted Product
1. Click on an accepted product with UUID ID (like `00000000-0000-4000-8000-07de59de00e3`)
2. Perform the same operations

### 3. Verify Error Handling
- Check browser console for errors
- Verify no 404 responses
- Confirm content blocks save correctly

## Testing Locally (Before Deployment)

To test locally on your machine:

```bash
# Make sure dev server is running
npm run dev

# Open in browser
http://localhost:3005/vendor/dashboard/artwork-pages
```

Then test with your actual product/submission IDs.

## Rollback Plan
If issues occur after deployment:

```bash
# Revert the commit
git revert HEAD

# Push to trigger redeploy
git push origin main
```

## Database Considerations

### No Database Changes Required
This fix only changes the API layer - no database migrations needed.

### Data Storage
- **Submissions**: Content blocks stored in `product_data.benefits` JSON array
- **Products**: Content blocks stored in `product_benefits` table
- When a submission is accepted, blocks should be migrated (separate concern)

## Monitoring After Deployment

Watch for:
1. Server logs for any errors
2. Sentry/error tracking for exceptions
3. User reports of issues

## Support
If issues persist after deployment:
1. Check Vercel logs for server-side errors
2. Check browser console for client-side errors  
3. Verify the vendor is authenticated correctly
4. Confirm the product/submission ID exists in the database

## Next Steps
1. ✅ Commit changes (if not done)
2. ⏳ Push to repository
3. ⏳ Verify deployment completes
4. ⏳ Test on production
5. ⏳ Monitor for issues

---

**Date**: January 27, 2026
**Changes**: Artwork Pages API - Submission Support
**Risk Level**: Low (backward compatible, only extends existing functionality)

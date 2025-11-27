# DEPLOYMENT RULE - CRITICAL

## ⚠️ MANDATORY: Always Deploy When Completing Work

**This is a CRITICAL rule that must be followed for every completed feature or task.**

### Rule
When you complete any feature, task, or significant change, you MUST:

1. ✅ **Commit all changes** with a descriptive commit message
2. ✅ **Deploy to Vercel production** using: `vercel --prod --yes`
3. ✅ **Verify deployment success** by checking the deployment URL
4. ✅ **Document any deployment notes** or issues

### Why This Rule Exists
- Ensures all completed work is immediately available in production
- Prevents accumulation of undeployed changes
- Maintains consistency between development and production
- Allows immediate testing of new features

### Deployment Command
```bash
# From project root
vercel --prod --yes
```

### Verification
After deployment, verify:
- [ ] Deployment completed successfully
- [ ] No build errors in Vercel logs
- [ ] New features are accessible
- [ ] API endpoints are working
- [ ] No runtime errors

### Exceptions
Only skip deployment if:
- Changes are purely documentation (README, comments)
- Changes are in development-only files
- Explicitly requested by user to skip deployment

### Deployment Checklist
- [ ] All changes committed
- [ ] Commit message is descriptive
- [ ] No linting errors
- [ ] Build passes locally (if possible)
- [ ] Deployed to Vercel production
- [ ] Deployment verified

## Quick Reference

```bash
# Standard deployment workflow
git add -A
git commit -m "feat: Description of changes"
vercel --prod --yes
```

## Last Updated
2025-01-29 - Series Manager implementation


# Polaris Update Checklist

Use this checklist when updating Polaris packages.

## Pre-Update

- [ ] Check current versions: `npm list @shopify/polaris`
- [ ] Review Polaris changelog: https://github.com/Shopify/polaris/releases
- [ ] Read migration guide (if major): https://polaris.shopify.com/version/latest/migration-guides
- [ ] Create update branch: `git checkout -b polaris-update-v[X.X.X]`
- [ ] Backup current state: `git commit -m "chore: before Polaris update"`

## Update Process

- [ ] Run update check: `npm run polaris:check-updates`
- [ ] Review what's changing
- [ ] Update packages:
  - [ ] For minor/patch: `npm update @shopify/polaris @shopify/polaris-icons @shopify/polaris-tokens`
  - [ ] For major: `npm install @shopify/polaris@latest @shopify/polaris-icons@latest @shopify/polaris-tokens@latest`
- [ ] Review package.json changes
- [ ] Commit: `git add package*.json && git commit -m "chore: update Polaris to v[X.X.X]"`

## Automated Testing

- [ ] Type checking: `npm run type-check` or `npx tsc --noEmit`
- [ ] Linting: `npm run lint`
- [ ] Unit tests: `npm test`
- [ ] Build: `npm run build`

## Manual Testing

Test all portals for visual and functional correctness:

### Admin Portal
- [ ] Dashboard loads correctly
- [ ] Forms work (create/edit)
- [ ] Tables display properly
- [ ] Modals/dialogs function
- [ ] Navigation works

### Vendor Portal
- [ ] Dashboard displays
- [ ] Product management
- [ ] Series management
- [ ] Settings page

### Collector Portal
- [ ] Dashboard loads
- [ ] Artwork display
- [ ] Profile page
- [ ] Collection view

### Public Pages
- [ ] Login/signup forms
- [ ] Certificate pages
- [ ] Authentication flows

## Component Wrapper Review

If major version update, review each wrapper:

- [ ] `polaris-button.tsx` - Check Button API changes
- [ ] `polaris-card.tsx` - Check Card API changes
- [ ] `polaris-text-field.tsx` - Check TextField API changes
- [ ] `polaris-select.tsx` - Check Select API changes
- [ ] `polaris-dialog.tsx` - Check Dialog/Modal API changes
- [ ] `polaris-badge.tsx` - Check Badge API changes
- [ ] `polaris-data-table.tsx` - Check DataTable API changes
- [ ] `polaris-tabs.tsx` - Check Tabs API changes
- [ ] `polaris-banner.tsx` - Check Banner API changes
- [ ] Review all other wrappers in `components/polaris/`

## Documentation Updates

- [ ] Update `components/ui/interfaces.ts` if prop types changed
- [ ] Update `components/ui/QUICK_REFERENCE.md` with new features
- [ ] Update `docs/DESIGN_SYSTEM.md` if tokens changed
- [ ] Update `docs/POLARIS_UPDATE_LOG.md` with this version
- [ ] Document any breaking changes in PR description

## Visual Regression Testing (If Available)

- [ ] Run Storybook: `npm run storybook`
- [ ] Review component states visually
- [ ] Run Chromatic: `npm run chromatic` (if configured)
- [ ] Review and approve visual changes

## Pull Request

- [ ] Create PR with descriptive title: `chore: update Polaris to v[X.X.X]`
- [ ] Include changelog summary in PR description
- [ ] Link to Polaris release notes
- [ ] List any breaking changes
- [ ] Request code review from frontend team
- [ ] Get QA approval

## Deployment

- [ ] Merge to main after approval
- [ ] Monitor CI/CD pipeline
- [ ] Deploy to staging environment
- [ ] Smoke test on staging:
  - [ ] Login works
  - [ ] Navigation works
  - [ ] Forms submit correctly
  - [ ] No console errors
- [ ] Deploy to production
- [ ] Monitor error rates for 24 hours

## Post-Update

- [ ] Update `docs/POLARIS_UPDATE_LOG.md`:
  ```markdown
  ### v[X.X.X] - [Date]
  - **Update Type**: Major/Minor/Patch
  - **Updated By**: [Your Name]
  - **Breaking Changes**: Yes/No
  - **Components Affected**: [List if any]
  - **Migration Notes**: [Any important notes]
  ```
- [ ] Close related GitHub issues
- [ ] Announce update in team chat
- [ ] Schedule follow-up review (1 week later)

## Rollback Plan (If Issues Occur)

- [ ] Identify the issue
- [ ] Decide: Fix forward or rollback?
- [ ] If rollback:
  ```bash
  git revert <commit-hash>
  npm install @shopify/polaris@<previous-version>
  npm install @shopify/polaris-icons@<previous-version>
  npm install @shopify/polaris-tokens@<previous-version>
  git add package*.json
  git commit -m "chore: rollback Polaris to v[previous]"
  ```
- [ ] Deploy rollback
- [ ] Document issues in GitHub issue
- [ ] Plan proper fix

## Notes

- **For patch updates (X.X.X)**: Usually safe, just bug fixes
- **For minor updates (X.X.0)**: New features, backwards compatible
- **For major updates (X.0.0)**: Breaking changes, requires careful review

---

**Template Version**: 1.0  
**Last Updated**: January 25, 2026

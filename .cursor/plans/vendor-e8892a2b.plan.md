<!-- e8892a2b-307f-4151-aac6-8bee4667a312 a1be1803-3f9f-426f-b81b-9dd66b76ea12 -->
# Vendor/Admin Auth UX Refresh Plan

## Goals

- Deliver a unified login experience that clearly separates vendor and admin actions while using modern layout patterns.
- Align signup/onboarding flows with the new visual language and ensure redirects behave consistently for both roles.
- Document the updated flow and ensure supporting routes honor the refined redirect behavior.

## Key Changes

- Introduce a reusable `AuthShell` UI wrapper with branding/illustration support, consumed by login and signup screens.
- Redesign `app/vendor/login/page.tsx` to:
- Present role-specific actions via tabs (Vendor / Admin) inside the shared layout.
- Surface Google SSO CTA, error messaging, and admin impersonation tools with clearer hierarchy.
- Preserve query-string redirects via `useSearchParams`, propagating the target to Google SSO.
- Refresh `app/vendor/signup/page.tsx` to use the new shell, highlight email pairing state, and streamline the create/claim options.
- Ensure redirect consistency:
- Extend `/api/auth/google/start` to accept origin redirection hints from the login tab selection.
- Adjust `/app/auth/callback/route.ts` to respect admin-mode redirects without forcing dashboard navigation.
- Update `docs/features/vendor-dashboard/README.md` and top-level docs (`docs/README.md`, `docs/API_DOCUMENTATION.md`) to describe the new UX flow and redirect parameters.

## Validation

- Manual walkthroughs:
- Vendor login success → dashboard.
- Vendor without pairing → signup page with pending status messaging.
- Admin tab impersonation flow.
- Admin Google login returning to admin tools view.
- Verify Vercel build succeeds and that CLI deployment + git push remain green.

IMPLEMENTATION CHECKLIST:

1. Add `components/vendor/AuthShell.tsx` providing the shared hero + card layout.
2. Refactor `app/vendor/login/page.tsx` to use `AuthShell`, add vendor/admin tabs, and propagate redirect hints.
3. Update `app/vendor/signup/page.tsx` to adopt `AuthShell`, polish sections, and align status messaging.
4. Enhance `/api/auth/google/start/route.ts` and `/app/auth/callback/route.ts` to honor login tab redirects.
5. Refresh documentation in `docs/features/vendor-dashboard/README.md`, `docs/README.md`, and `docs/API_DOCUMENTATION.md` to reflect the new flow.
6. Perform manual UX regression checks, then redeploy to Vercel and push git updates.

### To-dos

- [ ] Create shared auth shell layout for vendor/admin login surfaces
- [ ] Revamp vendor login page with tabs and redirect propagation
- [ ] Restyle vendor signup page using new shell and messaging
- [ ] Propagate login redirect hints through OAuth start and callback
- [ ] Document new auth flow across vendor feature docs
- [ ] Manual auth flow QA, deploy to Vercel, push git
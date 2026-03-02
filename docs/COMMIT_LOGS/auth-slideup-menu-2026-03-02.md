# Auth Slide-up Menu (2026-03-02)

## Summary

Added an in-context slide-up auth menu for the shop experience that supports Email (2-step OTP), Google, and Facebook sign-in.

## Checklist of Changes

- [x] **AuthSlideupMenu component** ([`components/shop/auth/AuthSlideupMenu.tsx`](../../components/shop/auth/AuthSlideupMenu.tsx))
  - Email input + Continue → sends OTP via `signInWithOtp`
  - Code verification screen with back, Resend Code, and `verifyOtp`
  - Google and Facebook OAuth buttons
  - Terms/Privacy footer

- [x] **Facebook OAuth route** ([`app/api/auth/collector/facebook/start/route.ts`](../../app/api/auth/collector/facebook/start/route.ts))
  - Mirrors Google collector route with `provider: "facebook"`
  - Requires Facebook to be enabled in Supabase Auth

- [x] **Ensure collector profile API** ([`app/api/auth/collector/ensure-profile/route.ts`](../../app/api/auth/collector/ensure-profile/route.ts))
  - Ensures collector profile and role exist after email OTP verification
  - Sets `collector_session` cookie
  - Creates profile/role/avatar/ledger for new signups

- [x] **ExperienceSlideoutMenu integration** ([`app/shop/experience/ExperienceSlideoutMenu.tsx`](../../app/shop/experience/ExperienceSlideoutMenu.tsx))
  - Replaced Link to `/login` with button that opens AuthSlideupMenu
  - Auth menu opens as slide-up from bottom after closing the main menu

- [x] **Documentation** ([`docs/features/auth-slideup-menu/README.md`](../../docs/features/auth-slideup-menu/README.md))
  - Feature overview, usage, Supabase OTP template config, Facebook setup

## Supabase Configuration Required

1. **Email OTP**: Edit Magic Link template to use `{{ .Token }}` instead of confirmation URL for 6-digit codes.
2. **Facebook**: Enable Facebook provider in Supabase and configure Facebook App credentials.

## Related Files

- [`components/polaris/polaris-sheet.tsx`](../../components/polaris/polaris-sheet.tsx) – Sheet used for slide-up
- [`app/auth/callback/route.ts`](../../app/auth/callback/route.ts) – Handles OAuth callback for Google/Facebook
- [`lib/collector-session.ts`](../../lib/collector-session.ts) – Collector session cookie helpers

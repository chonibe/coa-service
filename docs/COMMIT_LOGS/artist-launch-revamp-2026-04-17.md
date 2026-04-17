# Commit Log: Artist Launch Revamp (Public Welcome → Login → Onboarding → App-Shell)

**Date:** 2026-04-17
**Branch:** `feature/artist-launch-revamp`
**Scope:** Public welcome page, apply form, login restyle, onboarding wizard,
first-login gate, app-shell home/insights/studio/inbox/profile, shell
consolidation, docs.

## Summary

End-to-end revamp of the artist arc — from a cold visitor landing on
`/for-artists` through application, login, first-time onboarding, and day-to-day
use of the app-shell home, sales, studio, and inbox — into one calm, editorial
product with no broken loops.

The previous state had silent data bugs (stats ignoring `range`, balance API
returning 400 for app-shell pages), broken redirect loops (`/vendor/login`
swallowing query params, `/auth/callback` sending to a dead page, forgot
password pointing at a nonexistent `/reset-password`), inconsistent post-login
targets (`/vendor/dashboard` vs `/vendor/home`), SaaS-style gradients on every
surface, placeholder `href="#"` settings rows, and double chrome where
`SidebarLayout` wrapped the new `AppShell`.

Every one of those issues is resolved below.

## Changes Checklist

### Phase 0 — Stop the bleeding (silent data + redirect bugs)
- [x] `GET /api/vendor/stats` now accepts `range`, `from`, `to`, and
      `compare` query params and emits current + previous period numbers —
      [`app/api/vendor/stats/route.ts`](../../app/api/vendor/stats/route.ts)
- [x] `GET /api/vendors/balance` resolves `vendorName` from the session when
      it's missing from the query string (fixes 400s on app-shell pages) —
      [`app/api/vendors/balance/route.ts`](../../app/api/vendors/balance/route.ts)
- [x] Added `useVendorName` hook to cache the vendor name in `sessionStorage`
      for legacy components that still need `?vendorName=` —
      [`hooks/use-vendor-name.ts`](../../hooks/use-vendor-name.ts)
- [x] Legacy `/vendor/login` route preserves incoming search params and sets
      `intent=vendor` —
      [`app/vendor/login/route.ts`](../../app/vendor/login/route.ts)
- [x] `/auth/callback` redirects session-missing errors to
      `/login?error=session_missing&intent=vendor` (not `/vendor/login`) —
      [`app/auth/callback/route.ts`](../../app/auth/callback/route.ts)
- [x] Created missing `/reset-password` page so forgot-password emails no
      longer 404 —
      [`app/reset-password/page.tsx`](../../app/reset-password/page.tsx)
- [x] Centralized support email in one constant —
      [`lib/constants/support.ts`](../../lib/constants/support.ts)
- [x] Removed `href="#"` Notifications / Privacy rows from vendor settings —
      [`app/vendor/(app)/profile/settings/page.tsx`](../../app/vendor/(app)/profile/settings/page.tsx)
- [x] Removed broken `ContextualOnboarding` usage and unused imports from
      legacy dashboard —
      [`app/vendor/dashboard/page.tsx`](../../app/vendor/dashboard/page.tsx)

### Phase 1 — Public welcome (`/for-artists`)
- [x] Editorial welcome page using the Impact design system —
      [`app/for-artists/page.tsx`](../../app/for-artists/page.tsx)
- [x] Inline application form with explicit success / error states —
      [`app/for-artists/apply/page.tsx`](../../app/for-artists/apply/page.tsx)
- [x] Backing API with sanitization, de-dup (24h), and team notification —
      [`app/api/artists/apply/route.ts`](../../app/api/artists/apply/route.ts)
- [x] New `artist_applications` table with RLS (public insert, admin
      read/update) —
      [`supabase/migrations/20260417120000_artist_applications.sql`](../../supabase/migrations/20260417120000_artist_applications.sql)
- [x] Legacy `/join-vendor` 308-redirects to `/for-artists` —
      [`next.config.js`](../../next.config.js)

### Phase 2 — Login restyle
- [x] Rebuilt `/login` with the Impact / editorial aesthetic, removed the
      hidden Shopify button and SaaS gradients —
      [`app/login/login-client.tsx`](../../app/login/login-client.tsx)
- [x] All error copy now uses `SUPPORT_EMAIL` / `supportMailto`.

### Phase 3 — Welcome gate + calm onboarding wizard
- [x] Added `/vendor/welcome` inside the AppShell as a first-login gate that
      checks `onboarding_completed` and routes to wizard vs home —
      [`app/vendor/(app)/welcome/page.tsx`](../../app/vendor/(app)/welcome/page.tsx)
- [x] Calmed the wizard page loader (plain white, single spinner) —
      [`app/vendor/onboarding/page.tsx`](../../app/vendor/onboarding/page.tsx)
- [x] Removed gradients, glow, and animated icons from the wizard; Welcome
      and Completion steps now use Impact typography —
      [`app/vendor/components/onboarding-wizard.tsx`](../../app/vendor/components/onboarding-wizard.tsx)
- [x] Post-onboarding redirect consolidated on `/vendor/home` —
      [`app/vendor/onboarding/page.tsx`](../../app/vendor/onboarding/page.tsx)
- [x] `/join-vendor` OAuth post-login target also consolidated on
      `/vendor/home` —
      [`app/join-vendor/page.tsx`](../../app/join-vendor/page.tsx)

### Phase 4 — App-shell home & sales
- [x] Rebuilt `/vendor/home` with: greeting, pending-payout hero, range-aware
      metric strip, sales sparkline, and a Recent Activity table. Redirects
      non-onboarded vendors to `/vendor/welcome` —
      [`app/vendor/(app)/home/page.tsx`](../../app/vendor/(app)/home/page.tsx)
- [x] Rebuilt `/vendor/insights` as a dedicated Sales overview with range
      switcher (7d / 30d / 90d / YTD), revenue-over-time bar chart, recent
      line items table, and CSV export —
      [`app/vendor/(app)/insights/page.tsx`](../../app/vendor/(app)/insights/page.tsx)
- [x] Payouts subpage now reads correct keys from `/api/vendors/balance` —
      [`app/vendor/(app)/insights/payouts/page.tsx`](../../app/vendor/(app)/insights/payouts/page.tsx)

### Phase 5 — Studio / Inbox / Profile polish
- [x] Real empty states in Studio (filter-aware) —
      [`app/vendor/(app)/studio/page.tsx`](../../app/vendor/(app)/studio/page.tsx)
- [x] Real empty states in Inbox (search-aware) —
      [`app/vendor/(app)/inbox/page.tsx`](../../app/vendor/(app)/inbox/page.tsx)
- [x] Real empty state in Notifications —
      [`app/vendor/(app)/inbox/notifications/page.tsx`](../../app/vendor/(app)/inbox/notifications/page.tsx)
- [x] `SlimHeader` gained `showSearch` / `showNotifications` props; vendors
      hide search until there is a real global search, and the bell routes
      to `/vendor/inbox/notifications` —
      [`components/app-shell/SlimHeader.tsx`](../../components/app-shell/SlimHeader.tsx),
      [`app/vendor/(app)/layout.tsx`](../../app/vendor/(app)/layout.tsx)
- [x] Profile page reduced to four meaningful actions (Edit public profile /
      Public preview / Account settings / Sign out); Edit deep-links to the
      legacy editor with a `return` param —
      [`app/vendor/(app)/profile/page.tsx`](../../app/vendor/(app)/profile/page.tsx)
- [x] Legacy profile editor shows a "← Back to my portal" link when opened
      with `?return=` —
      [`app/vendor/dashboard/profile/page.tsx`](../../app/vendor/dashboard/profile/page.tsx)
- [x] `/vendor/signout` clears the session, cached name, and returns to
      `/login` —
      [`app/vendor/signout/page.tsx`](../../app/vendor/signout/page.tsx)

### Phase 6 — Shell consolidation (no more double chrome)
- [x] `/vendor/dashboard` (the landing page) now redirects to `/vendor/home`
      — [`app/vendor/dashboard/page.tsx`](../../app/vendor/dashboard/page.tsx)
- [x] Outer `app/vendor/layout.tsx` is auth-only; it no longer wraps every
      vendor route in `SidebarLayout` —
      [`app/vendor/layout.tsx`](../../app/vendor/layout.tsx)
- [x] `SidebarLayout` chrome scoped to `/vendor/dashboard/*` via a new
      nested layout —
      [`app/vendor/dashboard/layout.tsx`](../../app/vendor/dashboard/layout.tsx)
- [x] `ImpersonationBanner` mounted inside the AppShell so admins keep
      impersonation context on the new chrome —
      [`app/vendor/(app)/layout.tsx`](../../app/vendor/(app)/layout.tsx)
- [x] Removed redundant inline `<SidebarLayout>` wrappers from
      `/vendor/dashboard/messages` and `/vendor/dashboard/help` (would have
      double-wrapped after the new group layout) —
      [`app/vendor/dashboard/messages/page.tsx`](../../app/vendor/dashboard/messages/page.tsx),
      [`app/vendor/dashboard/help/page.tsx`](../../app/vendor/dashboard/help/page.tsx)

### Phase 7.5 — Restore profile tab, NFC affordances, create flows, and payouts parity

- [x] Swapped Inbox bottom tab for **Profile** (Profile is now the fifth tab;
      `User` icon); notifications keep living on the header bell —
      [`components/app-shell/BottomTabBar.tsx`](../../components/app-shell/BottomTabBar.tsx)
- [x] Retargeted the header bell to `/vendor/inbox` (the full inbox view) —
      [`app/vendor/(app)/layout.tsx`](../../app/vendor/(app)/layout.tsx)
- [x] Added a **Quick actions** strip to the Home page (Add artwork, Add
      series, Edit profile, Request payout) —
      [`app/vendor/(app)/home/page.tsx`](../../app/vendor/(app)/home/page.tsx)
- [x] Studio artwork cards now expose persistent **Experience** (NFC / unlock
      content) and **Edit** chips instead of a hover-only pencil —
      [`app/vendor/(app)/studio/page.tsx`](../../app/vendor/(app)/studio/page.tsx)
- [x] Studio > Series renamed the template link to **Edit unlock experience**
      and added a **Create series** CTA in the empty state —
      [`app/vendor/(app)/studio/series/page.tsx`](../../app/vendor/(app)/studio/series/page.tsx)
- [x] Artwork editor gained a **Back to Studio** button and an explicit
      "Artwork experience · NFC & unlock content" subtitle in the header —
      [`app/artwork-editor/[productId]/page.tsx`](../../app/artwork-editor/[productId]/page.tsx)
- [x] Artwork and series create pages now land back inside the AppShell with
      a **Back to Studio** breadcrumb and corrected cancel targets —
      [`app/vendor/dashboard/products/create/page.tsx`](../../app/vendor/dashboard/products/create/page.tsx),
      [`app/vendor/dashboard/series/create/page.tsx`](../../app/vendor/dashboard/series/create/page.tsx)
- [x] Rebuilt `/vendor/insights/payouts` with three tabs (Overview / Pending /
      History), prerequisite + $25 minimum announcement bar, balance strip,
      payout metrics, orders-in-process + ready-to-request accordions,
      pending request timeline, history filters (search / status / date /
      sort), month-grouped history, invoice PDF download, and client-side
      CSV export. Fixes three data-contract bugs: reads `readiness.isReady`
      (not `readiness` itself), pending months from
      `pending-items.groupedByMonth` / `unfulfilledGroupedByMonth`, and
      payout dates from `p.date` (API field) —
      [`app/vendor/(app)/insights/payouts/page.tsx`](../../app/vendor/(app)/insights/payouts/page.tsx)
- [x] Retargeted in-app + email payout deep links to
      `/vendor/insights/payouts` —
      [`lib/notifications/payout-notifications.ts`](../../lib/notifications/payout-notifications.ts),
      [`lib/email/templates/payout-pending-reminder.ts`](../../lib/email/templates/payout-pending-reminder.ts),
      [`lib/email/templates/refund-deduction.ts`](../../lib/email/templates/refund-deduction.ts)

### Phase 7 — Docs, log, tests
- [x] New artist onboarding feature doc —
      [`docs/features/artist-onboarding/README.md`](../features/artist-onboarding/README.md)
- [x] Vendor dashboard README changelog entry —
      [`docs/features/vendor-dashboard/README.md`](../features/vendor-dashboard/README.md)
- [x] Vendor login README changelog entry (version bumped to 1.2.0) —
      [`docs/features/vendor-login/README.md`](../features/vendor-login/README.md)
- [x] Manual test plan —
      [`tests/artist-launch.md`](../../tests/artist-launch.md)
- [x] This commit log —
      [`docs/COMMIT_LOGS/artist-launch-revamp-2026-04-17.md`](./artist-launch-revamp-2026-04-17.md)

## Bugs fixed

1. `/api/vendor/stats` ignoring `range` and `compare` query params.
2. `/api/vendors/balance` returning 400 on app-shell pages (no `vendorName` in
   query, no admin cookie).
3. UI reading wrong keys from the balance API (`balance.available` vs
   `balance.available_balance`).
4. `/vendor/login?error=...` stripping all query params during redirect.
5. Missing `/reset-password` page causing forgot-password emails to 404.
6. Inconsistent post-login targets (`/vendor/dashboard` vs `/vendor/home`).
7. `href="#"` stubs in vendor settings (Notifications, Privacy & Security).
8. Type mismatch + unused imports around `ContextualOnboarding`.
9. Unused `linkSupabaseUserToVendor` import in `/auth/callback`.
10. Double chrome — `SidebarLayout` wrapping every `/vendor/(app)/*` route
    on top of `AppShell`.
11. `/api/vendor/sales-analytics` uses `1y`, `/api/vendor/stats` uses `ytd`
    — resolved by a frontend-side mapping in `/vendor/insights`.

## Deployment Notes

- Apply the Supabase migration `20260417120000_artist_applications.sql`
  (via Supabase MCP or CLI) before deploying.
- Per `.cursorrules`, deploy to Vercel production after commit:
  `vercel --prod --yes`.
- No environment variable changes.
- No dependency changes.

## Manual Verification

Run through [`tests/artist-launch.md`](../../tests/artist-launch.md) end to
end. Key flows:

1. Cold visitor: `/for-artists` → Apply → success.
2. Legacy visitor: `/join-vendor` → 308 → `/for-artists`.
3. New artist: `/login` (Google) → `/vendor/welcome` → `/vendor/onboarding`
   → `/vendor/home`.
4. Returning artist: `/login` → `/vendor/home`.
5. App-shell user visits `/vendor/home`, `/vendor/insights`,
   `/vendor/studio`, `/vendor/inbox`, `/vendor/profile` — only the
   AppShell chrome is visible, no legacy sidebar, no gradient background,
   no layout shift, no 400s on balance/stats calls.
6. Legacy editor at `/vendor/dashboard/profile?return=/vendor/profile`
   shows the "← Back to my portal" link and still uses SidebarLayout.
7. `/vendor/signout` clears the session and returns to `/login`.
8. Forgot password → email → `/reset-password` → new password set →
   `/login`.
9. Vendor bottom tab: Home / Studio / Create / Insights / **Profile**; the
   header bell opens `/vendor/inbox`.
10. Home shows a **Quick actions** row (Add artwork / Add series / Edit
    profile / Request payout) and each link lands on the expected page.
11. `/vendor/studio` artwork cards show **Experience** and **Edit** chips
    (no hover required); clicking Experience opens
    `/artwork-editor/:productId` with a Back-to-Studio affordance.
12. `/vendor/studio/series` empty state offers a **Create series** button
    that opens the in-AppShell create form with a **Back to Studio**
    breadcrumb.
13. `/vendor/insights/payouts`:
    - Overview shows an announcement bar driven by payout readiness: prereq
      gap message when missing PayPal / tax / terms, $25 minimum message
      when balance is too low, green "ready" banner with Request Payment
      otherwise.
    - Orders-in-process and Ready-to-request sections render month groups
      with `itemCount` and `totalAmount` from the API.
    - Pending tab lists `status === requested` (and `processing`) payouts
      with a 3-step Submitted → Admin review → Processing timeline and a
      copy-reference action.
    - History tab supports search / status / date / sort filters, exports a
      CSV, downloads an invoice PDF per payout, and expands into line
      items.
14. Payout notification emails and in-app entries deep-link to
    `/vendor/insights/payouts`.

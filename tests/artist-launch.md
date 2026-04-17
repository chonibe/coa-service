# Artist Launch — Manual Test Plan

**Version:** 1.0.0
**Last Updated:** 2026-04-17
**Scope:** `/for-artists`, `/for-artists/apply`, `/login`, `/reset-password`,
`/vendor/welcome`, `/vendor/onboarding`, `/vendor/home`, `/vendor/insights`,
`/vendor/studio`, `/vendor/inbox`, `/vendor/profile`, `/vendor/signout`,
legacy `/vendor/dashboard/*` editor bridge.

Related docs:
- [`docs/features/artist-onboarding/README.md`](../docs/features/artist-onboarding/README.md)
- [`docs/features/vendor-login/README.md`](../docs/features/vendor-login/README.md)
- [`docs/features/vendor-dashboard/README.md`](../docs/features/vendor-dashboard/README.md)
- [`docs/COMMIT_LOGS/artist-launch-revamp-2026-04-17.md`](../docs/COMMIT_LOGS/artist-launch-revamp-2026-04-17.md)

---

## 1. Public welcome (`/for-artists`)

- [ ] Visiting `/for-artists` renders the editorial hero, value props, process,
      and CTAs without layout shift. No console errors.
- [ ] "Apply to join" links to `/for-artists/apply`.
- [ ] "Already an artist? Log in" links to `/login`.
- [ ] `/join-vendor` (legacy) 308-redirects to `/for-artists`.

## 2. Apply form (`/for-artists/apply`)

- [ ] Submitting valid data shows a success state and clears the form.
- [ ] Submitting the same email again within 24 hours shows a polite
      "already received" state, not a duplicate record. Verify via
      Supabase: `select count(*) from artist_applications where email = $1`.
- [ ] Submitting with an empty or malformed email surfaces an inline error
      and does not call the API.
- [ ] Support link in error / success copy opens a `mailto:` to
      `support@thestreetcollector.com`.
- [ ] Team notification email is received (or logged) per
      `sendEmail` configuration.

## 3. Login (`/login`)

- [ ] Visiting `/login` renders the editorial card, no gradients, no
      glassmorphism, no hidden Shopify button.
- [ ] Google OAuth flow completes and redirects:
  - New artist (no onboarding) → `/vendor/welcome`.
  - Returning artist (onboarding complete) → `/vendor/home`.
  - Admin → `/admin/dashboard`.
- [ ] Email/password login with invalid credentials shows an error that
      references `support@thestreetcollector.com`.
- [ ] Session-missing error on `/auth/callback` lands on
      `/login?error=session_missing&intent=vendor` (not `/vendor/login`).
- [ ] Visiting `/vendor/login?error=foo` preserves the query string in the
      redirect to `/login?intent=vendor&error=foo`.

## 4. Forgot / reset password (`/reset-password`)

- [ ] Triggering forgot-password from `/login` sends an email whose link
      lands on `/reset-password` (not 404).
- [ ] The page extracts the token from the URL hash, establishes the
      Supabase session, and allows a new password to be set.
- [ ] Submitting an empty / mismatched password shows inline validation.
- [ ] After a successful reset, user is redirected to `/login` with a
      success toast / state.

## 5. Welcome gate (`/vendor/welcome`)

- [ ] Brand-new artist (just approved, no `onboarding_completed`) lands here
      after login. Returning artists are redirected away to `/vendor/home`.
- [ ] The page renders inside the AppShell (bottom tab bar visible, no
      legacy sidebar chrome).
- [ ] CTA "Start setup" routes to `/vendor/onboarding`.

## 6. Onboarding wizard (`/vendor/onboarding`)

- [ ] Loading state shows a single quiet spinner on plain white — no
      gradients or glow effects.
- [ ] Each step renders with Impact typography and a quiet progress
      indicator.
- [ ] Auto-save indicator appears after edits.
- [ ] Completing the final step redirects to `/vendor/home` (not
      `/vendor/dashboard`).

## 7. Home (`/vendor/home`)

- [ ] Greeting shows the artist's first name.
- [ ] Pending payout hero shows an amount or an empty state; no "NaN" or
      "undefined".
- [ ] Metric strip range switcher (7d / 30d / 90d / YTD) updates the
      numbers and the sparkline. Changing range does not trigger a full
      page reload.
- [ ] Recent activity table shows recent line items (or a calm empty
      state when there are none).
- [ ] No double chrome: only ONE header (SlimHeader) and ONE bottom tab
      bar are visible. The gradient-purple sidebar background should not
      appear.
- [ ] Admin impersonation banner appears when impersonating.

## 8. Sales / Insights (`/vendor/insights`)

- [ ] Range switcher shows 7d / 30d / 90d / YTD.
- [ ] Revenue-over-time bar chart renders with the correct bars for the
      selected range.
- [ ] Recent line items table shows per-order details.
- [ ] "Export CSV" downloads a file with the currently visible rows.
- [ ] Payouts subpage renders the available / pending / held balances
      without 400 errors (the API should resolve the vendor from the
      session if `?vendorName` is missing).

## 9. Studio (`/vendor/studio`)

- [ ] When no artworks exist, the empty state reads "Your studio is
      empty" with a "+ Add an artwork" link to the creator.
- [ ] Filtering by a status with no matches shows a short "Nothing
      marked {status} right now." message instead of the old generic
      copy.

## 10. Inbox (`/vendor/inbox` and `/vendor/inbox/notifications`)

- [ ] No messages → calm empty state ("Your inbox" / "No messages yet.").
- [ ] Search with no matches → "No matches" empty state.
- [ ] No notifications → "All caught up" empty state (no giant
      `BellOff` icon).
- [ ] The SlimHeader bell routes to `/vendor/inbox` when clicked
      (the full inbox view — notifications live as a subtab there).

## 11. Profile (`/vendor/profile`)

- [ ] Four links visible: Edit public profile / Public preview /
      Account settings / Sign out. No duplicate "Payment Settings" or
      "Tax Information" stubs.
- [ ] "Edit public profile" deep-links to
      `/vendor/dashboard/profile?return=/vendor/profile`. The legacy
      editor shows a "← Back to my portal" link at the top.
- [ ] "Sign out" routes to `/vendor/signout`, which clears the Supabase
      session, removes the cached vendor name, and lands on `/login`.

## 12. Shell consolidation

- [ ] `/vendor/dashboard` (no subpath) redirects to `/vendor/home`.
- [ ] `/vendor/dashboard/products`, `/vendor/dashboard/media-library`,
      `/vendor/dashboard/series/create`, `/vendor/dashboard/messages`,
      and `/vendor/dashboard/help` continue to render with the legacy
      `SidebarLayout` (their editor UIs).
- [ ] Visiting `/vendor/home`, `/vendor/studio`, `/vendor/insights`,
      `/vendor/inbox`, `/vendor/profile`, or `/vendor/welcome` shows the
      AppShell chrome only. No gradient background, no legacy sidebar.
- [ ] `/vendor/onboarding` and `/vendor/signout` render their own
      full-page frames with no sidebar and no AppShell.

## 12a. Bottom nav + quick actions

- [ ] Vendor bottom tab bar shows **Home / Studio / Create / Insights /
      Profile** (Profile replaces Inbox as the fifth tab).
- [ ] Tapping **Profile** opens `/vendor/profile`.
- [ ] Tapping the header bell opens `/vendor/inbox`.
- [ ] Home page renders a **Quick actions** row: Add artwork, Add series,
      Edit profile, Request payout. Each link opens the correct page
      (`/vendor/dashboard/products/create`, `/vendor/dashboard/series/create`,
      `/vendor/profile`, `/vendor/insights/payouts`).

## 12b. Studio affordances (NFC / unlock content)

- [ ] Every artwork card in `/vendor/studio` shows a black **Experience**
      chip and a grey **Edit** chip (no hover required).
- [ ] **Experience** opens `/artwork-editor/:productId`; its header shows
      the "Artwork experience · NFC & unlock content" subtitle and a
      **Back to Studio** button that returns to `/vendor/studio`.
- [ ] **Edit** opens `/vendor/dashboard/products/edit/:id`.
- [ ] `/vendor/studio/series` empty state shows a **Create series** button
      that opens `/vendor/dashboard/series/create`. The create form has a
      **Back to Studio** breadcrumb and its Cancel button returns to
      `/vendor/studio/series`.
- [ ] `/vendor/dashboard/products/create` shows the same **Back to Studio**
      breadcrumb and both Complete and Cancel return to `/vendor/studio`.
- [ ] Each series card's "Edit unlock experience" link opens the series'
      artwork page editor.

## 12c. Payouts — `/vendor/insights/payouts`

- [ ] Sub-tabs within the page: **Overview / Pending / History**.
- [ ] **Overview — announcement bar**
    - [ ] With missing PayPal email / tax / terms, an amber bar explains
          what is missing and links to Payment settings.
    - [ ] With all prereqs but available balance < $25, a blue bar
          explains the $25 minimum.
    - [ ] With prereqs + balance ≥ $25, a green bar shows "You're ready"
          and a **Request payment** button; clicking it POSTs to
          `/api/vendor/payouts/redeem` and advances to the Pending tab.
- [ ] **Overview — balance strip** shows Available / Pending / Held from
      `/api/vendors/balance`.
- [ ] **Overview — Orders in process** lists unfulfilled months from
      `pending-items.unfulfilledGroupedByMonth` with correct item counts
      and totals. Expanding a month shows the individual line items.
- [ ] **Overview — Ready to request** lists fulfilled months from
      `pending-items.groupedByMonth` with correct totals.
- [ ] **Pending** lists `status=requested` (and `processing`) payouts
      with a 3-step Submitted → Admin review → Processing timeline and a
      copy-to-clipboard reference action.
- [ ] **History** supports:
    - [ ] search by reference / invoice / amount,
    - [ ] filter by status (All / Reviewing / Processing / Paid /
          Rejected / Failed),
    - [ ] filter by date (All / 30d / 90d / This year / Last 12 months),
    - [ ] sort by date / amount,
    - [ ] **CSV export** of the filtered set,
    - [ ] **Invoice PDF** download per payout via
          `/api/vendors/payouts/:id/invoice`,
    - [ ] expandable rows that reveal per-line-item amounts.
- [ ] Payout emails (approved / pending reminder / rejected / refund
      deduction) deep-link to `/vendor/insights/payouts`.

## 13. Regression sweep

- [ ] Vendor login → logout → login again does not produce a
      "choose account" loop.
- [ ] Direct visit to `/vendor/home` without a session redirects to
      `/login`.
- [ ] Direct visit to `/vendor/home` while marked `pending` or
      `disabled` redirects to `/vendor/access-pending` or
      `/vendor/access-denied` respectively.
- [ ] `next build` succeeds locally with no new TypeScript errors
      relative to `main`.

---

## Sign-off

- [ ] QA owner: __________________________   Date: ____________
- [ ] Engineering owner: _________________    Date: ____________

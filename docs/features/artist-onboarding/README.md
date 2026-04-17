# Artist Onboarding (Public Welcome → Apply → Login → Onboarding Wizard)

**Version:** 1.1.0
**Last Updated:** 2026-04-17

## Feature Overview & Purpose
- Give prospective artists a single, editorial entry point (`/for-artists`) that explains
  the program, sets expectations, and points to either "Apply" or "Log in" based on
  where they are in the journey.
- Capture new applications without creating Supabase accounts (no auto-login loops)
  through `/for-artists/apply`, persisting leads in `artist_applications` and
  notifying the team by email.
- Route approved artists through the same `/login` screen used by everyone else;
  post-login they are either sent to the welcome/onboarding wizard (first time)
  or straight to their app-shell home (returning).
- Keep the onboarding wizard itself calm and editorial — no SaaS gradients,
  single-column Impact typography — and finish with a redirect to `/vendor/home`,
  not the legacy `/vendor/dashboard`.

## Technical Implementation Details
- Public welcome page: [`app/for-artists/page.tsx`](../../../app/for-artists/page.tsx)
- Inline application form: [`app/for-artists/apply/page.tsx`](../../../app/for-artists/apply/page.tsx)
- Application API: [`app/api/artists/apply/route.ts`](../../../app/api/artists/apply/route.ts)
- Shared login client (editorial restyle): [`app/login/login-client.tsx`](../../../app/login/login-client.tsx)
- Password reset entry point: [`app/reset-password/page.tsx`](../../../app/reset-password/page.tsx)
- Vendor welcome (first-login gate): [`app/vendor/(app)/welcome/page.tsx`](../../../app/vendor/(app)/welcome/page.tsx)
- Calm onboarding wizard: [`app/vendor/onboarding/page.tsx`](../../../app/vendor/onboarding/page.tsx),
  [`app/vendor/components/onboarding-wizard.tsx`](../../../app/vendor/components/onboarding-wizard.tsx)
- Post-login routing: [`app/vendor/(app)/home/page.tsx`](../../../app/vendor/(app)/home/page.tsx)
  (redirects non-onboarded vendors to `/vendor/welcome`)
- Legacy alias: [`next.config.js`](../../../next.config.js) redirects
  `/join-vendor` → `/for-artists`
- Support constants: [`lib/constants/support.ts`](../../../lib/constants/support.ts)

## API Endpoints & Usage
| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/artists/apply` | POST | Accept a new artist application, de-duplicate within 24h, insert into `artist_applications`, and email the team. | Public |

### Request Shape
```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "instagram": "@ada_art",
  "portfolio_url": "https://ada.example.com",
  "bio": "Short paragraph about the practice."
}
```

## Database Schema Changes
- [`supabase/migrations/20260417120000_artist_applications.sql`](../../../supabase/migrations/20260417120000_artist_applications.sql)
  - Creates `public.artist_applications` with `status` (`pending` / `approved` / `rejected`).
  - RLS: public `INSERT` allowed; `SELECT`/`UPDATE` restricted to users with an
    active `admin` role in `user_roles`.

## UI/UX Considerations
- `/for-artists` uses `SectionWrapper` + `Container` from the Impact design system,
  no gradients, editorial serif/sans pairing.
- `/for-artists/apply` is a calm single-column form with explicit success/error states
  and a `support@thestreetcollector.com` fallback link.
- `/login` was restyled to the same aesthetic; the hidden Shopify button and
  SaaS glassmorphism have been removed.
- First-login artists land on `/vendor/welcome` inside the AppShell with a one-button
  CTA into the wizard; returning artists skip straight to `/vendor/home`.
- The onboarding wizard itself now renders on plain white, with Impact typography,
  a quiet progress step indicator, and no animated gradients.
- Every post-auth path now lands on `/vendor/home`, removing the `/vendor/dashboard`
  vs `/vendor/home` split that previously caused flicker and back-button loops.

## Testing Requirements
- Manual test plan: [`tests/artist-launch.md`](../../../tests/artist-launch.md)
- Covered flows:
  - Cold visitor hits `/for-artists` → clicks Apply → submits form → success view.
  - Duplicate submission within 24h returns a polite "already received" response.
  - `/join-vendor` legacy URL 308s to `/for-artists`.
  - `/login` with Google succeeds and lands on `/vendor/welcome` for new artists,
    `/vendor/home` for returning ones.
  - Password reset email routes to `/reset-password` and updates the password.

## Deployment Considerations
- Requires the `artist_applications` migration to be applied before the API route
  works in production. Apply via Supabase CLI or MCP.
- Vercel production deploy after merge (see `.cursorrules`).
- No environment variable changes.

## Known Limitations
- Team notification is sent as plain email; no backoffice triage UI yet.
- Applications are not currently linked back to a Supabase auth user when the
  artist signs up — this is intentional for v1 (humans do the matching) but should
  be automated later.

## Future Improvements
- Admin triage view at `/admin/applications`.
- Automatic `user_roles` upgrade when an application is approved.
- Optional portfolio upload (images) instead of a link-only submission.

## Change Log
- 2026-04-17: **v1.1.0** — restored profile/NFC/payout/create affordances
  in the new AppShell so the onboarding arc actually terminates on a
  discoverable product surface.
  - Bottom tab bar now shows Home / Studio / Create / Insights / Profile
    (Profile replaces Inbox; notifications live behind the header bell at
    `/vendor/inbox`) —
    [`components/app-shell/BottomTabBar.tsx`](../../../components/app-shell/BottomTabBar.tsx),
    [`app/vendor/(app)/layout.tsx`](../../../app/vendor/(app)/layout.tsx).
  - Home page adds a Quick actions strip: Add artwork, Add series, Edit
    profile, Request payout —
    [`app/vendor/(app)/home/page.tsx`](../../../app/vendor/(app)/home/page.tsx).
  - Studio artwork cards surface persistent **Experience** (NFC / unlock
    content) and **Edit** chips; series empty state offers a Create
    series CTA and renames the template link to "Edit unlock experience" —
    [`app/vendor/(app)/studio/page.tsx`](../../../app/vendor/(app)/studio/page.tsx),
    [`app/vendor/(app)/studio/series/page.tsx`](../../../app/vendor/(app)/studio/series/page.tsx).
  - Artwork editor gains a Back-to-Studio affordance and an explicit
    "Artwork experience · NFC & unlock content" subtitle —
    [`app/artwork-editor/[productId]/page.tsx`](../../../app/artwork-editor/[productId]/page.tsx).
  - Artwork + series create pages are wrapped in a Back-to-Studio
    breadcrumb and their Cancel targets were fixed —
    [`app/vendor/dashboard/products/create/page.tsx`](../../../app/vendor/dashboard/products/create/page.tsx),
    [`app/vendor/dashboard/series/create/page.tsx`](../../../app/vendor/dashboard/series/create/page.tsx).
  - Payouts parity: `/vendor/insights/payouts` now matches the legacy
    dashboard in capability (Overview / Pending / History, readiness
    announcement, month groups, filters, CSV, invoice PDF) — see
    [`docs/features/vendor-payouts/README.md`](../vendor-payouts/README.md)
    v2.3.0.

- 2026-04-17: **v1.0.0** — Initial release. Public welcome page, apply form
  + API + `artist_applications` table, editorial `/login`,
  `/reset-password`, `/vendor/welcome` first-login gate, calm wizard
  chrome, and unified post-auth redirects on `/vendor/home`.

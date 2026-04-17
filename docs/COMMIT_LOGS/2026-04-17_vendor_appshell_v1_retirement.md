# 2026-04-17 — Vendor AppShell Phase 1.5: retire v1 hand-offs

## Intent
Close the "v1 leak" the user called out:
> "we have links sending to the old vendor dashboard instead of new/redone
> pages to fill in for those pages. we shouldn't be sent back to the vendor
> dashboard pages from v1"

Every clickable surface rendered inside the AppShell (`app/vendor/(app)/**`)
must stay inside the AppShell. The legacy `/vendor/dashboard/**` surface is
retired: most routes become redirect shims; the two giant editors we still
depend on (media library, profile editor) are wrapped by AppShell-native pages
and retain their original location until a dedicated component-relocation
sprint can move them under `components/vendor/**`.

## Scope of change
Phase 1.5 E–N of the plan `restore-profile-nfc-payout-affordances`:
- E–K — create AppShell-native routes that wrap legacy editors
- L    — swap every outbound v1 link inside `(app)` to the new routes
- M    — convert retired legacy pages to redirect shims
- N    — add `/vendor/legacy` soft-landing and retarget the feature-flag
         fallback
- O    — add ESLint guard against regressions

Phase 0 (payouts config + synthetic-pending removal + settings anchors) was
also finalized in the same pass — see companion commit log below.

## New AppShell-native routes

| Route | Behavior |
|---|---|
| `/vendor/studio/artworks/new` | Wraps `ShopifyStyleArtworkForm`. Replaces `/vendor/dashboard/products/create`. |
| `/vendor/studio/artworks/[id]/edit` | Wraps `ShopifyStyleArtworkForm` with the existing submission loader. Replaces `/vendor/dashboard/products/edit/[id]`. |
| `/vendor/studio/artworks/[id]/experience` | Client-side redirect to `/artwork-editor/[id]`. Replaces `/vendor/dashboard/artwork-pages/[productId]`. |
| `/vendor/studio/series/new` | Wraps `ShopifyStyleSeriesForm`. Replaces `/vendor/dashboard/series/create`. |
| `/vendor/studio/series/[id]` | AppShell-native series detail & in-page editor. Replaces `/vendor/dashboard/series/[id]`. |
| `/vendor/studio/series/[id]/experience` | Wraps the legacy `SeriesTemplateEditor` via optional `seriesId` prop. Replaces `/vendor/dashboard/artwork-pages/series/[seriesId]`. |
| `/vendor/studio/media/upload` | Wraps the legacy media library page so uploads no longer leave the AppShell. |
| `/vendor/profile/edit` | Wraps the legacy profile editor (still 1800+ lines, pending extraction). Hash fragments `#contact`, `#payment`, `#tax`, `#account` are preserved. |
| `/vendor/legacy` | Soft-landing used when `NEXT_PUBLIC_APP_SHELL_ENABLED=false`. |

## Retired legacy pages (now redirect shims)

| Legacy route | Redirects to |
|---|---|
| `/vendor/dashboard/products` | `/vendor/studio` |
| `/vendor/dashboard/products/create` | `/vendor/studio/artworks/new` |
| `/vendor/dashboard/products/edit/[id]` | `/vendor/studio/artworks/[id]/edit` |
| `/vendor/dashboard/series` | `/vendor/studio/series` |
| `/vendor/dashboard/series/create` | `/vendor/studio/series/new` |
| `/vendor/dashboard/series/[id]` | `/vendor/studio/series/[id]` |

Legacy pages we intentionally **keep** (pending component relocation):
- `/vendor/dashboard/media-library/page.tsx` — re-rendered by `/vendor/studio/media/upload`.
- `/vendor/dashboard/profile/page.tsx` — re-rendered by `/vendor/profile/edit`.
- `/vendor/dashboard/artwork-pages/series/[seriesId]/page.tsx` — re-rendered by `/vendor/studio/series/[id]/experience` (component now accepts `seriesId` prop + falls back to `useParams()`).

## AppShell link swaps
Every `href` / `router.push(...)` inside `app/vendor/(app)/**` that previously
pointed at `/vendor/dashboard/**` was rewritten to the new AppShell route.
Touched files:
- `app/vendor/(app)/layout.tsx` (Create action sheet: artwork / series / media upload)
- `app/vendor/(app)/home/page.tsx` (Quick actions)
- `app/vendor/(app)/studio/page.tsx` (new/edit/experience chips, comments)
- `app/vendor/(app)/studio/series/page.tsx` (list items, create button, edit-experience link, comments)
- `app/vendor/(app)/studio/media/page.tsx` (Upload button → `<Link>`)
- `app/vendor/(app)/profile/edit/page.tsx` (now renders the legacy editor in place of the redirect stub)

Wrapped legacy components with stray v1 links were also patched so the
wrappers don't leak out of the AppShell on form completion:
- `app/vendor/dashboard/products/create/components/product-wizard.tsx` → `/vendor/studio`
- `app/vendor/dashboard/products/create/components/series-step.tsx` (2 places) → `/vendor/studio/series`
- `app/vendor/dashboard/series/components/FloatingCreateButton.tsx` → `/vendor/studio/artworks/new`
- `app/vendor/dashboard/artwork-pages/components/UnifiedContentView.tsx` → `/vendor/profile/edit`
- `app/vendor/dashboard/artwork-pages/components/UnlockRelationshipVisualizer.tsx` → `/vendor/studio/series/[id]`
- `app/vendor/dashboard/artwork-pages/series/[seriesId]/page.tsx` → `/vendor/studio/series/[id]`

## Guard rule
`.eslintrc.js` gains an `overrides` block for `app/vendor/(app)/**/*.{ts,tsx}`
using `no-restricted-syntax`:
- literal strings matching `^/vendor/dashboard(/|$|\?|#)` → error
- template elements with the same prefix → error

Imports (`import … from "@/app/vendor/dashboard/…"`) are still allowed; the
rule only fires on string paths that would be used as an `href` / `router.push`
target. Escape hatch documented inline in the rule.

## Verification checklist
- [x] `rg "(href=|router\\.(push|replace)\\().*?/vendor/dashboard" app/vendor/(app)` → no matches
- [x] `npx eslint "app/vendor/(app)/**/*.{ts,tsx}"` → 0 errors (19 pre-existing warnings, unrelated)
- [x] New AppShell routes compile and lint clean
- [x] Legacy redirect shims compile and lint clean
- [x] Wrapped legacy components still resolve their imports (components folders untouched)
- [ ] Manual smoke test in preview deploy — **pending** (`vercel --prod --yes` after commit)
- [ ] Playwright no-v1-leaks test — **deferred to Phase 1.5 P**

## Known follow-ups (still in the backlog)
- Phase 1.5 A–D — physically relocate the wrapped components into
  `components/vendor/**`. Right now the AppShell still *imports* from
  `@/app/vendor/dashboard/**`; we just don't *navigate* there.
- Phase 1.5 P — Playwright regression that fails if any `(app)` route produces
  an anchor with `href^="/vendor/dashboard"`.
- Phase 1 — payout cancel / retry / rejection-failure surfacing and the
  `payouts_cancel_fields` migration.

## Related files (for git archaeology)
- Plan: `restore-profile-nfc-payout-affordances_1d58abb1.plan.md`
- Previous log: `docs/COMMIT_LOGS/2026-04-17_vendor_appshell_phase0.md` (if present)

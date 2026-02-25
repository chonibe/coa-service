# Commit Log: App Shell Gamification & Revert Safety

**Date:** 2026-02-15
**Branch:** `feature/app-shell-redesign`
**Commits:** `440fd5bfd`, `2a39de9cf`
**Deployed to:** https://app.thestreetcollector.com

## Summary

Added revert safety (feature flag), gamification elements, shop integration, and activity feed to the mobile-first app shell for the collector experience.

## Changes Checklist

### Phase 1 — Feature Flag (Revert Safety)
- [x] Added `NEXT_PUBLIC_APP_SHELL_ENABLED` env var to `.env.local` — [`.env.local`](.env.local)
- [x] Gated collector `(app)` layout with feature flag redirect — [`app/collector/(app)/layout.tsx`](../../app/collector/(app)/layout.tsx)
- [x] Gated vendor `(app)` layout with feature flag redirect — [`app/vendor/(app)/layout.tsx`](../../app/vendor/(app)/layout.tsx)

### Phase 2 — Shop-Connected Home
- [x] Wired real shop products (from `/api/shop/products`) into Collector Home tab — [`app/collector/(app)/home/page.tsx`](../../app/collector/(app)/home/page.tsx)
- [x] Added recent purchases horizontal scroll with NFC authentication badges
- [x] Added persistent level/XP status bar with credit balance in maroon bar

### Phase 3 — Gamification Components
- [x] Created `ProgressRing` component (SVG circular progress indicator) — [`components/app-shell/ProgressRing.tsx`](../../components/app-shell/ProgressRing.tsx)
- [x] Added credit balance `Gem` badge to `SlimHeader` (persistent peach pill) — [`components/app-shell/SlimHeader.tsx`](../../components/app-shell/SlimHeader.tsx)
- [x] Built Collector Profile page with:
  - Ink-O-Gatchi avatar placeholder with level ring
  - Level/XP progress bar
  - Credits balance display
  - Stats grid (Artworks, Verified, Artists, Series)
  - Perk progress cards (Free Proof Print, Free Lamp) — [`app/collector/(app)/profile/page.tsx`](../../app/collector/(app)/profile/page.tsx)
- [x] Built Credits & Subscriptions deep page — [`app/collector/(app)/profile/credits/page.tsx`](../../app/collector/(app)/profile/credits/page.tsx)
- [x] Added series completion progress rings to Collection > Series sub-tab — [`app/collector/(app)/collection/series/page.tsx`](../../app/collector/(app)/collection/series/page.tsx)
- [x] Created Certifications, Hidden Content, Settings stub pages under profile

### Phase 4 — Activity Feed
- [x] Created `/api/collector/activity` endpoint aggregating purchases, NFC scans, certificates, credit events — [`app/api/collector/activity/route.ts`](../../app/api/collector/activity/route.ts)
- [x] Built `ActivityFeed` component with event type icons, relative timestamps, action buttons — [`components/app-shell/ActivityFeed.tsx`](../../components/app-shell/ActivityFeed.tsx)
- [x] Wired activity feed into Collector Inbox tab — [`app/collector/(app)/inbox/page.tsx`](../../app/collector/(app)/inbox/page.tsx)
- [x] Wired unread activity count (last 24h) to Inbox tab badge in BottomTabBar
- [x] Updated barrel exports in `components/app-shell/index.ts`

### Build Fix
- [x] Renamed old `/collector/profile/page.tsx` → `page.old.tsx` to resolve Next.js parallel route conflict

### Dev Preview
- [x] Updated dev preview page with mock gamification data (profile, activity views) — [`app/dev/app-preview/page.tsx`](../../app/dev/app-preview/page.tsx)

## How to Revert

Set `NEXT_PUBLIC_APP_SHELL_ENABLED="false"` in `.env.local` (or Vercel env vars). Both collector and vendor `(app)` layouts will redirect to the old `/collector/dashboard` and `/vendor/dashboard` respectively.

## Files Changed

| File | Action |
|------|--------|
| `.env.local` | Modified — added feature flag |
| `components/app-shell/ProgressRing.tsx` | **New** — circular progress component |
| `components/app-shell/ActivityFeed.tsx` | **New** — activity feed component |
| `components/app-shell/SlimHeader.tsx` | Modified — added credit badge |
| `components/app-shell/index.ts` | Modified — added exports |
| `app/collector/(app)/layout.tsx` | Modified — feature flag + credits + inbox badge |
| `app/vendor/(app)/layout.tsx` | Modified — feature flag |
| `app/collector/(app)/home/page.tsx` | Modified — shop products + gamification bar |
| `app/collector/(app)/inbox/page.tsx` | Modified — activity feed |
| `app/collector/(app)/collection/series/page.tsx` | Modified — progress rings |
| `app/collector/(app)/profile/page.tsx` | **New** — gamified profile |
| `app/collector/(app)/profile/credits/page.tsx` | **New** — credits deep page |
| `app/collector/(app)/profile/settings/page.tsx` | **New** — settings stub |
| `app/collector/(app)/profile/certifications/page.tsx` | **New** — certifications stub |
| `app/collector/(app)/profile/hidden-content/page.tsx` | **New** — hidden content stub |
| `app/api/collector/activity/route.ts` | **New** — activity API |
| `app/dev/app-preview/page.tsx` | Modified — gamification preview |
| `app/collector/profile/page.old.tsx` | Renamed from page.tsx |

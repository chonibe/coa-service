# Commit log: Artist toolbar light mode fix

**Commit:** `dcca9dd3e`  
**Date:** 2026-06-26  
**Branch:** `main`

## Summary

Fixed invisible tab labels (Bio / Works / Exhibitions & Articles) in the embedded artist profile on the experience page when light mode is active.

## Root cause

`.tabsBar` in `artist-profile.module.css` used a hardcoded dark background (`rgba(15, 14, 14, 0.97)`) while tab text already followed `--experience-text` / `--experience-text-muted` tokens — dark text on a dark bar in light mode.

## Changes

- [x] [`app/(store)/shop/artists/[slug]/artist-profile.module.css`](../../app/(store)/shop/artists/[slug]/artist-profile.module.css) — toolbar, nav scroll, and active tab use `--experience-surface` and `--experience-highlight`
- [x] [`app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx`](../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx) — placeholder portrait gradient uses experience surface/cta tokens
- [x] Embedded Instagram stats card background uses `--experience-surface-2`

## Verification

- [x] `npm run lint:theme-tokens` passed

## Deployment

- Production deploy via `vercel --prod --yes` after push

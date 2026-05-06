# Commit log — Experience V3 slideout + hero toggle (branch `cursor/experience-v3-collection-slideout-f458`)

**Date:** 2026-05-06

## Summary

Adds `/shop/experience-v3` with a collapsible artwork rail, Splie vs gallery hero toggle with session-backed default, and split interactions: **card selects preview**, **`+` only updates cart**.

## Checklist

- [x] [`app/(store)/shop/experience-v3/page.tsx`](../../app/(store)/shop/experience-v3/page.tsx) — route + SSR product bundle  
- [x] [`app/(store)/shop/experience-v3/layout.tsx`](../../app/(store)/shop/experience-v3/layout.tsx) — experience providers + slideout chrome  
- [x] [`app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx`](../../app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx) — cart / pricing / UI composition  
- [x] [`app/(store)/shop/experience-v3/components/ExperienceV3HeroMedia.tsx`](../../app/(store)/shop/experience-v3/components/ExperienceV3HeroMedia.tsx) — Spline vs gallery + control row  
- [x] [`app/(store)/shop/experience-v3/components/ExperienceV3CollectionSlideout.tsx`](../../app/(store)/shop/experience-v3/components/ExperienceV3CollectionSlideout.tsx) — season tabs + card vs + split  
- [x] [`lib/shop/experience-v3-main-media.ts`](../../lib/shop/experience-v3-main-media.ts) — `sessionStorage` mode  
- [x] [`lib/seo/experience-metadata.ts`](../../lib/seo/experience-metadata.ts) — metadata path union  
- [x] [`lib/shop/collector-store-shell.ts`](../../lib/shop/collector-store-shell.ts) — static segment allowlist  
- [x] [`docs/features/experience-v3/README.md`](../../docs/features/experience-v3/README.md) — feature README  

## Manual verification notes

Perform on deploy: `/shop/experience-v3`, dark theme hero + slideout parity; rapid **card** / **+** interaction does not regress hero when using **+** only.

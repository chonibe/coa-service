# Commit log: Experience reel video playback diagnostics and fallbacks

**Date:** 2026-04-07

## Summary

Implements the **“Why the experience reel video may not play”** plan on [`ExperienceReelGalleryVideo`](../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx): structured `console.warn` on media errors and failed `play()`, **`onCanPlay`** as well as **`onLoadedData`** for muted autoplay, user-visible **`ReelVideoUnavailable`** on progressive load errors, **no raw m3u8** assigned to `<video>` when hls.js is missing or after a fatal HLS error (message suggests Safari / connection), and **QuickTime/MOV-style URLs** short-circuited when `video/quicktime` is not reported as playable.

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx`](../../app/(store)/shop/experience-v2/components/ProductStandaloneVideoEmbed.tsx) — `logReelVideoMediaError`, `warnReelPlayFailed`, `ReelGalleryProgressiveVideo` (`onError`, `onCanPlay`, load error UI), `ReelGalleryHlsVideo` (fatal HLS / unsupported hls.js → unavailable; `onError` / `onCanPlay`), `ExperienceReelGalleryVideo` (MOV / QuickTime heuristic before progressive).

## Verification

- [ ] DevTools **Network**: after defer, chosen URL returns **200** and bytes for a known product video.
- [ ] **Chrome**: HLS product — if hls.js fails, user sees unavailable message (no silent 0:00).
- [ ] **Chrome**: MOV-only URL (if test product exists) — unavailable message instead of dead controls.
- [ ] **Safari**: HLS and QuickTime paths still play when supported.

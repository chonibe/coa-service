# Commit context: Meet the Street Lamp slideshow synced to video length (2026-03-29)

## Checklist

- [x] [`MeetTheStreetLamp.tsx`](../../app/(store)/shop/street-collector/MeetTheStreetLamp.tsx) — `loop={false}`; progress from `onTimeUpdate`; advance on `onEnded`; ~8s timer fallback if duration not finite.
- [x] [`LazyVideo.tsx`](../../components/LazyVideo.tsx) — Optional **`loop`** prop (default `true`).

## Tests

- [ ] Desktop + mobile: confirm bar tracks playback and slide changes when clip ends (no mid-clip loop).

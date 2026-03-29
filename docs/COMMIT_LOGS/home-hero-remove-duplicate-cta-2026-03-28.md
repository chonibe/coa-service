# Commit context: Remove duplicate “Start your collection” from home hero (2026-03-28)

## Checklist

- [x] [`app/(store)/shop/street-collector/page.tsx`](../../app/(store)/shop/street-collector/page.tsx) — Stopped passing `primaryCta` into [`MeetTheStreetLamp`](../../app/(store)/shop/street-collector/MeetTheStreetLamp.tsx). Desktop [`DesktopTopBar`](../../app/(store)/shop/street-collector/page.tsx) and mobile sticky bottom CTA unchanged.
- [x] [`app/(store)/shop/street-collector/README.md`](../../app/(store)/shop/street-collector/README.md) — CTA placement + version note.

## Notes

Root `/` re-exports this page. Trust microcopy under the lamp still renders when `trustMicroItems` is set.

---
title: "Giveaway Roulette Wheel"
type: concept
tags: [feature, giveaway, instagram, gsap, animation]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-giveaway]
---

# Giveaway Roulette Wheel

The Giveaway Roulette Wheel is a branded tool for running Instagram-based giveaways: paste @mentions, spin an animated wheel, and surface a winner (plus a co-winner from tagged accounts).

## Definition

The tool lives at `/giveaway` (admin-facing). Admins paste raw Instagram comment text; the API parses @mentions, builds a weighted entry list (each NFC tag = one entry), and returns participants. The frontend spins a GSAP-animated circular wheel and reveals the winner. Both the winner and the tagged person (the co-winner) win the prize. Results are persisted to Supabase.

## Key Claims

1. Three-step workflow: (1) paste Instagram comments and parse → (2) spin wheel → (3) view winner with confetti.
2. Entry weighting: each NFC tag = one entry; multiple tags = multiple chances.
3. Co-winner: when a winner tags another user, both win.
4. Wheel animation uses GSAP.
5. API: `POST /api/giveaway/parse` (regex @mention extraction) + `POST /api/giveaway/save` (persist to Supabase).
6. Results stored: giveaway name, entries list, winner data.
7. UI uses Street Collector "Impact" branding theme with confetti celebration.
8. Fully implemented and manually tested (status: ✅ PRODUCTION READY).

## Evidence

- [[2026-04-14-giveaway]] — full implementation summary, component list, API endpoints

## Tensions

- Parsing is regex-based on pasted text — format changes in Instagram comments could break extraction.
- NFC tag count weighting assumes tags are tracked in the system; if not, all entries are equal.

## Related

- [[the-street-collector]]
- [[nfc-authentication]]
- [[supabase]]

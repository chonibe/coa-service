---
title: "NFC Flow Consolidation"
type: source
date: 2026-04-17
tags: [nfc, consolidation, refactor, collector, artist]
---

# 2026-04-17 — NFC Flow Consolidation

## Context

Prior to this change the NFC ecosystem had three competing UI surfaces (`/collector/artwork/[id]`, `/nfc/unlock`, `/pages/authenticate`), three redirect/entry routes (`/api/nfc-tags/redirect`, `/auth/nfc/[token]`, the two pages above), two scan UIs (`NFCAuthSheet`, `NFCPairingWizard`), and inconsistent `product_benefits` visibility rules. Artists could save content and it would silently not appear to collectors because the vendor POST defaulted to `is_published: false`.

## Decisions

1. **Single landing page.** `/collector/artwork/[lineItemId]` is the only surface for the authenticated experience. All other paths redirect into it.
2. **Single redirect endpoint.** `/api/nfc-tags/redirect` resolves `tagId`/`token` → `line_item_id`, logs the scan, and decides which state query to attach based on session vs ownership.
3. **Four page states** driven by search params: `?scan=pending`, `?preview=true`, `?claim=pending`, `?authenticated=true`.
4. **Single visibility rule.** `product_benefits.is_active && is_published` governs what collectors see, everywhere.
5. **Single scan UI.** `NFCAuthSheet` is canonical. `NFCPairingWizard` deleted.

## Implementation Summary

- `app/api/nfc-tags/redirect/route.ts` — rewritten as canonical router.
- `app/pages/authenticate/page.tsx`, `app/nfc/unlock/page.tsx` — converted to redirects.
- `app/auth/nfc/[token]/route.ts` — converted to thin 308.
- `app/api/collector/artwork/[id]/nfc-url/route.ts` — emits canonical URL format.
- `app/collector/artwork/[id]/page.tsx` — reads four states, auto-opens `NFCAuthSheet` on claim-pending / scan-pending.
- `app/api/vendor/artwork-pages/[productId]/route.ts` — POST defaults `is_published: true` + `is_active: true`. PUT allows `is_active` updates.
- `app/api/vendor/artwork-pages/[productId]/apply-template/route.ts`, `.../copy-from/route.ts` — template and copy inserts now publish by default.
- `components/ui/nfc-pairing-wizard.tsx` — deleted.

## Links

- [[nfc-authentication]]
- [[conditional-artwork-access]]
- [[collector-dashboard]]
- `docs/features/nfc-authentication/README.md`
- `docs/features/artwork-editor/README.md`
- `docs/features/collector-experience/README.md`

---
title: "Certificate of Authenticity (COA)"
type: concept
tags: [core-feature, authentication, nfc, artwork]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-readme, 2026-04-14-system-ssot, 2026-04-14-api-documentation]
---

# Certificate of Authenticity (COA)

A COA is a digital credential issued per artwork edition that verifies ownership and provenance, delivered via a postcard-style UI and paired to a physical NFC tag.

## Definition

Each artwork edition sold through The Street Collector receives a unique Certificate of Authenticity stored in Supabase, rendered as an interactive postcard with a 3:2 aspect ratio and 15° mouse-tilt animation. The certificate is accessible via a URL written to an NFC tag embedded in the physical artwork. Scanning the NFC tag with a supported browser (Chrome, Edge, Opera) opens the certificate and triggers the claim/verification flow.

## Key Claims

1. Each COA is tied to a specific `order_line_items_v2` record and edition number within a series.
2. The certificate URL is written to the NFC tag using the Web NFC API (`NDEFReader.write`).
3. Certificate generation targets < 100ms open time.
4. The postcard design uses a fixed 3:2 aspect ratio — changing this breaks the visual design.
5. Mouse tilt intensity is fixed at ±15° on both axes (tested values — do not adjust).
6. COAs are the central product of The Street Collector — every other feature supports their issuance, verification, or management.

## Evidence

- [[2026-04-14-system-ssot]] — postcard design specs, NFC write pattern, performance targets
- [[2026-04-14-readme]] — NFC pairing overview, supported browsers
- [[2026-04-14-api-documentation]] — certificate endpoint patterns

## Tensions

- NFC write requires Chrome/Edge/Opera — Safari users cannot complete the NFC pairing flow, creating a UX gap.
- Physical NFC tags are a supply-chain dependency outside the software system.

## Related

- [[nfc-authentication]]
- [[edition-numbering-system]]
- [[collector-dashboard]]
- [[supabase]]

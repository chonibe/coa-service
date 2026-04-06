# Commit log: Lamp ArtworkDetail — unified includes + specs panel

**Date:** 2026-04-06

## Checklist

- [x] [`app/(store)/shop/experience-v2/components/LampIncludesSpecsPanel.tsx`](../../app/(store)/shop/experience-v2/components/LampIncludesSpecsPanel.tsx) — `LampIncludesSpecsPanel` (`sticky` | `inline`) + `LampDescriptionSection`; single bordered panel for **In the box** + **Specifications**; icon rows for included items; `sticky` variant: `max-h-[min(40vh,320px)]`, `overscroll-y-contain`, touch-friendly scroll.
- [x] [`app/(store)/shop/experience-v2/components/ArtworkDetail.tsx`](../../app/(store)/shop/experience-v2/components/ArtworkDetail.tsx) — Mobile: **Product details** only in main scroll under hero; combined panel in **sticky bar under title** (before scarcity). Desktop / inline: `LampFlatDetailsSections` uses description + unified **inline** panel.
- [x] [`docs/features/experience-v2/README.md`](../../docs/features/experience-v2/README.md) — ArtworkDetail lamp layout + changelog line.
- [x] This file — commit context.

## Notes

- Bundles / lamp rows keyed off `productIncludes` continue to use the same data props from [`Configurator`](../../app/(store)/shop/experience-v2/components/Configurator.tsx) / clients; no API change.

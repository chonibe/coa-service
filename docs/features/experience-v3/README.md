# Experience V3 — collection slideout + hero media toggle

**Route:** `/shop/experience-v3`  
**Version:** 1.0.0 (initial)

## Overview

Experience V3 is a desktop-oriented layout variant of the Street Lamp artwork flow: **main hero → copy column → collapsible collection rail**. Selecting an artwork card **loads the preview on the left** without changing checkout. The **purple +** control **only updates the cart** (and persisted lamp-slot assignment sync), matching the sticky selector behavior requested for this surface.

Gallery vs **3D Spline** is chosen with the **thumbnail control row below the hero** (`RotateCw`, `Images`, thumbnail). The last chosen mode persists in **`sessionStorage`** (`sc-experience-v3-main-media-mode`) so switching artworks in the rail keeps showing **either** gallery **or** 3D—not both simultaneously.

## Implementation

| Area | Files |
|------|--------|
| Page / SSR bundle | [`app/(store)/shop/experience-v3/page.tsx`](../../../app/(store)/shop/experience-v3/page.tsx) |
| Layout + providers | [`app/(store)/shop/experience-v3/layout.tsx`](../../../app/(store)/shop/experience-v3/layout.tsx) |
| Client loader | [`app/(store)/shop/experience-v3/components/ExperienceV3ClientLoader.tsx`](../../../app/(store)/shop/experience-v3/components/ExperienceV3ClientLoader.tsx) |
| Composition + checkout state | [`app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx`](../../../app/(store)/shop/experience-v3/components/ExperienceV3Client.tsx) |
| Hero (Spline \| gallery toggle) | [`app/(store)/shop/experience-v3/components/ExperienceV3HeroMedia.tsx`](../../../app/(store)/shop/experience-v3/components/ExperienceV3HeroMedia.tsx) |
| Center column | [`app/(store)/shop/experience-v3/components/ExperienceV3CenterPanel.tsx`](../../../app/(store)/shop/experience-v3/components/ExperienceV3CenterPanel.tsx) |
| Slideout rail | [`app/(store)/shop/experience-v3/components/ExperienceV3CollectionSlideout.tsx`](../../../app/(store)/shop/experience-v3/components/ExperienceV3CollectionSlideout.tsx) |
| Session preference key helpers | [`lib/shop/experience-v3-main-media.ts`](../../../lib/shop/experience-v3-main-media.ts) |

Shared with V2: cart persistence (**[`lib/shop/experience-cart-persistence.ts`](../../../lib/shop/experience-cart-persistence.ts)**), **`OrderBar`**, pricing / bundle calculators, Shopify bundle loading (same **`unstable_cache`** key as experience-v2).

Store shell registration: [`lib/shop/collector-store-shell.ts`](../../../lib/shop/collector-store-shell.ts) includes `experience-v3`.

## API / SEO

Metadata uses **`buildShopExperienceMetadata(..., '/shop/experience-v3')`** — **[`lib/seo/experience-metadata.ts`](../../../lib/seo/experience-metadata.ts)**.

## Testing

- **Manual:** open `/shop/experience-v3` — collapse/expand slideout; tap **card body** vs **+** (preview stays on + only); flip **3D / gallery** then pick another artwork (mode should persist for the session).
- **Automated:** not yet added for this surface (see [`docs/features/experience-v2/README.md`](../experience-v2/README.md) for related component tests).

## Performance

Spline remains lazy (`requestIdleCallback` + facade) aligned with **`SplineFullScreen`** / **`Spline3DPreview`** elsewhere. Infinite scroll uses an IntersectionObserver sentinel at the slideout scroll root.

## Changelog

- **2026-05-06** — Initial experience-v3 shell: slideout picker, persistent main-media mode (`sessionStorage`), separate hero preview IDs from sticky cart thumbnails.

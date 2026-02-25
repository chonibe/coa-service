# Shop Experience Wizard

## Overview

A first-session contextual wizard that guides new users through the lamp customization experience. Highlights key UI elements and explains how to preview artworks on the 3D lamp, view artwork details, add items to the cart, and checkout.

## Purpose

- **Reduce friction** for first-time visitors to `/shop/experience`
- **Explain interaction model**: tap to preview on lamp vs. add to order
- **Highlight** Spline 3D preview, artwork strip, info button, add-to-cart button, and order bar

## Technical Implementation

### Location

- **Component**: [`app/shop/experience/components/ExperienceWizard.tsx`](../../../app/shop/experience/components/ExperienceWizard.tsx)
- **Integration**: Mounted in [`Configurator.tsx`](../../../app/shop/experience/components/Configurator.tsx) after quiz completion

### Storage

- **Key**: `sc-experience-wizard-complete`
- **When set**: On "Done" or "Skip tour"
- **Behavior**: Wizard never shows again after completion

### Wizard Steps

| Step | Target | Description |
|------|--------|-------------|
| 1 | 3D lamp preview | Explains that artworks appear on the lamp in real time |
| 2 | Artwork strip | Tap an artwork to preview it on the lamp (up to 2 per side) |
| 3 | Info button | Tap (i) for full details, artist bio, and description |
| 4 | Add to cart | Tap + to add artworks to the order |
| 5 | Order bar | Review order and checkout |

### Data Attributes (Targets)

Elements must include these attributes for the wizard to highlight them:

- `data-wizard-spline` – 3D viewer container (Configurator)
- `data-wizard-artwork-strip` – Artwork grid (ArtworkStrip)
- `data-wizard-info-btn` – Info button on first artwork card
- `data-wizard-add-btn` – Add-to-cart button on first artwork card
- `data-wizard-order-bar` – Desktop and mobile order bar (OrderBar)

### Responsive Behavior

- **Desktop**: Highlights desktop order bar (bottom of right panel)
- **Mobile**: Highlights mobile order bar (fixed bottom sheet); uses `getVisibleElement()` to pick the visible instance when multiple targets share the same selector

## UI/UX Considerations

- **Spotlight overlay**: Four rectangles create a dimmed overlay with a "cutout" around the target; clicking the dimmed area advances to the next step
- **Highlight ring**: Amber ring around the target element
- **Tooltip card**: Centered at bottom with step content, Back/Next/Skip controls, and progress dots
- **Delay**: 600ms delay before wizard appears (lets layout stabilize)

## Testing

1. Clear `localStorage.sc-experience-wizard-complete` or use incognito
2. Complete the intro quiz to reach the Configurator
3. Confirm the wizard appears ~600ms after configurator loads
4. Walk through all 5 steps; verify each target is highlighted correctly
5. Test "Skip tour" and "Done" both dismiss and persist completion
6. Confirm wizard does not reappear on refresh

## Artist Link Support

Visitors arriving from artist Instagram pages can use pre-filtered links:

- **Full URL**: `/shop/experience?artist=artist-slug` — opens experience with that artist's artworks filtered first (intro quiz still shown; add `&skipQuiz=1` to skip)
- **Short URL**: `/e/artist-slug` — redirects to the same (ideal for Instagram bios)

**Admin**: Create and copy links from **Admin → Vendors → Experience Links**. Each artist has a slug derived from their name (e.g. `jane-doe`). Copy the full or short URL for Instagram link-in-bio.

## Version

- Last updated: 2026-02-24
- Version: 1.1.0

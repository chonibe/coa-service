# Shop Experience Wizard

## Overview

A first-session contextual wizard that guides new users through the lamp customization experience. Paywall-aware: at the lamp paywall, shows the 3D rotate step; after adding a lamp (or skipping), shows Add/Eye/Info, Street Lamp controls, and checkout.

## Purpose

- **Reduce friction** for first-time visitors to `/shop/experience`
- **Explain interaction model**: drag/rotate 3D model, tap Add/Eye/Info on artworks, manage lamp quantity, checkout
- **Paywall-aware**: Step 1 (3D rotate) shows at paywall with 360° spin animation; remaining steps show only after passing the paywall

## Technical Implementation

### Location

- **Component**: [`app/shop/experience/components/ExperienceWizard.tsx`](../../../app/shop/experience/components/ExperienceWizard.tsx)
- **Integration**: Mounted in [`Configurator.tsx`](../../../app/shop/experience/components/Configurator.tsx) after quiz completion
- **Props**: `pastLampPaywall` – when true, shows full steps (selector, lamp controls, order bar)

### Storage

- **Key**: `sc-experience-wizard-complete`
- **When set**: On "Done" or "Skip tour"
- **Behavior**: Wizard never shows again after completion

### Wizard Steps (Paywall-Aware)

**At paywall** (lamp not yet added):

| Step | Target | Description |
|------|--------|-------------|
| 1 | 3D lamp preview | Drag and rotate the model 360° — animated lamp icon in tooltip |

**Past paywall** (lamp added or skipped):

| Step | Target | Description |
|------|--------|-------------|
| 1 | 3D lamp preview | Drag and rotate the model 360° |
| 2 | First artwork card | Add to order, Eye to preview on lamp, Info for details |
| 3 | Lamp controls | Street Lamp +/− in header (ExperienceSlideoutMenu) |
| 4 | Order bar | Review order and checkout |

### AR Camera Toggle

Users can switch the 3D preview to an AR-style view with the device camera feed behind the lamp:

- **Toggle**: Camera icon button (top-right of 3D preview, left of the light/dark theme toggle). Only shown when the camera API is supported (HTTPS).
- **Behavior**: On first tap, the app requests camera permission and starts the stream; the Spline scene background becomes transparent so the lamp appears over the live camera feed. Tap again to turn off and release the camera.
- **Implementation**: [`useCameraFeed`](../../../app/shop/experience/hooks/useCameraFeed.ts) hook; [`Spline3DPreview`](../../../app/template-preview/components/spline-3d-preview.tsx) `cameraFeedMode` prop. See [Experience AR Camera](../experience-ar-camera/README.md) for details.

### Data Attributes (Targets)

- `data-wizard-spline` – 3D viewer container (Configurator)
- `data-wizard-first-card` – First artwork card (ArtworkStrip) — highlights Add, Eye, Info
- `data-wizard-info-btn` – Info button on first artwork card
- `data-wizard-add-btn` – Add-to-cart button on first artwork card
- `data-wizard-lamp-controls` – Lamp +/− controls in header (ExperienceSlideoutMenu)
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
7. **AR camera**: On HTTPS, tap the camera icon; grant camera permission and confirm the lamp appears over the live feed. Tap again to turn off; confirm stream stops and no leaks.

## Artist Link Support

Visitors arriving from artist Instagram pages can use pre-filtered links:

- **Full URL**: `/shop/experience?artist=artist-slug` — opens experience with that artist's artworks filtered first (intro quiz still shown; add `&skipQuiz=1` to skip)
- **Short URL**: `/e/artist-slug` — redirects to the same (ideal for Instagram bios)

**Admin**: Create and copy links from **Admin → Vendors → Experience Links**. Each artist has a slug derived from their name (e.g. `jane-doe`). Copy the full or short URL for Instagram link-in-bio.

### URL metadata and social previews

When the URL includes an artist (e.g. `?artist=jack-jc-art` or `?vendor=...`), the page metadata is generated dynamically so that shared links show the correct preview:

- **Title**: "Early access — Artist Name | Street Collector" for unlisted/early-access artists, or "Artist Spotlight — Artist Name | Street Collector" otherwise
- **Description**: Artist bio (trimmed) or a short line such as "Early access to artworks by Artist Name. Customize your Street Lamp with their art."
- **Image**: The artist's profile/collection image (from [artist-spotlight API](../../../app/api/shop/artist-spotlight/route.ts))

This applies to Open Graph (Facebook, WhatsApp, iMessage, etc.) and Twitter Card previews. Implemented via `generateMetadata` in [`app/shop/experience/page.tsx`](../../../app/shop/experience/page.tsx), which calls the artist-spotlight API server-side to resolve the artist and image.

## Version

- Last updated: 2026-03-08
- Version: 1.3.0

# Experience Wizard – Paywall-Aware Steps Update

**Date:** 2026-03-05

## Summary

Updated the onboarding wizard on the experience page to match the current screens and flow. The wizard is now paywall-aware: at the lamp paywall it shows a single step (3D drag/rotate with 360° animation); after passing the paywall it shows Add/Eye/Info, Street Lamp controls, and checkout.

## Changes Checklist

- [x] **[`app/shop/experience/components/ExperienceWizard.tsx`](../../app/shop/experience/components/ExperienceWizard.tsx)** – Paywall-aware steps, 360° lamp spin animation for step 1
- [x] **[`app/shop/experience/components/Configurator.tsx`](../../app/shop/experience/components/Configurator.tsx)** – Pass `pastLampPaywall` to ExperienceWizard
- [x] **[`app/shop/experience/components/ArtworkStrip.tsx`](../../app/shop/experience/components/ArtworkStrip.tsx)** – Add `data-wizard-first-card`, `data-wizard-info-btn` to first artwork card
- [x] **[`app/shop/experience/ExperienceSlideoutMenu.tsx`](../../app/shop/experience/ExperienceSlideoutMenu.tsx)** – Add `data-wizard-lamp-controls` to lamp +/− section
- [x] **[`docs/features/shop-experience-wizard/README.md`](../../docs/features/shop-experience-wizard/README.md)** – Updated wizard steps table and data attributes

## Implementation Details

### 1. Step 1 at Paywall – 3D Drag/Rotate

When the user reaches the paywall (lamp not yet added), the first wizard step highlights the 3D preview area and explains that they can drag and rotate the model. A spinning lamp icon (360° continuous rotation) in the tooltip demonstrates the concept.

### 2. Steps Past Paywall

Once the user adds a lamp or skips the paywall:

- **Step 2** – Highlights the first artwork card (`data-wizard-first-card`) and explains: Add to order, Eye to preview on lamp, Info for details.
- **Step 3** – Highlights the Street Lamp add/remove controls (`data-wizard-lamp-controls`) in the header.
- **Step 4** – Highlights the order bar for checkout.

### 3. Props & Targets

- `ExperienceWizard` now accepts `pastLampPaywall?: boolean`.
- Steps are derived from `WIZARD_STEPS_AT_PAYWALL` (1 step) or `WIZARD_STEPS_PAST_PAYWALL` (4 steps) depending on prop.
- New data attributes for targeting: `data-wizard-first-card`, `data-wizard-lamp-controls`, `data-wizard-info-btn`.

## Testing

1. Clear `localStorage.sc-experience-wizard-complete` or use incognito.
2. Complete the intro quiz to reach the Configurator.
3. **At paywall**: Confirm step 1 shows with spinning lamp icon; "Next" completes the wizard.
4. **Past paywall** (add lamp first, then clear wizard key and refresh): Confirm all 4 steps appear in order (spline → first card → lamp controls → order bar).
5. Verify lamp controls are highlighted in the header (ExperienceSlideoutMenu) when lamp quantity > 0.

## Rollback

```bash
git checkout HEAD~1 -- app/shop/experience/components/ExperienceWizard.tsx
git checkout HEAD~1 -- app/shop/experience/components/Configurator.tsx
git checkout HEAD~1 -- app/shop/experience/components/ArtworkStrip.tsx
git checkout HEAD~1 -- app/shop/experience/ExperienceSlideoutMenu.tsx
git checkout HEAD~1 -- docs/features/shop-experience-wizard/README.md
```

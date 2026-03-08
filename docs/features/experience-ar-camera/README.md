# Experience AR Camera Feed

## Overview

Optional AR-style preview on the shop experience page: users can toggle a view that shows the 3D lamp over their device camera feed, for a "product on surface" preview.

## Purpose

- Let users see the configured lamp over a live camera feed (desk, room, etc.).
- Implemented as a **toggle**; the default view remains the solid-background 3D preview.
- Requires HTTPS and camera permission; degrades gracefully when unsupported or denied.

## Technical Implementation

### Location

- **Hook**: [app/shop/experience/hooks/useCameraFeed.ts](../../../app/shop/experience/hooks/useCameraFeed.ts) — `getUserMedia`, stream lifecycle, permission/error handling.
- **Configurator**: [app/shop/experience/components/Configurator.tsx](../../../app/shop/experience/components/Configurator.tsx) — AR state, video layer, toggle button, `cameraFeedMode` passed to Spline.
- **Spline component**: [app/template-preview/components/spline-3d-preview.tsx](../../../app/template-preview/components/spline-3d-preview.tsx) — `cameraFeedMode` prop and transparent background when true.

### Flow

1. User taps the camera icon (top-right of 3D preview, left of theme toggle). Button only appears when `navigator.mediaDevices.getUserMedia` is available and context is secure (HTTPS).
2. Configurator sets `arCameraOn = true` and calls `requestAccess()` from `useCameraFeed`.
3. Hook requests camera with `facingMode: 'environment'` on mobile (back camera), `'user'` on desktop; stream is stored and attached to a `<video>` ref.
4. When `cameraStatus === 'active'`, Configurator renders a full-bleed `<video>` (mirrored) behind the Spline container and passes `cameraFeedMode={true}` to `Spline3DPreview`.
5. Spline3DPreview sets `scene.background = null` and `renderer.setClearColor(0x000000, 0)` so the canvas is transparent; the lamp renders over the video.
6. User taps the camera icon again to turn off: `stopStream()` and `setArCameraOn(false)`; video is removed and Spline reverts to solid background.

### useCameraFeed API

- **Returns**: `videoRef`, `status` (`'idle' | 'loading' | 'active' | 'denied' | 'error'`), `error`, `requestAccess`, `stopStream`, `isSupported`.
- **Cleanup**: Stream tracks are stopped in `stopStream()` and on unmount.
- **Errors**: Permission denied or no device sets `status` to `'denied'` or `'error'` and resets AR toggle so the user can retry.

## UI/UX

- **Button**: Camera icon; loading spinner while requesting access; highlighted (amber) when AR is active; disabled during loading.
- **Video**: `object-fit: cover`, mirrored (`scaleX(-1)`), muted, playsInline.
- **Fallback**: If camera is denied or errors, toggle resets and tooltip/title shows the error message.

## Limitations

- **Transparency**: Spline’s WebGL context may not be created with `alpha: true`. If the background does not become transparent, the lamp will still render but the camera feed may not show through; document and consider a fallback (e.g. PIP or message).
- **HTTPS**: Camera requires a secure context; button is hidden when not supported.
- **Mobile**: Back camera is requested on narrow viewports; fallback to front camera if needed.
- **No true AR**: This is camera feed + transparent 3D overlay, not WebXR/device pose tracking.

## Testing

1. Open `/shop/experience` over HTTPS.
2. Complete the quiz and reach the Configurator.
3. Confirm the camera icon appears next to the theme toggle.
4. Tap camera → grant permission → confirm video appears and lamp is visible over it.
5. Tap camera again → confirm video stops and solid background returns.
6. Deny permission → confirm button resets and error is surfaced (e.g. via title/tooltip).
7. Navigate away and back; confirm no stream leaks (no lingering camera indicator).

## Related

- [Shop Experience Wizard](../shop-experience-wizard/README.md) — wizard and 3D preview context.
- [SPLINE_SETUP.md](../../../app/template-preview/SPLINE_SETUP.md) — `cameraFeedMode` prop and Spline integration.

## Version

- Last updated: 2026-03-08
- Version: 1.0.0

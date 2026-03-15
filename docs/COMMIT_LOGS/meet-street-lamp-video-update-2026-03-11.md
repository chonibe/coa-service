# Meet the Street Lamp Video URL Update — March 11, 2026

## Summary
Landing page "Meet the Street Lamp" section now uses a single Shopify CDN video URL for both desktop and mobile, as requested.

## Implementation Checklist

- [x] [content/street-collector.ts](../../content/street-collector.ts) — `meetTheLamp.desktopVideo` updated to `https://cdn.shopify.com/videos/c/o/v/6e1629c055ea41a5b3c4f4efe9906b54.mp4`
- [x] [content/street-collector.ts](../../content/street-collector.ts) — `meetTheLamp.mobileVideo` updated to the same URL (unified desktop/mobile video)

## Files Changed
- [content/street-collector.ts](../../content/street-collector.ts) — Meet the Street Lamp `desktopVideo` and `mobileVideo` URLs

## Notes
- Previous values: desktop `85f511b742be4bc7a16d0efbf50147e6.mp4`, mobile `52f4f4d4f3ac49c5b24dd536bc55328c.mp4`. Both replaced with `6e1629c055ea41a5b3c4f4efe9906b54.mp4`.

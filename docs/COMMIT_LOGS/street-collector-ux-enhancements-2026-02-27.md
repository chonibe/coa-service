# Street Collector & Experience UX Enhancements

**Date:** 2026-02-27  
**Type:** Enhancement

## Summary

Street Collector landing and Experience funnel UX refinements: value prop cards, Meet the Lamp mobile layout, colored titles, back chevron, and aspect ratio consistency.

## Implementation Checklist

### Street Collector Page
- [x] Value prop cards: black background, white/light gray text, colored titles (baby blue, red, orange)
- [x] Value prop card titles: reduced desktop size (md:text-2xl lg:text-3xl)
- [x] Meet the Lamp mobile: centered rotating stage text, title→video→slideshow order, 4px dots
- [x] Meet the Lamp mobile: centered title (text-center lg:text-left)
- [x] Testimonial & artist images: 3×5 aspect ratio
- [x] In Collaboration With: moved after testimonials
- [x] Proxy video API for CORS-free video playback

### Experience Page
- [x] Back chevron to /shop/street-collector (top-left, fixed)
- [x] Removed Step 1 of 3 · Setup bar

### Content
- [x] Value prop titles: Collect original art., Live with it. Make it yours., Support artists directly.

## Files Changed

| Action | Path |
|--------|------|
| Modified | `app/shop/street-collector/MultiColumnVideoSection.tsx` |
| Modified | `app/shop/street-collector/MeetTheStreetLamp.tsx` |
| Modified | `app/shop/street-collector/TestimonialCarousel.tsx` |
| Modified | `app/shop/street-collector/page.tsx` |
| Modified | `app/shop/experience/components/ExperienceClient.tsx` |
| Modified | `components/sections/ArtistCarousel.tsx` |
| Modified | `content/street-collector.ts` |

## References

- [app/shop/street-collector/README.md](../../app/shop/street-collector/README.md)

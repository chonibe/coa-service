# Street Collector Dark Mode, Banner Image, Checkout UX, Experience Updates

**Date**: 2026-03-06  
**Commit**: c1ef04378

## Summary

Street Collector page dark theme, value prop banner with image, checkout/experience improvements, Google Pay domain registration, Supabase OTP email customization, and related updates.

## Changes Checklist

- [x] [`app/shop/street-collector/page.tsx`](../../app/shop/street-collector/page.tsx) — Dark mode (#390000, #2a0000, #1a0a0a, #150000); value prop banner with image behind (top protrudes); merged sections; mobile banner under 3rd video
- [x] [`app/shop/street-collector/`](../../app/shop/street-collector/) — FixedCTAButton, MeetTheStreetLamp, MultiColumnVideoSection, StreetCollectorFAQ, TestimonialCarousel, README
- [x] [`components/sections/ArtistCarousel.tsx`](../../components/sections/ArtistCarousel.tsx) — leadingContent prop, arrow styling for dark theme
- [x] [`components/sections/VideoPlayer.tsx`](../../components/sections/VideoPlayer.tsx) — ctaPosition: 'bottom', overlay layout
- [x] [`app/api/admin/register-payment-domains/route.ts`](../../app/api/admin/register-payment-domains/route.ts) — New API for Google Pay domain registration
- [x] [`app/api/checkout/create-checkout-session/route.ts`](../../app/api/checkout/create-checkout-session/route.ts) — Checkout session updates
- [x] [`app/api/gift-cards/create-checkout/route.ts`](../../app/api/gift-cards/create-checkout/route.ts) — Gift card checkout
- [x] [`app/api/stripe/webhook/route.ts`](../../app/api/stripe/webhook/route.ts) — Webhook handling
- [x] [`components/shop/checkout/ExperienceQuizPrefill.tsx`](../../components/shop/checkout/ExperienceQuizPrefill.tsx) — New component for quiz prefill
- [x] [`components/shop/checkout/AddressModal.tsx`](../../components/shop/checkout/AddressModal.tsx), [`PaymentMethodsModal.tsx`](../../components/shop/checkout/PaymentMethodsModal.tsx) — Checkout UX
- [x] [`app/shop/experience/`](../../app/shop/experience/) — ExperienceOrderContext, ExperienceSlideoutMenu, ExperienceThemeContext, SplineScenePreload; ArtistSpotlightBanner, ArtworkDetail, ArtworkStrip, Configurator, DiscountCelebration, IntroQuiz; removed ExperienceWizard
- [x] [`scripts/supabase-update-otp-email-template.js`](../../scripts/supabase-update-otp-email-template.js), [`supabase/templates/otp-magic-link.html`](../../supabase/templates/otp-magic-link.html) — Supabase OTP email customization
- [x] [`docs/SUPABASE_OTP_EMAIL_CUSTOMIZATION.md`](../../docs/SUPABASE_OTP_EMAIL_CUSTOMIZATION.md) — Documentation
- [x] [`docs/COMMIT_LOGS/google-pay-domain-registration-2026-03-05.md`](../../docs/COMMIT_LOGS/google-pay-domain-registration-2026-03-05.md) — Google Pay domain registration log

## Features

### Street Collector
- Dark backgrounds (#390000, #2a0000, #1a0a0a, #150000)
- Value prop banner with image (Group_8252.png) behind; only top protrudes
- Merged "Bringing art into everyday life" + "In Collaboration With"
- Mobile: first two videos hidden, banner under 3rd video
- Hero CTA at bottom, pink accent (#FFBA94)

### Checkout / Experience
- ExperienceQuizPrefill component
- Payment methods and address modal updates
- Experience layout and component updates
- ExperienceWizard removed

### Infrastructure
- Google Pay domain registration API
- Supabase OTP email template customization script and template

## Known Limitations

- None documented for this release.

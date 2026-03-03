# Orders Page Login Redirect Fix

**Date**: 2026-03-03  
**Branch**: feature/experience-checkout-updates → main  
**Commit**: 172f000f1

## Summary

Fixed "wrong login" redirect when signing in from the orders page. Users now use the in-context AuthSlideupMenu and collector auth errors redirect to `/login` with proper params instead of `/vendor/login`.

## Checklist of Changes

- [x] **[app/shop/account/page.tsx](app/shop/account/page.tsx)** – Replaced `/login` link with AuthSlideupMenu for in-context sign-in
- [x] **[app/auth/callback/route.ts](app/auth/callback/route.ts)** – Collector error paths redirect to `/login?redirect=/shop/account&intent=collector` instead of `/vendor/login`
- [x] **[app/api/collector/wishlist/route.ts](app/api/collector/wishlist/route.ts)** – Wishlist route updates (included in staged changes)
- [x] **[app/shop/experience/ExperienceSlideoutMenu.tsx](app/shop/experience/ExperienceSlideoutMenu.tsx)** – Slideout menu updates (included in staged changes)
- [x] **[app/shop/experience/components/Configurator.tsx](app/shop/experience/components/Configurator.tsx)** – Configurator updates (included in staged changes)
- [x] **[app/shop/experience/layout.tsx](app/shop/experience/layout.tsx)** – Experience layout updates (included in staged changes)
- [x] **[components/impact/Footer.tsx](components/impact/Footer.tsx)** – Footer updates (included in staged changes)
- [x] **[lib/supabase/client.ts](lib/supabase/client.ts)** – Supabase client updates (included in staged changes)

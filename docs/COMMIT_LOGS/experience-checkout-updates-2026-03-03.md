# Experience Checkout Updates

**Date**: 2026-03-03  
**Branch**: feature/experience-checkout-updates  
**Commit**: 45c7b58b5

## Summary

Experience checkout flow enhancements, Spline 3D preloading, dev mock auth, checkout PII prefills, and related shop/auth updates.

## Checklist of Changes

- [x] **[app/shop/experience/SplineScenePreload.tsx](app/shop/experience/SplineScenePreload.tsx)** – New Spline scene preload component
- [x] **[app/shop/experience/components/SplineWhenVisible.tsx](app/shop/experience/components/SplineWhenVisible.tsx)** – Load Spline only when visible
- [x] **[app/api/dev/mock-login/route.ts](app/api/dev/mock-login/route.ts)** – Dev mock login API
- [x] **[app/api/dev/mock-logout/route.ts](app/api/dev/mock-logout/route.ts)** – Dev mock logout API
- [x] **[components/shop/checkout/CheckoutPiiPrefill.tsx](components/shop/checkout/CheckoutPiiPrefill.tsx)** – PII prefill for checkout
- [x] **[lib/supabase/middleware.ts](lib/supabase/middleware.ts)** – Supabase middleware helpers
- [x] **[app/shop/experience/ExperienceCartChip.tsx](app/shop/experience/ExperienceCartChip.tsx)** – Experience cart chip updates
- [x] **[app/shop/experience/ExperienceSlideoutMenu.tsx](app/shop/experience/ExperienceSlideoutMenu.tsx)** – Slideout menu updates
- [x] **[app/shop/experience/ExperienceOrderContext.tsx](app/shop/experience/ExperienceOrderContext.tsx)** – Order context updates
- [x] **[app/shop/experience/components/OrderBar.tsx](app/shop/experience/components/OrderBar.tsx)** – Order bar updates
- [x] **[app/shop/experience/components/Configurator.tsx](app/shop/experience/components/Configurator.tsx)** – Configurator updates
- [x] **[app/shop/experience/components/ArtworkDetail.tsx](app/shop/experience/components/ArtworkDetail.tsx)** – Artwork detail updates
- [x] **[app/shop/experience/components/ArtworkStrip.tsx](app/shop/experience/components/ArtworkStrip.tsx)** – Artwork strip updates
- [x] **[app/shop/experience/components/FilterPanel.tsx](app/shop/experience/components/FilterPanel.tsx)** – Filter panel updates
- [x] **[app/shop/experience/components/ExperienceClient.tsx](app/shop/experience/components/ExperienceClient.tsx)** – Experience client updates
- [x] **[app/shop/experience/layout.tsx](app/shop/experience/layout.tsx)** – Experience layout updates
- [x] **[app/api/shop/account/auth/route.ts](app/api/shop/account/auth/route.ts)** – Shop account auth route updates
- [x] **[app/api/shop/account/orders/route.ts](app/api/shop/account/orders/route.ts)** – Shop account orders route updates
- [x] **[app/auth/callback/route.ts](app/auth/callback/route.ts)** – Auth callback updates
- [x] **[app/login/login-client.tsx](app/login/login-client.tsx)** – Login client updates
- [x] **[lib/shop/useShopAuth.ts](lib/shop/useShopAuth.ts)** – Shop auth hook updates
- [x] **[middleware.ts](middleware.ts)** – Middleware updates
- [x] **[components/shop/checkout/PaymentMethodsModal.tsx](components/shop/checkout/PaymentMethodsModal.tsx)** – Payment methods modal updates
- [x] **[components/impact/LocalCartDrawer.tsx](components/impact/LocalCartDrawer.tsx)** – Local cart drawer updates
- [x] **[app/shop/account/page.tsx](app/shop/account/page.tsx)** – Account page updates
- [x] **[app/shop/cart/page.tsx](app/shop/cart/page.tsx)** – Cart page updates
- [x] **[app/vendor/components/sidebar-layout.tsx](app/vendor/components/sidebar-layout.tsx)** – Vendor sidebar layout updates
- [x] **[app/globals.css](app/globals.css)** – Global styles
- [x] **[lib/mock-data.ts](lib/mock-data.ts)** – Mock data updates
- [x] **[vercel.json](vercel.json)** – Vercel config
- [x] **[.gitignore](.gitignore)** – Add `*.backup` pattern
- [x] **[docs/features/experience/README.md](docs/features/experience/README.md)** – Experience feature docs
- [x] **[docs/mcp/README.md](docs/mcp/README.md)** – MCP docs

## Deployment

- **Vercel**: Production deployment completed
- **Inspect**: https://vercel.com/chonibes-projects/street-collector/6SQeGTnn9YR2Y9Ed1XQR9RfLrMHJ
- **Production URL**: https://street-collector-g5jpufa0o-chonibes-projects.vercel.app

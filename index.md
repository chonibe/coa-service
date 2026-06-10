# Wiki Index

Content catalog for the COA Service / The Street Collector second brain.
Maintained by the wiki-maintenance agent. Updated after every operation.

---

## Sources

- [[2026-04-14-readme]] — COA Service README: project overview, features, and tech stack
- [[2026-04-14-system-ssot]] — System SSOT: critical database rules, auth patterns, production config
- [[2026-04-14-api-documentation]] — API Documentation: all endpoints, session model, auth flows
- [[2026-04-14-rbac-architecture]] — RBAC Architecture: JWT claims, `public.has_role()`, DB schema
- [[2026-04-14-vision]] — VXO Vision: long-term AI-driven optimisation roadmap (3 phases)
- [[2026-04-14-crm-readme]] — CRM Feature Docs: multi-channel CRM, Supabase schema, UI components
- [[2026-04-14-vendor-payouts]] — Vendor Payouts: fulfillment-based calculation, PayPal, audit trail
- [[2026-04-14-nfc-auth-feature]] — NFC Auth feature: hook, components, token signing, unlock page
- [[2026-04-14-collector-dashboard-feature]] — Collector Dashboard feature: auth flows, series binder, aggregation
- [[2026-04-14-affiliate-program]] — Affiliate Program: link format, attribution chain, commission rules
- [[2026-04-14-post-purchase-credits]] — Track C: auto collector identity, credits economy, claim tokens
- [[2026-04-14-experience-readme]] — Experience Page: 3D lamp configurator, Spline, virtualised artwork strip
- [[2026-04-14-series-manager]] — Series Manager: Instagram-style series creation, unlock mechanics, drag-and-drop
- [[2026-04-14-journey-milestone]] — Journey Milestone System: game-inspired artist journey map, series as milestones
- [[2026-04-14-giveaway]] — Giveaway Roulette: @mention parsing, GSAP wheel, co-winner, Supabase persistence
- [[2026-04-14-analytics]] — Analytics: GA4 + PostHog + Meta CAPI three-layer tracking stack
- [[2026-04-14-conditional-artwork-access]] — Conditional Artwork Access: view-freely, authenticate-to-interact model
- [[2026-04-14-first-edition-reserve]] — First Edition Reserve: auto-reserve of edition #1 for platform operator
- [[2026-04-14-warehouse-order-tracking]] — Warehouse Tracking: ChinaDivision integration, shareable links, My Orders accordion
- [[2026-04-14-vendor-product-creation]] — Vendor Product Creation: 5-step wizard, admin approval, Shopify publish

---

## Entities

- [[the-street-collector]] — The platform and brand; art authentication marketplace
- [[supabase]] — Backend: Postgres, Auth, Edge Functions, Storage
- [[shopify]] — Headless commerce layer: products, orders, checkout, customer auth
- [[vercel]] — Deployment platform for the Next.js App Router application

---

## Concepts

- [[certificate-of-authenticity]] — Digital credential per artwork edition, delivered as NFC-linked postcard
- [[nfc-authentication]] — Web NFC API bridge linking physical artwork to digital certificate
- [[rbac]] — Role-Based Access Control: admin/vendor/collector/guest via JWT claims + signed cookies
- [[edition-numbering-system]] — Limited-edition tracking per series, stored in `order_line_items_v2`
- [[vendor-portal]] — Artist/gallery portal: auth, dashboards, payouts, media library
- [[collector-dashboard]] — Buyer portal: owned artworks, certificates, series binder, credits
- [[headless-architecture]] — Next.js + Shopify API + Supabase with two separate auth contexts
- [[crm-system]] — Multi-channel CRM: email, Instagram, Facebook, WhatsApp, Shopify unified inbox
- [[vendor-payout-system]] — Fulfillment-based payouts: 25% default, $25 min, PayPal disbursement
- [[affiliate-program]] — Artist referral links earning 10% commission on lamp sales
- [[credits-economy]] — Ink-O-Gatchi credits: 10 per $1, awarded at purchase and NFC scan
- [[experience-page]] — 3D Street Lamp configurator with Spline, virtualised artwork strip, checkout
- [[series-manager]] — Instagram-style series creation with unlock mechanics and drag-and-drop
- [[journey-milestone-system]] — Game-inspired artist journey map; series as unlockable milestones
- [[giveaway-roulette]] — Instagram @mention giveaways with GSAP wheel and co-winner mechanic
- [[analytics-tracking]] — GA4 + PostHog + Meta CAPI three-layer analytics with server-side signals
- [[conditional-artwork-access]] — View freely, authenticate to interact; `canInteract` API field
- [[first-edition-reserve]] — Edition #1 auto-reserved for platform operator at artwork approval
- [[warehouse-order-tracking]] — ChinaDivision shipment tracking: admin dashboard, shareable links, customer accordion
- [[vendor-product-creation]] — 5-step vendor submission wizard with admin approval and Shopify publish

---

## Syntheses

- [[2026-04-14-platform-architecture-overview]] — Full systems map: purchase-to-certificate flow, auth boundaries, feature table

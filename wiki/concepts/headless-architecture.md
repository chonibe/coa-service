---
title: "Headless Architecture"
type: concept
tags: [architecture, shopify, nextjs, frontend]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-readme, 2026-04-14-api-documentation, 2026-04-14-system-ssot]
---

# Headless Architecture

The platform uses a headless architecture where Shopify handles commerce transactions but the entire UI is a custom Next.js application consuming Shopify and Supabase APIs.

## Definition

"Headless" means Shopify's default storefront theme is not used. Instead, a Next.js App Router application serves all pages — shop, checkout flow, collector dashboard, vendor portal, admin panel. The Shopify Storefront API provides product/collection data; the Shopify Admin API handles order management. Supabase provides all custom data (certificates, editions, CRM). Vercel hosts the Next.js app.

## Key Claims

1. All pages are Next.js App Router routes — no Shopify Liquid templates in the main flow (except legacy `shopify-theme/` experiments).
2. The import path for NfcTagScanner is `@/src/components/NfcTagScanner` — not `@/components/NfcTagScanner`.
3. UI components: `@/components/ui/*` (shadcn/ui) for shared components, Shopify Polaris Web Components for admin/vendor UI.
4. The app has two distinct auth contexts that must never be mixed: Shopify cookies (collectors) and Supabase sessions + signed cookies (vendors/admins).
5. `middleware.ts` handles route-level auth guards and redirects.
6. API routes live under `app/api/` — no separate API server.

## Evidence

- [[2026-04-14-readme]] — tech stack overview
- [[2026-04-14-system-ssot]] — import path rules, auth context rules
- [[2026-04-14-api-documentation]] — API structure, auth flows

## Tensions

- Two auth systems (Shopify cookies + Supabase) create cognitive overhead and potential for accidental cross-contamination.
- Headless checkout means managing Shopify cart state client-side, which is more complex than standard Shopify themes.

## Related

- [[shopify]]
- [[supabase]]
- [[vercel]]
- [[rbac]]
- [[the-street-collector]]

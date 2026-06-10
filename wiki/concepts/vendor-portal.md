---
title: "Vendor Portal"
type: concept
tags: [feature, vendor, dashboard, auth]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-readme, 2026-04-14-api-documentation, 2026-04-14-rbac-architecture]
---

# Vendor Portal

The Vendor Portal is the artist/gallery-facing section of the platform where vendors manage their artworks, track sales, and receive payouts.

## Definition

Vendors authenticate via Google OAuth or email/password through Supabase Auth. On successful login, the `/auth/callback` route links the Google account to a `vendors` table record and issues a signed `vendor_session` HTTP-only cookie. All protected vendor endpoints verify this cookie. The portal provides dashboards for sales analytics, payout management, media library, product creation, and customer interactions.

## Key Claims

1. Vendors authenticate via `GET /api/auth/google/start` → Supabase OAuth → `/auth/callback` → `vendor_session` cookie.
2. New vendors without an existing record are redirected to `/vendor/onboarding`; returning vendors go to `/vendor/dashboard`.
3. The `vendor_session` cookie is HMAC-signed and isolates vendor access — cross-vendor session bleed is prevented.
4. Admin users can impersonate any vendor via `POST /api/auth/impersonate` (requires `admin_session` cookie).
5. Payout system supports PayPal, Stripe, and Bank Transfer with bi-weekly/weekly/monthly schedules.
6. Vendors have a media library for managing artwork images and videos.
7. Shopify Polaris components are used in vendor-facing UI.

## Evidence

- [[2026-04-14-api-documentation]] — full vendor auth flow, session model, endpoint list
- [[2026-04-14-readme]] — payout system features
- [[2026-04-14-rbac-architecture]] — vendor role, JWT claims structure

## Tensions

- Vendors are Supabase-auth users but their identity in the app is defined by the `vendors` table — a mismatch between the two can block login.
- The `vendor_session` cookie approach duplicates some JWT role checking but adds defence-in-depth.

## Related

- [[rbac]]
- [[supabase]]
- [[shopify]]
- [[the-street-collector]]
- [[collector-dashboard]]

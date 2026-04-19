---
title: "RBAC (Role-Based Access Control)"
type: concept
tags: [security, auth, permissions, architecture]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-rbac-architecture, 2026-04-14-api-documentation, 2026-04-14-system-ssot]
---

# RBAC (Role-Based Access Control)

RBAC is the permission system that controls what each user type (admin, vendor, collector, guest) can see and do across the platform.

## Definition

Roles are injected into Supabase JWTs at login via a Custom Access Token Hook. The hook queries the `user_roles` table and embeds `user_roles`, `vendor_id`, `user_permissions`, and `rbac_version: 2.0` into the JWT claims. Database RLS policies read these claims via `public.has_role()` to allow or block queries. API routes verify the signed `vendor_session` or `admin_session` cookie independently of the JWT.

## Key Claims

1. Four roles exist: `admin`, `vendor`, `collector`, `guest`.
2. Roles are stored in the `user_roles` table and injected into JWTs via Supabase's Custom Access Token Hook — they are NOT derived at request time.
3. The helper function is `public.has_role()` — never `auth.has_role()` (requires superuser privileges unavailable in Supabase).
4. Vendor access is gated by a signed `vendor_session` HTTP-only cookie (HMAC-signed).
5. Admin access requires both a valid Supabase session AND a signed `admin_session` cookie.
6. Admins (`choni@thestreetlamp.com`, `chonibe@gmail.com`) can impersonate vendors via `POST /api/auth/impersonate`.
7. `rbac_version: 2.0` is the current schema; earlier versions had the `auth.has_role` bug.

## Evidence

- [[2026-04-14-rbac-architecture]] — full Mermaid diagrams, DB schema, migration history
- [[2026-04-14-api-documentation]] — session cookie model, impersonation endpoint
- [[2026-04-14-system-ssot]] — authentication flow rules

## Tensions

- JWT-embedded roles mean a role change takes effect only after the next login (no real-time revocation without session invalidation).
- Two parallel auth checks (JWT claims + signed cookie) add complexity but prevent cookie-only forgery.

## Related

- [[supabase]]
- [[vendor-portal]]
- [[collector-dashboard]]
- [[headless-architecture]]

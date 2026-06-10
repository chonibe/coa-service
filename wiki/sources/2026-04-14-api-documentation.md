---
title: "Street Collector API Documentation"
type: source
tags: [api, auth, endpoints, vendor, admin]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Street Collector API Documentation

Comprehensive reference for all API endpoints, authentication mechanisms, session management, and role conventions in the COA Service.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/API_DOCUMENTATION.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

The API documentation describes a Next.js App Router API layer with no separate backend server. Endpoints are organised under `app/api/`. Authentication uses Supabase Auth with signed HTTP-only cookies for session isolation.

Four user roles exist: `ADMIN` (full access), `VENDOR` (product and sales management), `CUSTOMER` (personal dashboard), `GUEST` (limited). The vendor auth flow: Google OAuth via `GET /api/auth/google/start` → Supabase consent → `/auth/callback` → vendor linkage → `vendor_session` cookie. Admins get an additional `admin_session` cookie.

The session model uses HTTP-only cookies rather than localStorage to prevent XSS-based session theft. The `vendor_session` cookie is HMAC-signed to prevent forgery. Admins can impersonate any vendor for diagnostics via `POST /api/auth/impersonate`.

Collector endpoints are separate: they live under `/api/customer/*` and validate Shopify customer cookies — they never touch Supabase sessions.

## Key Takeaways

- `GET /api/auth/google/start` — initiates vendor/admin OAuth, stores post-login redirect in a cookie.
- `/auth/callback` — exchanges Supabase code for session, links user to vendor record, issues `vendor_session` cookie.
- `POST /api/auth/email-login` — email/password login returning `{ "redirect": "/vendor/dashboard" }`.
- `GET /api/auth/status` — returns current session metadata and vendor context.
- `POST /api/auth/impersonate` — admin-only vendor impersonation (requires `admin_session` cookie).
- Unregistered emails get a `403` with a support contact message and cookie clearance.
- Response caching is disabled on auth status endpoints.
- Customer endpoints (`/api/customer/*`) use Shopify cookies, not Supabase sessions.

## New Information

- The `vendor_post_login_redirect` cookie stores the post-auth destination path before the OAuth round-trip.
- New vendors without a record are automatically redirected to `/vendor/onboarding`.
- Admin override can bind a Google account to a specific vendor before automatic vendor creation occurs (useful for Street Collector's own account).

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]
- [[shopify]]

## Concepts Touched

- [[rbac]]
- [[vendor-portal]]
- [[collector-dashboard]]
- [[headless-architecture]]

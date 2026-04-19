---
title: "Supabase"
type: entity
tags: [technology, database, auth, backend]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-system-ssot, 2026-04-14-api-documentation, 2026-04-14-rbac-architecture]
---

# Supabase

Supabase is the primary backend platform: it provides the Postgres database, authentication layer, storage, and edge functions for The Street Collector.

## Overview

Supabase acts as the single backend for all server-side data operations. Postgres tables store orders, artworks, edition assignments, vendor data, and CRM records. Row-Level Security (RLS) policies enforce access control at the database layer, complemented by the RBAC system. Supabase Auth handles vendor and admin login (Google OAuth + email/password).

## Key Facts

- **Database**: Postgres with RLS policies on every sensitive table
- **Auth providers**: Google OAuth, email/password
- **Custom hook**: `Custom Access Token Hook` injects user roles into JWTs at login
- **Storage**: Used for artwork images, vendor media library
- **Edge Functions**: Supplementary serverless compute
- **Schema convention**: `public.has_role()` function (never `auth.has_role()` — requires superuser)

## Role in Domain

Supabase is the source of truth for all persistent data. The critical database join pattern is:

```sql
orders (shopify_id) ←→ order_line_items_v2 (order_id)
-- NEVER: orders (id UUID) ←→ order_line_items_v2 (order_id)
```

Auth sessions are issued as HTTP-only cookies (`vendor_session`, `admin_session`) after the Supabase OAuth flow completes.

## Appearances

- [[2026-04-14-system-ssot]] — critical join rules, auth flow, RLS patterns
- [[2026-04-14-api-documentation]] — session model, cookie strategy, vendor linkage
- [[2026-04-14-rbac-architecture]] — JWT claims, `public.has_role`, RLS integration

## Related

- [[shopify]]
- [[rbac]]
- [[the-street-collector]]
- [[certificate-of-authenticity]]

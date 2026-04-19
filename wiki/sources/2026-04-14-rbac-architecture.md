---
title: "RBAC Architecture"
type: source
tags: [rbac, security, database, auth, supabase]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# RBAC Architecture

Technical deep-dive into the Role-Based Access Control system: JWT claims injection, database schema, RLS policy design, and the `public.has_role()` fix.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/RBAC_ARCHITECTURE.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

The RBAC document describes the complete auth and permission flow using Mermaid diagrams. At login, Supabase fires a Custom Access Token Hook that queries `user_roles` and injects `user_roles`, `vendor_id`, `user_permissions`, and `rbac_version: 2.0` into the JWT. Every database query passes through RLS policies that call `public.has_role()` to check JWT claims.

A prior version used `auth.has_role()` which required superuser privileges — unavailable in managed Supabase — causing migration errors (`ERROR 42501: Permission Denied`). The fix was to move the helper to the `public` schema.

The database schema includes: `user_roles` (role assignments), `user_role_audit_log` (change history via triggers), `role_permissions` (permission definitions), `user_permission_overrides` (per-user customisation).

## Key Takeaways

- Custom Access Token Hook: queries `user_roles` table and injects claims into JWT at login.
- JWT claims: `user_roles: [admin, vendor, collector]`, `vendor_id: 123`, `user_permissions: [...]`, `rbac_version: 2.0`.
- `public.has_role()` is the RLS helper — replaces the broken `auth.has_role()`.
- Four DB tables: `user_roles`, `user_role_audit_log`, `role_permissions`, `user_permission_overrides`.
- Role changes only take effect at next login (JWT is not invalidated on role change).
- `rbac_version: 2.0` identifies the current correct schema.

## New Information

- The `auth.has_role()` approach was a specific bug in production migrations — documented here as a cautionary pattern.
- `user_role_audit_log` is populated by database triggers on `user_roles` changes — provides an immutable audit trail.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[supabase]]
- [[the-street-collector]]

## Concepts Touched

- [[rbac]]
- [[vendor-portal]]
- [[headless-architecture]]

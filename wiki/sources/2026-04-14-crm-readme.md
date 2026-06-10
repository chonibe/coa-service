---
title: "CRM System Feature Documentation"
type: source
tags: [crm, features, database, multi-platform, messaging]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# CRM System Feature Documentation

Detailed feature documentation for the multi-channel CRM system, including DB schema, API endpoints, UI components, and integration status.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/crm/README.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

The CRM system provides a unified customer relationship management layer integrated directly into the admin portal. It is modelled on Attio (for filter/contact UI patterns) with Apollo-grade additions (sequences, tasks, deal pipelines). All data is stored in Supabase under `crm_*` tables.

The system supports six channels: email (Gmail sync), Instagram, Facebook, WhatsApp, and Shopify. A unified inbox aggregates all inbound messages. Contacts can be deduplicated automatically. AI enrichment tables allow automated insight tagging. Custom fields allow extending contact records without schema migrations.

The implementation is substantially complete at the database and API layer. UI components cover people/company lists, detail pages, unified inbox, global search (Cmd+K), filter builder, timeline, platform badges, tags manager, activity creator, and deduplication UI.

## Key Takeaways

- Core Supabase tables: `crm_customers`, `crm_companies`, `crm_conversations`, `crm_messages`, `crm_activities`.
- Channels: email, Instagram, Facebook, WhatsApp, Shopify.
- Global search: `Cmd+K`.
- Contact deduplication: API + UI both implemented.
- AI enrichment tables exist (specifics not detailed in source).
- Gmail OAuth sync is per-admin-user; Instagram/WhatsApp webhooks handle inbound.
- WhatsApp webhook structure is ready but not fully wired.
- Filter builder uses Attio-style compound filter UI.

## New Information

- The CRM has an "Activity Creator" UI component distinct from the timeline — for logging new activities manually.
- Custom fields system allows field definitions + values without schema migrations.
- The platform badge system visually identifies which channel a message came from.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]

## Concepts Touched

- [[crm-system]]
- [[rbac]]
- [[vendor-portal]]

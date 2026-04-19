---
title: "CRM System"
type: concept
tags: [feature, crm, contacts, messaging, multi-platform]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-crm-readme, 2026-04-14-readme]
---

# CRM System

The CRM (Customer Relationship Management) system is a multi-channel contact and conversation management tool integrated into the admin portal, inspired by Attio with Apollo-grade additions.

## Definition

The CRM provides a unified inbox and contact management layer across email, Instagram, Facebook, WhatsApp, and Shopify. It supports conversation threads, activity timelines, custom fields, AI enrichment, contact deduplication, sequences, tasks/calls, and deal pipelines. All CRM data lives in Supabase under a set of `crm_*` tables.

## Key Claims

1. Core tables: `crm_customers`, `crm_companies`, `crm_conversations`, `crm_messages`, `crm_activities`.
2. Supported channels: email (Gmail sync), Instagram, Facebook, WhatsApp, Shopify.
3. Global search is available via `Cmd+K`.
4. Contact deduplication is a first-class feature with its own API and UI.
5. AI enrichment tables exist for automated insight generation.
6. Webhook handlers are in place for Instagram, Resend (email), and WhatsApp (structure ready).
7. The CRM is positioned as "Apollo-grade" — sequences, tasks/calls, deal pipelines are scope items.
8. Documentation lives at `docs/features/crm/README.md`.

## Evidence

- [[2026-04-14-crm-readme]] — full feature list, DB schema, implementation status
- [[2026-04-14-readme]] — CRM mentioned as a core platform feature

## Tensions

- Webhook-based multi-platform sync introduces eventual consistency — a message sent via Instagram may not appear in the CRM inbox immediately.
- Gmail OAuth requires per-admin authorisation, adding a setup step for new admin users.

## Related

- [[supabase]]
- [[the-street-collector]]
- [[vendor-portal]]
- [[rbac]]

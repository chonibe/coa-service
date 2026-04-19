---
title: "The Street Collector"
type: entity
tags: [organization, platform, brand, art]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-readme, 2026-04-14-vision, 2026-04-14-system-ssot]
---

# The Street Collector

The Street Collector is a digital art authentication and commerce platform built around NFC-verified Certificates of Authenticity.

## Overview

The Street Collector operates as a headless e-commerce and authentication platform serving three primary user groups: **vendors** (artists/galleries), **collectors** (buyers), and **admins** (platform operators). It connects Shopify storefronts to a custom Next.js/Supabase backend that issues tamper-proof digital certificates for physical and digital artworks.

## Key Facts

- **Primary domain**: `thestreetlamp.com` / `thestreetcollector.com`
- **Deployed on**: Vercel (Next.js App Router)
- **Backend**: Supabase (Postgres + Edge Functions)
- **Commerce layer**: Shopify (headless, via Storefront API)
- **Brand colour**: Dark theme with amber accents (`#F59E0B` family)
- **Admin emails**: `choni@thestreetlamp.com`, `chonibe@gmail.com`
- **Test customer ID**: `22952115175810`

## Role in Domain

The Street Collector is the central entity in this codebase. Every feature — NFC authentication, edition tracking, vendor payouts, CRM — exists to serve its marketplace of authenticated artworks. It is both the product being built and the organisation commissioning it.

## Appearances

- [[2026-04-14-readme]] — project overview, feature list, tech stack
- [[2026-04-14-vision]] — long-term VXO vision and implementation roadmap
- [[2026-04-14-system-ssot]] — production URLs, critical architecture rules

## Related

- [[supabase]]
- [[shopify]]
- [[vercel]]
- [[certificate-of-authenticity]]
- [[vendor-portal]]
- [[collector-dashboard]]

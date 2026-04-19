---
title: "Vercel"
type: entity
tags: [technology, deployment, hosting]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-system-ssot, 2026-04-14-readme]
---

# Vercel

Vercel is the deployment and hosting platform for the Next.js application that powers The Street Collector.

## Overview

The entire Next.js App Router application is deployed to Vercel. Environment variables (Supabase keys, Shopify tokens, Stripe keys, session secrets) are managed through Vercel's environment configuration. Vercel's edge network handles request routing and serverless function execution.

## Key Facts

- **Framework**: Next.js (App Router) — first-class Vercel support
- **Project name**: `street-collector` (Vercel project)
- **Production URL**: `https://street-collector-j4lnafeoj-chonibes-projects.vercel.app`
- **Primary domain**: `app.thestreetcollector.com`
- **Dashboard domain**: `dashboard.thestreetlamp.com` (assigned separately)
- **Environment variables**: Supabase URL/keys, Shopify tokens, Stripe keys, admin session secret, GA4 IDs
- **Performance targets**: Dashboard < 200ms, Certificate Modal < 100ms open time

## Role in Domain

Vercel is the deployment target for all frontend and API routes. Deployment happens via git push to `main`. Environment variables must be set in Vercel dashboard for production builds.

## Appearances

- [[2026-04-14-system-ssot]] — production URLs, domain configuration
- [[2026-04-14-readme]] — deployment instructions

## Related

- [[the-street-collector]]
- [[supabase]]
- [[headless-architecture]]

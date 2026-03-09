# PostHog Analytics Integration - 2026-03-09

**Commit:** `6aaf8875e`

## Overview

PostHog analytics integration for session replay, heatmaps, autocapture, funnel events, and e-commerce tracking. Events are sent directly to PostHog (CSP updated to allow domains). Reverted reverse-proxy approach due to 404/401 issues.

## Changes Made

### Files Created
- [ ] [lib/posthog.ts](../../lib/posthog.ts) – Funnel events (`captureFunnelEvent`), e-commerce helpers, `FunnelEvents` constants, `identifyUser`.

### Files Modified
- [ ] [app/providers.tsx](../../app/providers.tsx) – PostHog init (session replay, heatmaps, autocapture, pageleave, dead clicks, rageclick), `PostHogIdentify` for logged-in users.
- [ ] [app/layout.tsx](../../app/layout.tsx) – Runtime `__POSTHOG_KEY__` / `__POSTHOG_HOST__` script injection when env set.
- [ ] [next.config.js](../../next.config.js) – CSP: `script-src` + `connect-src` for `us.i.posthog.com`, `us-assets.i.posthog.com`.
- [ ] [app/collector/components/onboarding-wizard.tsx](../../app/collector/components/onboarding-wizard.tsx) – `captureFunnelEvent` for collector onboarding steps.
- [ ] [app/vendor/components/onboarding-wizard.tsx](../../app/vendor/components/onboarding-wizard.tsx) – `captureFunnelEvent` for vendor onboarding steps.
- [ ] [app/shop/experience/components/IntroQuiz.tsx](../../app/shop/experience/components/IntroQuiz.tsx) – `captureFunnelEvent` for experience quiz.
- [ ] [app/shop/experience/components/FilterPanel.tsx](../../app/shop/experience/components/FilterPanel.tsx) – `captureFunnelEvent` for filters.
- [ ] [app/shop/experience/components/ExperienceClient.tsx](../../app/shop/experience/components/ExperienceClient.tsx) – `captureFunnelEvent` for experience started.
- [ ] [lib/google-analytics.ts](../../lib/google-analytics.ts) – Mirror e-commerce events (`view_item`, `add_to_cart`, etc.) to PostHog.
- [ ] [docs/features/analytics/README.md](../../docs/features/analytics/README.md) – PostHog setup, troubleshooting (env, MCP verification), proxy note.
- [ ] [docs/features/analytics/EVENTS_MAP.md](../../docs/features/analytics/EVENTS_MAP.md) – PostHog funnel events documented.
- [ ] [.env.example](../../.env.example) – `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.
- [ ] [vercel.json](../../vercel.json) – PostHog proxy rewrites removed (reverted to direct API).

## Technical Implementation

### 1. PostHog init (`app/providers.tsx`)
- `PostHogWrapper`: `posthog.init(key, { api_host: host, session_recording, heatmaps, autocapture, ... })`.
- Pageview captured on `pathname` change.
- `PostHogIdentify`: identifies logged-in shop users with traits.

### 2. Funnel events (`lib/posthog.ts`)
- `captureFunnelEvent(eventName, properties)` – generic funnel event.
- `FunnelEvents` – constants for vendor/collector onboarding, experience quiz, filters.

### 3. E-commerce mirroring
- `lib/google-analytics.ts` calls PostHog helpers (`captureViewItem`, `captureAddToCart`, etc.) when GA4 e-commerce events fire.

### 4. CSP
- `script-src`: `https://us-assets.i.posthog.com`
- `connect-src`: `https://us.i.posthog.com`, `https://us-assets.i.posthog.com`

## Verification Checklist

- [ ] [lib/posthog.ts](../../lib/posthog.ts) – Funnel events and helpers exported.
- [ ] [app/providers.tsx](../../app/providers.tsx) – PostHog init + identify.
- [ ] [app/layout.tsx](../../app/layout.tsx) – Key injection script.
- [ ] [next.config.js](../../next.config.js) – CSP allows PostHog.
- [ ] [docs/features/analytics/README.md](../../docs/features/analytics/README.md) – PostHog troubleshooting.
- [ ] Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local` and Vercel.

## Post-commit: Required Step

Ensure `NEXT_PUBLIC_POSTHOG_KEY` (from [PostHog Project Settings](https://app.posthog.com/project/settings)) is set in Vercel production env and redeploy. Verify events via PostHog MCP (`event-definitions-list`) or PostHog UI.

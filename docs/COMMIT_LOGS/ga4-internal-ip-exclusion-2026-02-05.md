# GA4 Internal IP Exclusion - 2026-02-05

## Overview
Exclude internal/team traffic (your IP) from Google Analytics so your own visits don't inflate metrics. Implemented via an internal-check API and conditional GA initialization.

## Changes Made

### Files Created
- [ ] [app/api/analytics/internal-check/route.ts](../../app/api/analytics/internal-check/route.ts) – GET endpoint that returns `{ internal: true|false }` based on request IP vs `INTERNAL_IP_ADDRESSES` env.

### Files Modified
- [ ] [components/google-analytics.tsx](../../components/google-analytics.tsx) – Calls internal-check before initializing GA; skips `initGA()` and `trackPageView()` when `internal: true`.
- [ ] [.env.example](../../.env.example) – Added comment and example for `INTERNAL_IP_ADDRESSES`.
- [ ] [GA4_MANUAL_SETUP_GUIDE.md](../../GA4_MANUAL_SETUP_GUIDE.md) – New section "Exclude Internal / Your IP from Analytics" (Option A: app env, Option B: GA4 Admin data filters).
- [ ] [GA4_TROUBLESHOOTING_CHECKLIST.md](../../GA4_TROUBLESHOOTING_CHECKLIST.md) – New Issue 5: "Seeing your own IP in analytics" with fix and doc link.

## Technical Implementation

### 1. Internal-check API
**Location:** `app/api/analytics/internal-check/route.ts`

- **GET** `/api/analytics/internal-check`
- Reads client IP from `x-forwarded-for` or `x-real-ip` (proxy-safe).
- Compares to comma-separated `INTERNAL_IP_ADDRESSES` env (optional).
- Returns `{ internal: false }` when env is unset or IP not in list; `{ internal: true }` when IP is in list.

### 2. Google Analytics component
**Location:** `components/google-analytics.tsx`

- On mount: `fetch('/api/analytics/internal-check')`.
- If `data.internal === true`: set `gaReady = false`, do not call `initGA()` or `trackPageView()`.
- If not internal or fetch fails: set `gaReady = true`, init GA and track page view as before.
- Route-change listener only runs when `gaReady === true`.

### 3. Configuration
- **Env:** `INTERNAL_IP_ADDRESSES` (comma-separated IPs, e.g. `203.0.113.50,198.51.100.10`).
- Add to `.env.local`; restart dev/server or redeploy. No GA events are sent from those IPs.

## Verification Checklist

- [ ] [app/api/analytics/internal-check/route.ts](../../app/api/analytics/internal-check/route.ts) – Internal-check route returns `internal` based on IP.
- [ ] [components/google-analytics.tsx](../../components/google-analytics.tsx) – GA skipped when internal-check returns `internal: true`.
- [ ] [.env.example](../../.env.example) – Documents `INTERNAL_IP_ADDRESSES`.
- [ ] [GA4_MANUAL_SETUP_GUIDE.md](../../GA4_MANUAL_SETUP_GUIDE.md) – Exclude internal traffic section present.
- [ ] [GA4_TROUBLESHOOTING_CHECKLIST.md](../../GA4_TROUBLESHOOTING_CHECKLIST.md) – Issue 5 and link to guide.

## Post-commit: Required Step

Add your IP(s) to `.env.local` (not committed):

```bash
INTERNAL_IP_ADDRESSES=your.ip.here
```

Use [whatismyip.com](https://www.whatismyip.com/) or similar to get your IP. Restart the app after adding.

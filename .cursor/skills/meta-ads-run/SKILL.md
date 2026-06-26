---
name: meta-ads-run
description: "End-to-end Meta (Facebook/Instagram) ads workflow for Street Collector. Use when launching, auditing, or optimizing Meta campaigns via MCP — account setup, pre-flight checks, campaign creation (PAUSED), creative, tracking validation, and performance review. Triggers: 'run Meta ads', 'launch Facebook campaign', 'Meta ads prep', 'Facebook ads setup', 'create Meta campaign', 'audit ad account'."
metadata:
  version: 1.0.0
---

# Meta Ads Run (Street Collector)

Orchestrates Meta Ads execution using MCP tools + companion skills. **Default to safety:** read-only first, all new campaigns/ad sets/ads **PAUSED** until the operator explicitly activates.

## Before every session

1. Read [`.agents/product-marketing-context.md`](../../.agents/product-marketing-context.md) if it exists.
2. Confirm MCP connected: Cursor Settings → MCP → `meta-ads` and/or `meta-ads-pipeboard` (OAuth complete).
3. Load skills as needed:
   - [`meta-ads-analyzer`](../meta-ads-analyzer/SKILL.md) — diagnosis & optimization reports
   - [`ad-creative`](../ad-creative/SKILL.md) — headlines, primary text, hooks
   - [`product-marketing-context`](../product-marketing-context/SKILL.md) — update positioning context

## MCP routing

| Task | Preferred server |
|------|------------------|
| List accounts, insights, recommendations | `meta-ads` (official) if enabled; else `meta-ads-pipeboard` |
| Create campaigns, upload images, targeting search | `meta-ads-pipeboard` (42 tools, mature harness) |
| Catalog / dataset diagnostics | `meta-ads` (official) |

Harness repos: [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) · [mathiaschu/meta-ads-analyzer](https://github.com/mathiaschu/meta-ads-analyzer)

Config: [`.cursor/mcp.json`](../../.cursor/mcp.json)

## Pre-flight checklist (run before first spend)

Mark each item; stop and report blockers before creating live campaigns.

### Account & access
- [ ] Meta Business Manager admin on target ad account
- [ ] Facebook Page + Instagram account connected to ad account
- [ ] Payment method active; billing threshold understood
- [ ] MCP OAuth completed (start **read-only** scope)

### Tracking (Street Collector — already implemented in repo)
- [ ] `NEXT_PUBLIC_META_PIXEL_ID` set in Vercel ([analytics doc](../../docs/features/analytics/README.md))
- [ ] CAPI env: `META_DATASET_API_KEY`, `META_DATASET_ID` / `META_PIXEL_ID`
- [ ] Events Manager: `Purchase`, `InitiateCheckout`, `AddToCart`, `ViewContent`, `Lead` receiving events
- [ ] AEM event priority configured (Purchase > InitiateCheckout > AddToCart > ViewContent)
- [ ] Optional: `META_TEST_EVENT_CODE` for staging validation
- [ ] Diagnostics: hit `/api/meta/diagnostics` (admin) for EMQ readiness

### Creative & landing
- [ ] Primary landing URL: `/experience` (configurator) or `/shop/street-collector`
- [ ] UTM template agreed: `utm_source=facebook&utm_medium=paid&utm_campaign={campaign}`
- [ ] At least 3 creative angles (video + static) per [`ad-creative`](../ad-creative/SKILL.md)
- [ ] Mobile-first creative (9:16 stories/reels + 1:1 feed)

### Campaign structure (default prospecting)
- [ ] Objective: **Sales** (website conversions) or **Traffic** (top-funnel tests)
- [ ] Conversion event: **Purchase** (or InitiateCheckout for learning phase)
- [ ] Budget: daily cap set; start conservative ($50–100/day test)
- [ ] Naming: `META_{Objective}_{Audience}_{Offer}_{YYYY-MM}`

## Launch workflow

### Phase 1 — Audit (read-only)
1. List ad accounts → pick `act_XXXXX`
2. Pull last 7–30 day account insights (spend, CPA, ROAS, frequency)
3. Check active campaigns, learning phase, recommendations API
4. Run [`meta-ads-analyzer`](../meta-ads-analyzer/SKILL.md) report if historical data exists

### Phase 2 — Plan
Confirm with operator:
- Objective, budget, geo, audience (broad vs interest vs LAL)
- Offer: lamp ($99+) + artworks from $40
- Exclusions: existing purchasers (Custom Audience) if available

### Phase 3 — Build (writes — PAUSED only)
1. Create campaign → **PAUSED**
2. Create ad set(s) → **PAUSED** — targeting, budget, optimization event
3. Generate copy via [`ad-creative`](../ad-creative/SKILL.md)
4. Upload creatives → create ads → **PAUSED**
5. Present summary table: names, budgets, audiences, creative previews
6. **Do not activate** until operator says "activate" or "go live"

### Phase 4 — Activate (explicit approval only)
- Operator confirms campaign IDs to turn on
- Activate one ad set first when testing; scale after 3–7 days stable CPA

### Phase 5 — Monitor
- Day 1–3: learning phase — minimal edits
- Day 4–7: [`meta-ads-analyzer`](../meta-ads-analyzer/SKILL.md) weekly report
- Correlate Meta with PostHog funnels (experience → checkout → purchase)

## Street Collector messaging anchors

From [`.agents/product-marketing-context.md`](../../.agents/product-marketing-context.md):
- **Hook:** "Not just a lamp. A living art collection."
- **Proof:** 3000+ collectors, free worldwide shipping, 12-month guarantee, 30-day returns
- **Price:** Starting at $99 lamp · artworks from $40
- **CTA:** Start your collection → `/experience`

## Safety rules (non-negotiable)

1. Never increase budget >20% in one step without operator approval
2. Never activate campaigns the operator did not review
3. Never recommend pausing segments on average CPA alone (see Breakdown Effect in meta-ads-analyzer)
4. Log every write action: entity ID, field changed, old → new value
5. If `is_ads_mcp_enabled: false` on official MCP, fall back to Pipeboard

## Example prompts

- "Run the Meta ads pre-flight checklist and report blockers."
- "List my ad accounts and summarize active campaign performance (last 7 days)."
- "Create a PAUSED prospecting campaign for the Street Lamp — $75/day, US+UK, broad 25–54, optimize for Purchase."
- "Generate 5 primary text + headline pairs for video creative (collector / gift / design angles)."
- "Weekly Meta audit: learning phase, creative fatigue, budget allocation — use Breakdown Effect lens."

## Measurement (post-launch)

After campaigns go live:

- [Measurement checklist](../../docs/features/meta-ads/README.md#measurement-checklist) — pixel, UTMs, weekly Meta + PostHog join
- [PostHog Meta funnel spec](../../docs/features/meta-ads/POSTHOG_META_FUNNEL.md) — funnels, trends, abandoners cohort, replay filters
- [`meta-ads-analyzer`](../meta-ads-analyzer/SKILL.md) — diagnosis before pausing segments or scaling budget

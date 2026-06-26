# Meta Ads (MCP + Agent Workflow)

## Overview

Street Collector runs Meta (Facebook/Instagram) ads through AI agents in Cursor, connected via MCP servers. This doc covers MCP setup, the GitHub harness stack, agent skills, tracking readiness, and the launch checklist.

**Version:** 1.1.0  
**Last updated:** 2026-06-25

## Implementation files

| File | Purpose |
|------|---------|
| [`.cursor/mcp.json`](../../../.cursor/mcp.json) | MCP server config (`meta-ads`, `meta-ads-pipeboard`) |
| [`skills/meta-ads-run/SKILL.md`](../../../skills/meta-ads-run/SKILL.md) | End-to-end launch workflow |
| [`skills/meta-ads-analyzer/SKILL.md`](../../../skills/meta-ads-analyzer/SKILL.md) | Expert diagnosis (Breakdown Effect, learning phase) |
| [`.agents/product-marketing-context.md`](../../../.agents/product-marketing-context.md) | Positioning + ad messaging anchors |
| [`docs/features/analytics/README.md`](../analytics/README.md) | Meta Pixel + CAPI + PostHog |
| [`POSTHOG_META_FUNNEL.md`](./POSTHOG_META_FUNNEL.md) | PostHog funnel / trend / cohort specs for paid Meta traffic |
| [`lib/posthog.ts`](../../../lib/posthog.ts) | UTM person properties + checkout `identify(email)` |

## MCP servers

### Official Meta Ads MCP

- **URL:** `https://mcp.facebook.com/ads`
- **Auth:** Meta Business OAuth (read-only → read/write → read/write/financial)
- **Tools:** 29 (campaigns, insights, catalogs, dataset quality)
- **Docs:** [Meta Business Help — Ads AI connectors](https://www.facebook.com/business/help/1456422242197840)
- **Note:** Open beta; some accounts show `is_ads_mcp_enabled: false` until rolled out

### Pipeboard Meta Ads MCP (community harness)

- **URL:** `https://meta-ads.mcp.pipeboard.co/`
- **GitHub:** [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) (~1,006★)
- **Tools:** 42 (full CRUD, creatives, targeting, insights)
- **Auth:** [pipeboard.co](https://pipeboard.co) OAuth or API token in URL

### Cursor setup

1. Config is in [`.cursor/mcp.json`](../../../.cursor/mcp.json)
2. Restart Cursor
3. Settings → MCP → complete OAuth on each server
4. Run `npm run skills:sync` after skill changes

## Agent skills stack

| Skill | Role |
|-------|------|
| `meta-ads-run` | Pre-flight, launch, safety rules |
| `meta-ads-analyzer` | Performance diagnosis ([mathiaschu/meta-ads-analyzer](https://github.com/mathiaschu/meta-ads-analyzer)) |
| `ad-creative` | Headlines, primary text, hooks |
| `product-marketing-context` | ICP, positioning, proof points |

Sync: `npm run skills:sync`

## Tracking readiness (already in codebase)

Meta conversion tracking is implemented. Before spending:

- [ ] Verify env in Vercel: `NEXT_PUBLIC_META_PIXEL_ID`, `META_DATASET_API_KEY`, `META_DATASET_ID`
- [ ] Events Manager: test `Purchase`, `InitiateCheckout`, `AddToCart`, `ViewContent`
- [ ] AEM priority: Purchase > InitiateCheckout > AddToCart > ViewContent
- [ ] Admin diagnostics: `/api/meta/diagnostics`
- [ ] Optional staging: `META_TEST_EVENT_CODE`

See [analytics README](../analytics/README.md) for CAPI, custom audiences, and PostHog correlation.

## Measurement checklist

One-page reference before scaling spend. PostHog UI specs: [POSTHOG_META_FUNNEL.md](./POSTHOG_META_FUNNEL.md).

### A. Before spend (blocking)

- [ ] **Single pixel/dataset** — codebase uses **Website Events** (`1315234756106483`). Account also has legacy pixel **The Street lamp** (`334303304351060`). Confirm production fires Website Events today in [Events Manager](https://business.facebook.com/events_manager2/list/dataset/1315234756106483).
- [ ] **Vercel env** — `NEXT_PUBLIC_META_PIXEL_ID`, `META_DATASET_API_KEY`, `META_DATASET_ID`, `PIPEBOARD_API_TOKEN` (value must be non-empty, not just the variable name).
- [ ] **AEM priority** — Purchase > InitiateCheckout > AddToCart > ViewContent > AddPaymentInfo > PageView > Lead.
- [ ] **UTM on every ad URL** — `utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`
- [ ] **Landing** — `https://www.thestreetcollector.com/experience` (or `/shop/street-collector` for brand tests).
- [ ] **CAPI smoke test** — `META_TEST_EVENT_CODE` in Events Manager Test Events tab.

### B. What Meta must report (weekly via Pipeboard)

| Dimension | Pipeboard tool | Why |
|-----------|----------------|-----|
| Campaign / ad set / ad | `get_insights` (level) | CPA, ROAS |
| `publisher_platform`, `platform_position` | insights breakdown | Feed vs Reels vs Stories |
| `age`, `gender`, `country` | insights breakdown | Audience fit |
| Ad name / creative | `get_ads` + ad-level insights | Clone winners (e.g. affiliate video + website broad) |

Primary ad account: `act_520124702145117` (Qmtppoo / Thestreetlamp).

### C. What PostHog must report

| Signal | Where |
|--------|--------|
| First-touch UTMs | Person: `initial_utm_source`, `initial_utm_medium`, `initial_utm_campaign`, `initial_utm_content`, `initial_fbclid` |
| Session UTMs on conversion | Event props on `begin_checkout`, `purchase` |
| Funnel by campaign | Breakdown `initial_utm_campaign` — see [POSTHOG_META_FUNNEL.md](./POSTHOG_META_FUNNEL.md) |
| Weekly join vs Meta spend | Manual spreadsheet (template in POSTHOG_META_FUNNEL) |

### D. Campaign metadata (naming + external log)

**Naming:** `META_{Objective}_{Audience}_{Angle}_{Landing}_{YYYY-MM}`

**Log in sheet** (not in Meta API): creative angle, landing path, audience type (retarget-30d / broad / LAL), affiliate source.

**Proven template (historical):** affiliate video → new landing + website 30-day retargeting (`Sales Campaign - new site -affiliate`).

### E. What Meta alone cannot explain

High landing-page views + checkouts with **zero purchases** (e.g. Mar 2026 “New Sales” campaigns) requires PostHog funnel + session replay — checkout errors, offer mismatch, or wrong pixel. Do not scale spend on Meta LPV metrics without PostHog `purchase` by `initial_utm_campaign`.

### F. Operating rhythm (weekly)

1. Pipeboard — spend, CPA, placement breakdowns.
2. PostHog — Funnel 1 from [POSTHOG_META_FUNNEL.md](./POSTHOG_META_FUNNEL.md) by campaign.
3. [`meta-ads-analyzer`](../../../skills/meta-ads-analyzer/SKILL.md) — learning phase, Breakdown Effect before pausing segments.
4. [`meta-ads-run`](../../../skills/meta-ads-run/SKILL.md) — safety rules on any budget change.


Use [`skills/meta-ads-run/SKILL.md`](../../../skills/meta-ads-run/SKILL.md) in Cursor:

1. MCP OAuth connected (read-only first)
2. Business Manager admin on ad account
3. Page + Instagram linked
4. Pixel/CAPI firing
5. Landing URLs + UTMs defined
6. Creative assets ready (video 9:16 + static 1:1)
7. Campaigns created **PAUSED** until human approval

## Safety

- New campaigns/ad sets/ads default **PAUSED** (official MCP + Pipeboard)
- No budget increases >20% without explicit approval
- Use `meta-ads-analyzer` Breakdown Effect rules before pausing segments
- Official Meta CLI creates **active** ads by default — prefer MCP for conversational flows

## Test plan

- [ ] MCP: "List my Meta ad accounts" returns `act_*` IDs
- [ ] Insights: last 7 days spend/CPA pull succeeds
- [ ] Create test campaign in **PAUSED** state; verify in Ads Manager
- [ ] Events Manager test event with `META_TEST_EVENT_CODE`
- [ ] PostHog funnel: Meta `purchase` mirrored from CAPI

## Known limitations

- Official MCP beta rollout is gradual (region/account dependent)
- Pipeboard requires third-party OAuth (not Meta-official)
- Creative upload via MCP needs public image URLs (no local file paths on official server)
- Marketing API rate limits apply to both servers

## Future improvements

- [ ] Import `paid-ads` skill into repo `skills/` (currently global Cursor skill only)
- [ ] Automated weekly Meta audit cron + Slack summary
- [ ] Lookalike audience creation playbook once purchaser volume threshold met

## Change log

| Date | Change |
|------|--------|
| 2026-06-25 | v1.1.0 — Measurement checklist, [POSTHOG_META_FUNNEL.md](./POSTHOG_META_FUNNEL.md), pixel dual-dataset note, weekly operating rhythm |
| 2026-06-25 | PostHog first-touch UTM person properties (`initial_utm_*`, `initial_fbclid`) and guest checkout `identify(email)` for Meta/PostHog funnel merge |
| 2026-06-25 | Initial MCP config, meta-ads-run + meta-ads-analyzer skills, product marketing context V1 |

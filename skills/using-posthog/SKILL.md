---
name: using-posthog
description: Works with PostHog product analytics in this codebase—events, person properties, cohorts, funnels, feature flags, session context, and EU vs US hosting. Use when the user asks about PostHog, cohorts not matching, funnel or replay debugging, syncing definitions to PostHog, or verifying telemetry. Supplements the UI and REST scripts with optional MCP-backed inspection when the PostHog MCP server is available.
---

# Using PostHog (COA Service)

## When to use

- Instrumentation, event naming, or **why cohorts / insights look empty or wrong**.
- **Person properties** and **session-scoped context** for behavioral segmentation.
- **Pushing or updating** cohorts and related definitions (scripts + API).
- **EU vs US** PostHog region mismatches (ingest, REST API, MCP).
- Optional: **live project inspection** (schema, queries, flags) via PostHog’s MCP when it is connected and healthy.

## Code map (this repo)

| Concern | Where |
|--------|--------|
| Client capture, funnel helpers, session activity props | `lib/posthog.ts` |
| PostHog init (`person_profiles`, pageview context) | `app/providers.tsx` |
| Server-side capture | `lib/posthog-server.ts` |
| Feature flags hook | `hooks/use-posthog-feature-flag.ts` |
| CSP allowlists for ingest/assets | `next.config.js` |
| Browser env | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| Full setup (dashboards, insights, cohort definitions) | `scripts/setup-posthog-insights.js` |
| Cohort-only sync (PATCH by name) | `scripts/sync-posthog-cohorts.js` → `npm run sync:posthog-cohorts` |
| Audit / health checks | `scripts/posthog-audit.js` |

Run sync/audit with env in `.env.local` or `.env` (see script headers).

## Instrumentation principles

1. **One naming scheme** — Prefer stable `snake_case` event names and property keys; match what you define in PostHog (actions, cohorts, insights).
2. **Person properties for cohorts** — Anonymous and identified segmentation needs person properties to be sent and stored. This project uses `person_profiles: "always"` in `app/providers.tsx` so person-property cohorts behave as expected (contrast: `identified_only`, which skips full profiles for anonymous users).
3. **Session vs activity path** — `session_entry_path` (and person mirror `last_session_entry_path`) reflect the **first path in that browser tab**; `activity_path` is the **current** path. Cohorts that require “first path contains X” are **much narrower** than “ever visited X”; interpret empty cohorts accordingly.
4. **Identify merges** — When users log in, merge quiz/A/B traits via existing helpers (e.g. `getPostHogIdentifyTraitsFromClientStorage` in `lib/posthog.ts`) so person properties stay aligned with client state.

## Cohorts and definitions

- **Source of truth in git** — Cohort filter JSON lives in `scripts/setup-posthog-insights.js`. The app must emit the events/properties those filters use.
- **Stale UI definitions** — If the script previously skipped updates, PostHog can keep old rules. Use cohort sync with PATCH enabled (default for `sync-posthog-cohorts.js`) to align remote definitions with the repo.
- **REST vs MCP** — Pushing cohorts is implemented via the **PostHog REST API** in this repo (no MCP required). If MCP is available, you can still list/update cohorts through MCP tools **after** reading the tool schema (see [reference.md](reference.md)).

## EU / US region

- **Ingest and API host must match the project region.** Calling the US API with an EU project (or vice versa) commonly surfaces as **401** on REST calls.
- `scripts/sync-posthog-cohorts.js` sets `POSTHOG_HOST` from `NEXT_PUBLIC_POSTHOG_HOST` when unset—keep those aligned with production.
- MCP endpoints are region-specific: US `https://mcp.posthog.com/mcp`, EU `https://mcp-eu.posthog.com/mcp` ([PostHog MCP](https://posthog.com/docs/model-context-protocol)).

## Optional: PostHog MCP (live inspection)

Use MCP to **explore** the connected project (data schema, queries, docs search, flags, errors)—not as the only way to work.

1. Confirm the server is **healthy** in Cursor (if `plugin-posthog-posthog` / PostHog MCP shows an error, rely on the PostHog app and repo scripts instead of pretending tools work).
2. **Read each tool’s JSON schema** in the MCP tools folder (or IDE tool list) before invoking; parameter names are not guessable.
3. Prefer read-only tools first (`read-data-schema`, `event-definitions-list`, `query-run`, `docs-search`, …), then mutations when the user explicitly wants changes.

Tool categories and names are summarized in [reference.md](reference.md); the authoritative list is in the [PostHog MCP documentation](https://posthog.com/docs/model-context-protocol).

## Session learnings (from prior project debugging)

These came from real fixes in this codebase and related chats; use them when triaging “cohorts don’t work”:

- Empty or tiny cohorts often mean **filter logic is stricter than product intent** (e.g. first-tab path vs any visit), not always broken ingestion.
- **`person_profiles: "identified_only"`** blocks the person-property behavior many cohorts assume for anonymous traffic; align init with cohort design.
- **401 on cohort sync** — verify **personal API key** and **region host** (EU vs US), not only the key string.
- **Purchase-based cohorts** need properties actually set at checkout (not only on a single page).

## Workflow checklist

- [ ] Confirm `NEXT_PUBLIC_POSTHOG_HOST` / `POSTHOG_HOST` match the project region.
- [ ] Confirm `person_profiles` and emitted properties match cohort definitions.
- [ ] Cross-check event and property names in `lib/posthog.ts` (and call sites) against PostHog definitions.
- [ ] Use `npm run sync:posthog-cohorts` when remote cohort JSON should match `setup-posthog-insights.js`.
- [ ] If using MCP: server healthy → read tool schema → query before mutating.

## Further reading

- [reference.md](reference.md) — MCP tool map, env vars, API links.

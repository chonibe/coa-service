---
name: posthog-mcp-cursor
description: Uses the official PostHog Model Context Protocol server from Cursor to query analytics, manage feature flags, cohorts, insights, experiments, errors, and docs. Use when the user asks to use PostHog MCP, inspect PostHog data in-app, create or update flags/cohorts/dashboards, run HogQL or insights, debug error tracking, or align server configuration (US/EU, project pinning) with the PostHog plugin.
---

# PostHog MCP in Cursor

## When to use

- Tasks that should **read or change PostHog project state** (flags, cohorts, insights, dashboards, experiments, persons, surveys, SQL/HogQL) via MCP tools.
- **Debugging** errors, funnels, or properties using PostHog data instead of guessing from code alone.
- **Setup or troubleshooting** the PostHog MCP connection (wizard, `mcp.json`, EU region, pinned org/project).

For **adding `capture()` / client instrumentation** in this repo, follow existing patterns in `lib/posthog.ts` and related imports; use the separate **posthog-instrumentation** skill when the user only wants code-level tracking.

## Prerequisites

1. **PostHog MCP enabled** in the editor and authenticated (OAuth or personal API key).
2. **Personal API key** with the [MCP Server preset](https://app.posthog.com/settings/user-api-keys?preset=mcp_server) if the client uses Bearer auth.
3. Correct **region base URL**:
   - US: `https://mcp.posthog.com/mcp`
   - EU: `https://mcp-eu.posthog.com/mcp`

Quick install (official): `npx @posthog/wizard mcp add`  
Manual Cursor config: [PostHog MCP + Cursor](https://posthog.com/docs/model-context-protocol/cursor.md).

If the MCP server shows as errored in Cursor, stop and ask the human to fix **Cursor Settings → MCP** (keys, URL, network); do not pretend tool calls succeeded.

## Mandatory tool usage (Cursor)

1. **Resolve the server id** for this workspace: it may appear as `posthog` (user `mcp.json`) or `plugin-posthog-posthog` (Cursor PostHog plugin). Use the name shown in the MCP file-system listing or IDE settings.
2. **Before the first call to any tool**, read that tool’s schema/descriptor (JSON under the MCP tools folder, or the client’s tool list). **Do not** guess parameter names or shapes.
3. Prefer **read-only** tools first (`read-data-schema`, `event-definitions-list`, `query-run`, `docs-search`, `list-errors`, etc.) before create/update/delete.
4. For **destructive** operations (delete flag, bulk delete persons, etc.), confirm intent with the user when context is ambiguous.

## Configuration patterns (from PostHog)

- **Pin org/project** (optional): headers `x-posthog-organization-id` and `x-posthog-project-id` on the MCP URL request. When `project_id` is pinned, `switch-organization` and `switch-project` are omitted from the tool list.
- **Limit tools by feature** (least privilege): append `?features=...` to the MCP URL. Example: `?features=flags,cohorts,insights`. Underscores and hyphens are equivalent (e.g. `error_tracking` vs `error-tracking`).
- **Security**: treat MCP as privileged; [prompt injection](https://posthog.com/docs/model-context-protocol) against untrusted content applies—review tool calls before approving in the UI.

## What the MCP is good for (high level)

| Goal | Typical tools (names vary slightly; always verify schema) |
|------|------------------------------------------------------------|
| Explore events/properties | `read-data-schema`, `event-definitions-list`, `properties-list` |
| Trends / funnels / paths | `query-run`, `query-trends`, `query-funnel`, insights tools |
| Feature flags | `create-feature-flag`, `update-feature-flag`, `feature-flag-get-all`, … |
| Experiments | `experiment-create`, `experiment-results-get`, … |
| Cohorts | `cohorts-list`, `cohorts-create`, `cohorts-partial-update`, … |
| Errors | `list-errors`, `error-details`, `error-tracking-issues-list`, … |
| Docs | `docs-search` |
| Ad hoc SQL/HogQL | `execute-sql` |

Authoritative catalog: [PostHog Model Context Protocol](https://posthog.com/docs/model-context-protocol) (full tool tables and examples).

## This repository (COA Service)

Use MCP for **cloud PostHog**; use repo code for **what the app sends**:

| Area | Location |
|------|----------|
| Client funnel helpers, session context, quiz/A/B traits | `lib/posthog.ts` |
| Server-side capture (API routes, webhooks) | `lib/posthog-server.ts` |
| Feature flag hook | `hooks/use-posthog-feature-flag.ts` |
| CSP / ingest hosts | `next.config.js` (PostHog domains) |
| Env keys (browser) | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| Scripts (insights/cohorts automation) | `scripts/setup-posthog-insights.js`, `scripts/sync-posthog-cohorts.js` |

Keep **event names and properties** in code aligned with what you create in PostHog (actions, cohorts, insights) so MCP-driven definitions match production telemetry.

## Workflow checklist

- [ ] MCP server healthy in Cursor; correct US vs EU URL.
- [ ] Read tool schema before calling.
- [ ] Start with schema/docs/query tools; then mutations if needed.
- [ ] Cross-check important event names against `lib/posthog.ts` (and related call sites).

## Further detail

- [reference.md](reference.md) — links, example prompts, sync note for this repo.

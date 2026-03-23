# Using PostHog — reference

## PostHog docs

- [Model Context Protocol](https://posthog.com/docs/model-context-protocol) — MCP URLs (US/EU), pinning, `?features=` tool filtering, full tool tables, security notes.
- [Cursor + MCP](https://posthog.com/docs/model-context-protocol/cursor.md) — editor setup.
- [Cohorts API](https://posthog.com/docs/api/cohorts) — used by `scripts/sync-posthog-cohorts.js` / `setup-posthog-insights.js`.

## Env vars (cohort sync / audit)

| Variable | Role |
|----------|------|
| `POSTHOG_PERSONAL_API_KEY` | `phx_...` — cohort create/update (scopes e.g. cohort read/write) |
| `POSTHOG_PROJECT_ID` | Numeric project id |
| `POSTHOG_HOST` | e.g. `https://eu.i.posthog.com` or `https://us.i.posthog.com` — **must match project region** |
| `NEXT_PUBLIC_POSTHOG_HOST` | If set, cohort sync may default `POSTHOG_HOST` to this |

## MCP tool map (verify names against live schema)

The server exposes many tools; names are stable-ish but **always read the descriptor JSON** before calling. Grouped by purpose (from PostHog’s published MCP docs):

| Area | Representative tools |
|------|------------------------|
| Schema / definitions | `read-data-schema`, `event-definitions-list`, `properties-list` |
| Query | `query-run`, `query-trends`, `query-funnel`, `execute-sql`, `query-generate-hogql-from-question` |
| Insights | `insight-*`, `insights-get-all` |
| Cohorts | `cohorts-list`, `cohorts-create`, `cohorts-partial-update`, … |
| Feature flags | `create-feature-flag`, `update-feature-flag`, `feature-flag-get-all`, … |
| Experiments | `experiment-create`, `experiment-results-get`, … |
| Errors | `list-errors`, `error-details`, `error-tracking-issues-list`, … |
| Docs | `docs-search` |

Server id in Cursor may be `posthog` or `plugin-posthog-posthog` depending on install type.

## Agent transcripts (this workspace)

Prior debugging for PostHog cohorts and sync is captured under the workspace agent transcripts path (see repo `CLAUDE.md` / Cursor docs). Search those JSONL files for `posthog`, `cohort`, `POSTHOG_HOST`, and `person_profiles` when you need full conversational context beyond this skill.

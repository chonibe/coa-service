# PostHog MCP — reference

## Canonical documentation

- Full tool list, feature flags for URL filtering, pinning, and security notes: [Model Context Protocol (PostHog)](https://posthog.com/docs/model-context-protocol)
- Cursor-specific install: [Cursor](https://posthog.com/docs/model-context-protocol/cursor.md)
- Invoking tools via HTTP (advanced): [MCP tools API](https://posthog.com/docs/api/mcp-tools)

## Example agent prompts (from PostHog docs)

- Feature flags: e.g. create flag with rollout %; multivariate flags with integer percentages summing to 100.
- Analytics: trends, paths, funnels via `query-run` / `query-funnel` / `query-trends`.
- SQL/HogQL: `execute-sql` for system tables (e.g. feature flags metadata) and `events` analytics.
- Experiments: `experiment-create` with funnel-style metrics.
- Errors: `list-errors`, issue detail/update tools.
- Logs: `logs-query` with service/severity filters.

## Repo maintenance

After editing `skills/posthog-mcp-cursor/`, run from repository root:

```bash
npm run skills:sync
```

This copies the skill into `.cursor/skills/` for Cursor. Canonical source remains `skills/`.

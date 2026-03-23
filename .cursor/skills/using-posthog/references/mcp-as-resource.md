# PostHog MCP as an enrichment resource

The skill’s **core** is PostHog product knowledge (see [product-domains.md](product-domains.md)). **MCP** is optional: use it when connected and healthy to **search docs**, **inspect the live project schema**, **run queries**, or **manage definitions**—so answers match the user’s actual taxonomy and region.

**Framing:** If MCP is available, prefer it to confirm project-specific names and run read-only exploration before suggesting mutations. If MCP is unavailable, use [PostHog docs](https://posthog.com/docs), the in-app UI, and user-supplied context.

---

## Endpoints and auth

| Region | MCP URL |
|--------|---------|
| US (default) | `https://mcp.posthog.com/mcp` |
| EU | `https://mcp-eu.posthog.com/mcp` |

Authentication: personal API key (e.g. MCP preset) or OAuth per [Model Context Protocol](https://posthog.com/docs/model-context-protocol) and [Cursor](https://posthog.com/docs/model-context-protocol/cursor.md).

**Pinning (optional):** Headers `x-posthog-organization-id` and `x-posthog-project-id` restrict context; when `project_id` is pinned, `switch-organization` and `switch-project` tools are omitted.

**Least privilege:** Append `?features=...` to the MCP URL to expose only needed tool groups (hyphens and underscores equivalent), e.g. `?features=flags,cohorts,insights`.

---

## `features=` matrix (tool exposure)

Source: [PostHog MCP documentation](https://posthog.com/docs/model-context-protocol).

| Feature key | Product area |
|-------------|----------------|
| `workspace` | Organization and project management |
| `actions` | Action definitions |
| `activity_logs` | Activity log viewing |
| `alerts` | Alert management |
| `annotations` | Annotations |
| `cohorts` | Cohort management |
| `dashboards` | Dashboards |
| `data_schema` | Schema exploration |
| `data_warehouse` | Data warehouse |
| `debug` | Debug / diagnostic |
| `docs` | Documentation search |
| `early_access_features` | Early access features |
| `error_tracking` | Error monitoring |
| `events` | Event and property definitions |
| `experiments` | Experiments |
| `flags` | Feature flags |
| `hog_functions` | CDP functions |
| `hog_function_templates` | CDP templates |
| `insights` | Insights |
| `llm_analytics` | LLM analytics |
| `prompts` | LLM prompts |
| `logs` | Log querying |
| `notebooks` | Notebooks |
| `persons` | Persons and groups |
| `reverse_proxy` | Reverse proxy records |
| `search` | Entity search |
| `sql` | SQL execution |
| `surveys` | Surveys |
| `workflows` | Workflows |

---

## Tool families (verify live schema before any call)

Tool **names and parameters** come from the MCP server’s JSON descriptors in the client—**never guess**. Below is a **rough map** for orientation; see the official doc for the full table.

| Domain | Representative tools |
|--------|----------------------|
| Schema | `read-data-schema`, `event-definitions-list`, `properties-list` |
| Query | `query-run`, `query-trends`, `query-funnel`, `query-retention`, `execute-sql`, `query-generate-hogql-from-question` |
| Insights | `insight-*`, `insights-get-all` |
| Cohorts | `cohorts-list`, `cohorts-create`, `cohorts-partial-update`, … |
| Flags | `create-feature-flag`, `update-feature-flag`, `feature-flag-get-all`, … |
| Experiments | `experiment-create`, `experiment-results-get`, … |
| Errors | `list-errors`, `error-details`, `error-tracking-issues-list`, … |
| Docs | `docs-search` |
| Persons | `persons-list`, `persons-retrieve`, `persons-property-set`, … |
| Dashboards | `dashboard-*`, `dashboards-get-all` |
| Surveys | `survey-*`, `surveys-get-all` |

**Safe order:** Health check → read-only tools → user-confirmed mutations. Review tool calls for **prompt injection** risk when content is untrusted (see PostHog MCP security notes on the same doc page).

---

## Example prompt styles (for agents)

Mirrors patterns from PostHog’s MCP examples: multivariate flags with integer splits summing to 100; trends and paths via `query-run`; HogQL via `execute-sql`; experiments via `experiment-create`; errors via `list-errors`; logs via `logs-query`. Adapt to the user’s goal and **always** validate parameters against the live tool schema.

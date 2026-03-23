---
name: using-posthog
description: Guides work across PostHog product analytics—events, person properties, cohorts, insights, dashboards, feature flags, experiments, error tracking, data warehouse, surveys, CDP, notebooks, and LLM-related analytics. Use when the user asks about PostHog instrumentation, segmentation, funnels, flags, regional (EU/US) setup, API automation, or troubleshooting empty or wrong cohorts and metrics. PostHog MCP is an optional resource to deepen or verify live project state when available; the skill applies without MCP via docs, UI, and SDKs.
---

# Using PostHog

## When to use

- **Instrumentation and taxonomy** — event names, properties, identify, server vs client capture.
- **Segmentation** — cohorts, person vs event properties, behavioral vs static groups.
- **Product analytics** — trends, funnels, paths, retention, dashboards, annotations, alerts.
- **Flags and experiments** — rollouts, multivariate tests, metrics and exposure.
- **Quality and ops** — error tracking, logs (where enabled), data warehouse and HogQL-style questions.
- **In-product feedback** — surveys and targeting concepts.
- **Automation** — REST API patterns; regional keys and hosts.
- **Optional enrichment** — when the PostHog MCP server is connected, use it to search docs, inspect schema, and run queries—**never required** for this skill to apply.

## How to work (decision flow)

1. **Clarify the goal** — e.g. fix a metric, design a cohort, roll out a flag, explain empty data.
2. **Choose the plane**
   - **Application code** — SDK init, `capture`, `identify`, person properties, flag evaluation.
   - **PostHog UI** — insights, cohorts, definitions, replay, errors.
   - **API / automation** — scripts or services using personal API keys and regional base URLs.
   - **MCP (optional)** — live `docs-search`, schema reads, `query-run` / SQL, definition CRUD **after** reading each tool’s JSON schema and confirming the server is healthy.
3. **Prefer read-only exploration** before mutations (UI, API, or MCP).
4. **Confirm regional consistency** — ingest host, REST API host, and MCP URL must match the project’s **EU or US** region where applicable.

Deep domain content: [references/product-domains.md](references/product-domains.md). Patterns and symptom tables: [references/patterns-and-troubleshooting.md](references/patterns-and-troubleshooting.md).

## Instrumentation principles (summary)

- Use a **stable naming convention** and a small documented dictionary; align code with actions/cohorts/insights.
- **Person properties** used in cohorts require that the SDK and project settings actually **persist** those properties for the intended users (including anonymous users if the product requires it).
- Distinguish **first-touch / entry** context from **current** context—filters that use “first” are much stricter than “ever.”
- **Identify** when the user becomes known; merge traits consistently per SDK docs.
- Avoid unnecessary PII; follow PostHog privacy guidance for the deployment type.

## Enriching answers with MCP

MCP is **not** the core of this skill; it **augments** depth and accuracy when available.

- Confirm the PostHog MCP integration is **healthy** in the editor; if not, use docs + UI + user context.
- **Read the tool descriptor JSON** (or equivalent) before every tool call—parameters are not guessable.
- Start with **`docs-search`**, **`read-data-schema`**, **`event-definitions-list`**, or read-only queries; move to create/update/delete only with explicit user intent.
- Use **`?features=`** on the MCP URL for least privilege when configuring the server.
- Treat MCP as privileged: review tool calls; heed [prompt-injection guidance](https://posthog.com/docs/model-context-protocol) from PostHog.

Details: [references/mcp-as-resource.md](references/mcp-as-resource.md).

## Task-oriented approaches

Step-by-step templates (funnels, cohorts, flags, errors, API sync): [references/agent-workflows.md](references/agent-workflows.md).

## Quick checklists

**Cohort looks empty**

- [ ] Filter semantics match product intent (entry vs ever; person vs event).
- [ ] Properties exist on real events/persons and keys match exactly.
- [ ] Person/anonymous persistence settings align with cohort type.

**API auth fails**

- [ ] Personal API key valid and scoped.
- [ ] **API host region** matches the project (EU vs US).

**Flag not behaving**

- [ ] Evaluation `distinct_id` and environment; cache; dependencies; multivariate sums to 100%.

**MCP session**

- [ ] Server healthy → read schema → read-only first → mutations only if requested.

## Further reading

- [reference.md](reference.md) — index of all reference files and canonical external links.

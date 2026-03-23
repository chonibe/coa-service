# Using PostHog — reference index

Canonical links and pointers into this skill’s reference files. **No project-specific paths**—env var names and file layout are defined by each application.

---

## In this skill

| File | Contents |
|------|----------|
| [references/product-domains.md](references/product-domains.md) | PostHog product areas: events, persons, cohorts, insights, flags, experiments, errors, warehouse, surveys, CDP, notebooks, LLM-related features |
| [references/patterns-and-troubleshooting.md](references/patterns-and-troubleshooting.md) | Instrumentation patterns; symptom → approach tables; EU/US API notes |
| [references/mcp-as-resource.md](references/mcp-as-resource.md) | When/how to use MCP for depth; `features=` matrix; endpoints; tool families; schema-first rule |
| [references/agent-workflows.md](references/agent-workflows.md) | Generic task sequences (funnels, cohorts, flags, errors, SQL, API sync) |

---

## PostHog documentation (external)

- [Docs home](https://posthog.com/docs)
- [Product analytics](https://posthog.com/docs/product-analytics)
- [Feature flags](https://posthog.com/docs/feature-flags)
- [Experiments](https://posthog.com/docs/experiments)
- [Cohorts](https://posthog.com/docs/data/cohorts)
- [Error tracking](https://posthog.com/docs/error-tracking)
- [Data warehouse](https://posthog.com/docs/data-warehouse)
- [Surveys](https://posthog.com/docs/surveys)
- [API overview](https://posthog.com/docs/api/overview)
- [posthog-js](https://posthog.com/docs/libraries/js)

---

## MCP setup (external)

- [Model Context Protocol (PostHog)](https://posthog.com/docs/model-context-protocol) — US/EU URLs, auth, pinning, `?features=`, security, full tool list
- [Cursor](https://posthog.com/docs/model-context-protocol/cursor.md)

---

## API automation (generic)

REST and personal API keys are **project- and region-specific**. Typical variables (names vary by team): personal API key (`phx_...`), project id, and API host matching the project’s **EU or US** stack. See [API overview](https://posthog.com/docs/api/overview) for authentication and regional endpoints.

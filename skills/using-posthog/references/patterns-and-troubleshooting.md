# Patterns and troubleshooting (generic)

Approach-level guidance—no application-specific paths or identifiers.

---

## Instrumentation patterns

| Pattern | Recommendation |
|--------|------------------|
| Event naming | Stable `snake_case`; avoid frequent renames; document a small dictionary for the team. |
| Properties | Prefer structured keys; avoid unbounded cardinality (e.g. raw URLs with ids) on high-volume events unless needed. |
| Layering | Centralize initialization and common helpers in one module per app surface (web, mobile, server) to avoid drift. |
| Server vs client | Server-side capture for authoritative backend events; client for UX; dedupe or name clearly if both fire. |
| Identify | Identify when the user account is known; merge anonymous history per PostHog docs for that SDK. |

---

## Person properties and cohorts

| Pattern | Recommendation |
|--------|------------------|
| Person vs event property | Use **person** for durable traits and segmentation reused across insights; **event** for what happened in that moment. |
| Anonymous segmentation | Ensure the SDK’s **person profile / persistence** settings match the product need—policies that only persist identified users will not populate person-property cohorts for anonymous visitors. |
| Consistency | Property keys in code must match cohort and insight filters exactly (case, spelling). |

---

## Session, entry, and “where was the user?”

| Pattern | Recommendation |
|--------|------------------|
| First-touch vs current | “First page in tab/session” cohorts are **much smaller** than “ever visited page X.” Product and analytics must agree on which definition matters. |
| Funnels | Check ordering, conversion window, and whether steps are event-based or action-based. |

---

## Regional hosting (EU / US)

| Pattern | Recommendation |
|--------|------------------|
| Ingest | Browser and server SDK `api_host` must match the project’s region. |
| REST API | Personal API key requests must use the **same regional API host** as the project; cross-region often yields **401** or auth errors. |
| MCP | MCP server URL is region-specific (see [mcp-as-resource.md](mcp-as-resource.md)). |

---

## Symptom → approach

| Symptom | Likely angles |
|---------|----------------|
| Cohort size is 0 | Filter too strict (first-touch vs ever); property never sent; wrong property type; typo; time range; cohort not recalculated yet. |
| Cohort “wrong” vs expectations | Compare filter to actual event stream; check identify merge; check person vs event property. |
| API returns 401 | Key revoked or wrong scope; **wrong regional host**; wrong project id. |
| Flag always off/on | Evaluation context (distinct_id); cache; flag disabled; environment; multivariate split. |
| Experiment flat or odd | Exposure event; sample size; metric definition; interference from other flags. |
| Funnel drop “impossible” | Duplicate events; out-of-order steps in definition; window too narrow; anonymous/identified boundary. |
| Missing events in UI | SDK not loaded; adblock; wrong project key; sampling; before `opt_in` if applicable. |

---

## Privacy and governance

- Avoid sending secrets and unnecessary PII; use allowlists for properties where possible.
- Align with org retention and DPA; use PostHog’s privacy controls as documented for the deployment type.

**Docs:** [Privacy](https://posthog.com/docs/privacy), [Data management](https://posthog.com/docs/data)

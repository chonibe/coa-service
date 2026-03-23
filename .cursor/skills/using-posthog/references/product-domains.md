# PostHog product domains (conceptual)

Use this file for **what PostHog offers** and **how to think about each area**. Prefer official docs for API details; verify behavior against the user’s project version.

---

## Event taxonomy

**What it is:** Raw events carry a name and properties; [Actions](https://posthog.com/docs/data/actions) group or label events in the UI without code deploys.

**Typical use:** Stable `snake_case` event names; properties for dimensions (not free-text blobs unless needed). Actions for retroactive grouping of legacy event names.

**Pitfalls:** Typos and renames fragment metrics; conflating “page title” with “screen id”; sending PII in event names.

**Docs:** [Event tracking](https://posthog.com/docs/data/events), [Actions](https://posthog.com/docs/data/actions), [Data management](https://posthog.com/docs/data)

---

## Identification and persons

**What it is:** Anonymous `distinct_id` until `identify` links to a stable user. [Person properties](https://posthog.com/docs/data/person-properties) segment in cohorts and insights.

**Typical use:** Call `identify` when the user becomes known; set person properties for durable traits (plan, role). Use [Groups](https://posthog.com/docs/data/groups) for B2B org-level analytics when applicable.

**Pitfalls:** **Person profile / persistence settings** in the client SDK (e.g. `person_profiles` in `posthog-js`) determine whether anonymous users get full person records—misalignment breaks person-property cohorts for anonymous traffic. Calling `identify` with the wrong distinct_id merges unrelated users.

**Docs:** [Identifying users](https://posthog.com/docs/data/identify), [Person properties](https://posthog.com/docs/data/person-properties), [Groups](https://posthog.com/docs/data/groups), [posthog-js](https://posthog.com/docs/libraries/js)

---

## Session and behavioral context

**What it is:** PostHog sessions and “where the user was” can be modeled with properties on events or persons (first-touch vs current URL, device, etc.).

**Typical use:** Attach **current** context on every relevant event; if product needs “entry into a flow,” define that explicitly (e.g. first path in a bounded journey)—and document that cohorts using “first touch” are **narrower** than “ever did X.”

**Pitfalls:** Assuming “session start URL” equals “any page in funnel”; mixing tab lifetime with PostHog session boundaries without checking product definitions.

**Docs:** [Sessions](https://posthog.com/docs/data/sessions), [Session replay](https://posthog.com/docs/session-replay)

---

## Cohorts and segmentation

**What it is:** [Cohorts](https://posthog.com/docs/data/cohorts) are reusable user sets (behavioral filters, person properties, static lists).

**Typical use:** Dynamic cohorts for lifecycle; static for imports. Align filter keys with **actually emitted** properties and events.

**Pitfalls:** Cohort size zero often means **filter stricter than intent** or **data never sent**—not necessarily “PostHog broken.” Stale definitions in the UI if not updated when taxonomy changes.

**Docs:** [Cohorts](https://posthog.com/docs/data/cohorts)

---

## Insights and dashboards

**What it is:** [Insights](https://posthog.com/docs/product-analytics/insights) (trends, funnels, paths, retention, lifecycle); [Dashboards](https://posthog.com/docs/product-analytics/dashboards) group them.

**Typical use:** Funnels for conversion; paths for exploration; trends for volume. [Annotations](https://posthog.com/docs/product-analytics/annotations) mark releases; [Alerts](https://posthog.com/docs/product-analytics/alerts) notify on insight thresholds.

**Pitfalls:** Step ordering and conversion window; comparing anonymous vs identified without understanding identity merge.

**Docs:** [Product analytics](https://posthog.com/docs/product-analytics), [Funnels](https://posthog.com/docs/user-guides/funnels), [Paths](https://posthog.com/docs/user-guides/paths), [Retention](https://posthog.com/docs/user-guides/retention)

---

## Feature flags and experiments

**What it is:** [Feature flags](https://posthog.com/docs/feature-flags) gate code and roll out gradually. [Experiments](https://posthog.com/docs/experiments) tie flags to statistical comparison of metrics.

**Typical use:** Boolean or multivariate flags; server-side evaluation for trusted decisions; client-side for UI. Define primary metric and exposure before launch.

**Pitfalls:** Multivariate percentages must sum correctly; flag evaluation cache vs immediate updates; mixing experiment exposure with manual flag overrides.

**Docs:** [Feature flags](https://posthog.com/docs/feature-flags), [Experiments](https://posthog.com/docs/experiments), [Early access features](https://posthog.com/docs/feature-flags/early-access-feature-management)

---

## Error tracking

**What it is:** [Error tracking](https://posthog.com/docs/error-tracking) groups issues, statuses, and context for debugging alongside product analytics.

**Typical use:** Triage by volume and affected users; link releases (annotations) to spikes.

**Pitfalls:** Source maps and release tracking for readable stack traces; sampling if volume is high.

**Docs:** [Error tracking](https://posthog.com/docs/error-tracking)

---

## Data warehouse, SQL, and HogQL

**What it is:** [Data warehouse](https://posthog.com/docs/data-warehouse) extends analytics with external tables; [HogQL](https://posthog.com/docs/hogql) / SQL for ad hoc queries over events and defined schemas.

**Typical use:** Join product events with warehouse dimensions; audit taxonomy with `SELECT` patterns.

**Pitfalls:** Query cost and time range; distinguish app events table semantics from warehouse-only tables.

**Docs:** [Data warehouse](https://posthog.com/docs/data-warehouse), [HogQL](https://posthog.com/docs/hogql), [SQL](https://posthog.com/docs/sql)

---

## Surveys

**What it is:** [Surveys](https://posthog.com/docs/surveys) collect in-product feedback with targeting and branching.

**Typical use:** Target by URL, flag, or cohort; analyze responses in PostHog.

**Pitfalls:** Over-sampling; survey UI conflicting with critical flows.

**Docs:** [Surveys](https://posthog.com/docs/surveys)

---

## CDP: Hog functions and workflows

**What it is:** [Customer data pipeline](https://posthog.com/docs/cdp)—transformations, destinations, and [workflows](https://posthog.com/docs/cdp)—orchestrate event flow.

**Typical use:** Enrich or filter events before export; route to downstream tools.

**Pitfalls:** Ordering of transformations; test invocations before production traffic.

**Docs:** [CDP](https://posthog.com/docs/cdp), [Hog functions](https://posthog.com/docs/cdp)

---

## Notebooks, LLM analytics, prompts, logs

**What it is:** [Notebooks](https://posthog.com/docs/notebooks) combine text and queries. [LLM analytics / AI engineering](https://posthog.com/docs/ai-engineering) covers traces, evaluations, costs, and [prompts](https://posthog.com/docs/ai-engineering). [Logs](https://posthog.com/docs/ai-engineering/observability) support observability-style querying where enabled.

**Typical use:** Narrated analysis in notebooks; LLM product metrics in relevant projects.

**Pitfalls:** Feature availability varies by plan and project setup—confirm in docs and UI.

**Docs:** [Notebooks](https://posthog.com/docs/notebooks), [AI engineering](https://posthog.com/docs/ai-engineering), [LLM analytics](https://posthog.com/docs/ai-engineering)

---

## API and automation

**What it is:** [PostHog API](https://posthog.com/docs/api) for programmatic CRUD on cohorts, insights, flags, persons, etc.

**Typical use:** IaC-style definition sync; CI validation of taxonomy.

**Pitfalls:** **Regional API base URL** must match the project (EU vs US); personal API key scopes.

**Docs:** [API overview](https://posthog.com/docs/api/overview)

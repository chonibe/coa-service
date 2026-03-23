# Agent workflows (approach templates)

Generic **sequences**—adapt labels and IDs to the user’s project. Prefer read-only steps before writes.

---

## Validate a funnel

1. Confirm funnel steps (event or action names) match **documented** taxonomy.
2. Check conversion window and ordering; note anonymous vs identified users.
3. If MCP available: pull event definitions or run a funnel query for a recent window; compare to UI.
4. If drop-off seems wrong: inspect duplicate events, property filters, and entry criteria.

---

## Debug an empty or suspicious cohort

1. Read cohort rules: person vs event properties, behavioral filters, time bounds.
2. Verify each referenced property/key is **actually sent** from the app and spelled consistently.
3. If rules use “first” or “entry” semantics, confirm product intent matches (narrow vs broad).
4. Check person profile / SDK settings if the cohort relies on anonymous person properties.
5. If MCP available: inspect schema or run a small query to count matching users; adjust definition in UI or API after user confirmation.

---

## Design a gradual flag rollout

1. Clarify flag key, default, and evaluation surface (client vs server).
2. Choose rollout type (boolean %, multivariate with integer splits summing to 100, targeted release).
3. Plan exposure and guardrails (kill switch, dependency on other flags).
4. If MCP available: read existing flags to avoid key collisions; create/update only after user approval.

---

## Investigate errors or log spikes

1. Note time range and release/annotation context.
2. Use error tracking UI or MCP error tools: sort by volume, inspect issue detail, update status if triaging.
3. For logs (if enabled): filter by service and severity; correlate with deploys.

---

## Ad hoc analytics question

1. Restate the question as a measurable event or property pattern.
2. Prefer trends, funnel, paths, or HogQL as appropriate; bound the time range.
3. If MCP available: `docs-search` for HogQL patterns; `query-run` or `execute-sql` with schema-checked fields.

---

## API or automation sync

1. Confirm **regional API base**, project id, and key scopes.
2. Prefer idempotent patterns (e.g. update-by-name) and dry-run or read-back validation.
3. On 401: re-check region and key before changing logic.

---

## When not to use MCP

- Server disconnected or errored in the IDE.
- User has not authorized project access.
- Task is purely educational—official docs may suffice without live calls.

# PostHog insight templates (copy patterns)

Use these patterns in the PostHog UI when building insights that are **not** fully represented by repo-synced cohorts (e.g. time-bounded behavioral segments).

**Related:** [README](./README.md) (cohort ownership, audit, EU host), [EVENTS_MAP](./EVENTS_MAP.md) (events and person properties).

---

## Abandoned checkout (HogQL or lifecycle cohort — UI-managed)

Repo-sync does **not** push “Abandoned Checkout” (time windows and negated sequences are unreliable via the behavioral cohort REST shape on some regions). Create a cohort in PostHog:

1. **Cohorts → New cohort → HogQL** (or **Lifecycle**, depending on your project).
2. **Intent:** users who performed `begin_checkout` in the last N days and did **not** perform `purchase` in that window (adjust window to your business definition).

Example HogQL sketch (validate column names in your project’s schema):

```sql
SELECT DISTINCT person_id
FROM events
WHERE event = 'begin_checkout'
  AND timestamp > now() - INTERVAL 7 DAY
  AND person_id NOT IN (
    SELECT DISTINCT person_id FROM events
    WHERE event = 'purchase'
      AND timestamp > now() - INTERVAL 7 DAY
  )
```

Name the cohort consistently, e.g. `Cohort · Abandoned Checkout`, and treat it as **UI-managed** so `scripts/setup-posthog-insights.js` does not overwrite it.

---

## Experience v2 funnel (steps)

**Insight type:** Funnel.

Suggested ordered steps (tune to your questions):

1. `experience_started` where `surface` = `experience_v2_configurator` (optional breakdown by `initial_artist_slug`, `direct_entry`).
2. `experience_picker_opened` or `experience_filter_applied` with `item_list_name` / context as needed.
3. `add_to_cart` filtered by `item_list_name` in `experience-v2`, `experience`.
4. `begin_checkout`.
5. `purchase`.

---

## Breakdowns for journey quality

| Dimension | Where it lives |
|-----------|----------------|
| Entry surface | `surface` on `experience_started`, `last_experience_surface` (person) |
| Stage of add/view | `item_list_name` on `view_item`, `add_to_cart` |
| Tab entry | `last_session_entry_path`, `session_entry_path` on events |
| A/B | `experience_ab_variant` (person), `variant` on `experience_ab_variant_known` |

---

## Session replay saved filters

- **Events:** `begin_checkout`, `checkout_error`, `payment_error`, `session_tagged`.
- **Person properties (once populated):** `has_checkout_error`, `has_used_promo_code`, `experience_configurator_visited`.

---

## Version

- **lastUpdated:** 2026-03-23
- **version:** 1.0.0

---
title: "Journey Milestone System"
type: concept
tags: [feature, gamification, series, vendor, collector, map]
created: 2026-04-14
updated: 2026-04-14
sources: [2026-04-14-journey-milestone]
---

# Journey Milestone System

The Journey Milestone System turns an artist's series into a game-like progression map where each series is a node/island on an interactive journey map, unlocking automatically based on sales.

## Definition

Inspired by Super Mario Odyssey and Breath of the Wild, the system treats each series as an explorable island on a map. Series complete ("unlock") when all artworks sell (configurable: `all_sold`, `percentage_sold`, or `manual`). Connected series can unlock subsequent series. Artists see the full journey; collectors see their personal view with their purchased artworks highlighted.

## Key Claims

1. Series become milestones via new columns on `artwork_series`: `milestone_config` (JSONB), `journey_position` (JSONB with `x`, `y`, `level`, `island_group`), `completed_at`, `completion_progress`, `connected_series_ids` (UUID[]), `unlocks_series_ids` (UUID[]), `is_milestone`, `milestone_order`.
2. Completion types: `all_sold`, `percentage_sold` (with configurable threshold), `manual`.
3. `auto_complete` flag controls whether completion is automatic or requires admin/vendor action.
4. `completion_progress` JSONB tracks: `total_artworks`, `sold_artworks`, `percentage_complete`.
5. `journey_map_settings` table stores per-vendor map configuration.
6. Collector journey view highlights their owned artworks; shows unlock status per series.
7. Completion triggers animated celebrations (`UnlockCelebration.tsx` in series manager).
8. Connected series: `connected_series_ids` shows relationships; `unlocks_series_ids` gates access.

## Evidence

- [[2026-04-14-journey-milestone]] — full DB schema, philosophy, feature list for artists and collectors

## Tensions

- Journey position (`x`, `y` coordinates in JSONB) requires a visual map editor — unclear if this is implemented or manual SQL.
- `unlocks_series_ids` gating means a collector cannot see a series until the prerequisite series completes — could hide content from active collectors unexpectedly.

## Related

- [[series-manager]]
- [[collector-dashboard]]
- [[edition-numbering-system]]
- [[supabase]]

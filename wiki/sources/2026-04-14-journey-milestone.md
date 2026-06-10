---
title: "Journey Milestone System Documentation"
type: source
tags: [gamification, series, journey, map, vendor, collector]
created: 2026-04-14
updated: 2026-04-14
sources: []
---

# Journey Milestone System Documentation

Feature documentation for the game-inspired journey map where artwork series become milestones on an interactive artist map.

## Metadata

- **Author**: The Street Collector team
- **File**: `docs/features/journey-milestone-system/README.md`
- **Date**: Living document, last observed 2026-04-14

## Summary

The Journey Milestone System layers game design principles onto the series system. Artists' series become nodes on a visual journey map (inspired by Super Mario Odyssey, Breath of the Wild). Each series can be a milestone with configurable completion rules. Collectors see their personal view with purchased artworks highlighted and unlock status per series.

The implementation extends `artwork_series` with JSONB config columns and adds a `journey_map_settings` table for per-vendor map configuration. Completion is tracked automatically based on fulfillment data.

## Key Takeaways

- New `artwork_series` columns: `milestone_config`, `journey_position`, `completed_at`, `completion_progress`, `connected_series_ids`, `unlocks_series_ids`, `is_milestone`, `milestone_order`.
- `milestone_config.completion_type`: `all_sold`, `percentage_sold`, `manual`.
- `journey_position`: `{ x, y, level, island_group }` — coordinates on the visual map.
- `completion_progress`: `{ total_artworks, sold_artworks, percentage_complete }` — computed from fulfillment.
- `unlocks_series_ids`: gating — series listed here are unlocked when this series completes.
- `journey_map_settings` table: per-vendor map style and settings.
- Collector view: highlights owned artworks, shows unlock status, tracks collection progress.
- Milestone celebrations reuse `UnlockCelebration.tsx` from the series manager.

## New Information

- `island_group` in `journey_position` enables visual grouping of related series on the map.
- `milestone_order` (INTEGER) defines the narrative sequence even if the map is non-linear.
- `auto_complete` flag in `milestone_config` controls whether completion requires manual trigger.

## Contradictions

None against other wiki pages.

## Entities Mentioned

- [[the-street-collector]]
- [[supabase]]

## Concepts Touched

- [[journey-milestone-system]]
- [[series-manager]]
- [[collector-dashboard]]
- [[edition-numbering-system]]

"use client"

import SeriesTemplateEditor from "@/app/vendor/dashboard/artwork-pages/series/[seriesId]/page"

/**
 * AppShell-native series block editor (same implementation as dashboard route).
 * Dynamic segment is `[id]` here vs `[seriesId]` under dashboard — editor resolves both.
 */
export default function StudioSeriesExperienceEditorPage() {
  return <SeriesTemplateEditor />
}

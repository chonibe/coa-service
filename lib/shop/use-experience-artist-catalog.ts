'use client'

import { useEffect, useState } from 'react'

export type ExperienceArtistCatalogRow = readonly [vendor: string, count: number]

/**
 * Loads full vendor + work counts for both experience seasons (paginated on the server).
 * Filter UI uses this so artists beyond the initial product page are still listed.
 */
export function useExperienceArtistCatalog(): ExperienceArtistCatalogRow[] | null {
  const [rows, setRows] = useState<ExperienceArtistCatalogRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/shop/experience/collection-vendors')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { artists?: [string, number][] } | null) => {
        if (cancelled || !data?.artists?.length) return
        setRows(data.artists as ExperienceArtistCatalogRow[])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return rows
}

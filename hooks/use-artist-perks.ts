"use client"

import { useState, useEffect } from "react"
import { getArtistPerks, markPerkAsViewed } from "@/app/actions/perks"
import type { ArtistPerks } from "@/types/perks"

export function useArtistPerks(artistId: string, certificateId: string, collectorId: string) {
  const [perksData, setPerksData] = useState<ArtistPerks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPerks = async () => {
      try {
        setLoading(true)
        const data = await getArtistPerks(artistId, certificateId, collectorId)
        setPerksData(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch perks"))
      } finally {
        setLoading(false)
      }
    }

    if (artistId && certificateId && collectorId) {
      fetchPerks()
    }
  }, [artistId, certificateId, collectorId])

  const markAsViewed = async (perkId: string) => {
    if (!collectorId || !certificateId) return

    await markPerkAsViewed(perkId, collectorId, certificateId)
  }

  return {
    perks: perksData,
    loading,
    error,
    hasNewContent: perksData?.hasNewContent || false,
    markAsViewed,
  }
}

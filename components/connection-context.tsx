"use client"

import { useState, useEffect } from "react"
import { determineConnectionStage, type ConnectionStage } from "@/lib/connection-philosophy"
import { useArtistInsights } from "@/hooks/use-artist-insights"

interface ConnectionContextProps {
  artistId: string
  certificateId: string
  collectorId: string
}

export function ConnectionContext({ artistId, certificateId, collectorId }: ConnectionContextProps) {
  const [hasNewInsight, setHasNewInsight] = useState(false)
  const { insights, loading } = useArtistInsights(artistId, certificateId, collectorId)
  const [connectionStage, setConnectionStage] = useState<ConnectionStage>("observer")

  // Determine connection stage based on interaction history
  useEffect(() => {
    if (insights && insights.length > 0) {
      // In a real implementation, this would use actual metrics
      const interactions = insights.length
      const meaningfulExchanges = insights.filter((i) => i.hasCollectorResponse).length
      const sharedInsights = insights.filter((i) => i.isDeep).length
      const timeWithWork = 5 // Placeholder for time spent viewing

      const stage = determineConnectionStage(interactions, meaningfulExchanges, sharedInsights, timeWithWork)

      setConnectionStage(stage)

      // Check if there's a new insight the collector hasn't seen
      const hasUnseenInsight = insights.some((insight) => !insight.viewedAt)
      setHasNewInsight(hasUnseenInsight)
    }
  }, [insights])

  if (loading || !insights || insights.length === 0) {
    return null // Don't show anything until we have insights
  }

  // This component intentionally doesn't render anything visible by default
  // It provides context to the certificate page and manages the subtle notification
  // that appears when there's a new insight from the artist

  return hasNewInsight ? (
    <div className="absolute bottom-6 right-6 animate-fade-in">
      <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
    </div>
  ) : null
}

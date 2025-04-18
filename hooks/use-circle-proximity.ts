"use client"

import { useState, useEffect } from "react"
import { determineProximity, generateProximityReflection, type CircleProximity } from "@/lib/personal-circle"

export function useCircleProximity(artistId: string, certificateId: string, collectorId: string) {
  const [proximity, setProximity] = useState<CircleProximity | null>(null)
  const [reflection, setReflection] = useState<string | null>(null)
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false)
  const [lastViewedAt, setLastViewedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRelationshipData = async () => {
      try {
        setLoading(true)

        // In a real implementation, this would fetch data from your database

        // Mock data for demo
        const mockDaysWithArtwork = 45
        const mockMessageExchanges = 3
        const mockPersonalDetailsShared = ["location", "art interests"]
        const mockInsightResponses = 2
        const mockLastViewedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

        // Record this viewing
        const now = new Date().toISOString()
        setLastViewedAt(now)

        // Determine proximity and generate reflection
        const currentProximity = determineProximity(
          mockDaysWithArtwork,
          mockMessageExchanges,
          mockPersonalDetailsShared,
          mockInsightResponses,
        )

        setProximity(currentProximity)
        setReflection(generateProximityReflection(currentProximity))

        // Check for unread messages (for demo, randomly show a message)
        setHasUnreadMessage(Math.random() > 0.5)
      } catch (error) {
        console.error("Error loading relationship data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (artistId && certificateId && collectorId) {
      loadRelationshipData()
    }
  }, [artistId, certificateId, collectorId])

  // Share a personal detail with the artist
  const sharePersonalDetail = async (detailType: string, content: string) => {
    // In a real implementation, this would update your database
    console.log(`Sharing personal detail (${detailType}): ${content}`)

    // For demo purposes, we'll just return success
    return true
  }

  return {
    proximity,
    reflection,
    hasUnreadMessage,
    lastViewedAt,
    loading,
    sharePersonalDetail,
  }
}

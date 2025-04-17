"use client"

import { useState, useEffect } from "react"

export interface ArtistInsight {
  id: string
  artistId: string
  certificateId: string
  title: string
  content: string
  type: "text" | "image" | "audio" | "video" | "sketch"
  createdAt: string
  viewedAt: string | null
  hasCollectorResponse: boolean
  isDeep: boolean
  mediaUrl?: string
}

export function useArtistInsights(artistId: string, certificateId: string, collectorId: string) {
  const [insights, setInsights] = useState<ArtistInsight[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true)

        // In a real implementation, this would fetch from your database
        // For demo purposes, we'll use mock data

        const mockInsights: ArtistInsight[] = [
          {
            id: "insight1",
            artistId,
            certificateId,
            title: "The Inspiration",
            content:
              "This piece emerged during a period of deep reflection on the nature of consciousness. I was exploring how our perception of color is both universal and deeply personal. The flowing forms represent the way thoughts move through our awareness - sometimes clear, sometimes obscured.",
            type: "text",
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            viewedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            hasCollectorResponse: true,
            isDeep: true,
          },
          {
            id: "insight2",
            artistId,
            certificateId,
            title: "Early Sketch",
            content:
              "This was one of the initial sketches for the piece. I was trying to capture the sense of movement while maintaining structural integrity in the composition.",
            type: "image",
            mediaUrl: "/cluttered-creative-space.png",
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            viewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            hasCollectorResponse: false,
            isDeep: false,
          },
          {
            id: "insight3",
            artistId,
            certificateId,
            title: "Technical Process",
            content:
              "For this piece, I developed a new technique using multiple translucent layers to create depth. Each color is built up from at least 7 separate layers, allowing light to interact with the pigments in a more complex way than in my previous works.",
            type: "text",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            viewedAt: null, // Unviewed insight
            hasCollectorResponse: false,
            isDeep: true,
          },
        ]

        setInsights(mockInsights)
      } catch (err) {
        console.error("Error fetching insights:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch insights"))
      } finally {
        setLoading(false)
      }
    }

    if (artistId && certificateId && collectorId) {
      fetchInsights()
    }
  }, [artistId, certificateId, collectorId])

  const markInsightAsViewed = async (insightId: string) => {
    if (!insights) return

    // Update local state first for immediate feedback
    setInsights(
      insights.map((insight) =>
        insight.id === insightId ? { ...insight, viewedAt: new Date().toISOString() } : insight,
      ),
    )

    // In a real implementation, this would update your database
    try {
      // Simulate API call
      console.log(`Marking insight ${insightId} as viewed`)
    } catch (err) {
      console.error("Error marking insight as viewed:", err)
    }
  }

  const submitResponse = async (insightId: string, response: string) => {
    if (!insights) return

    // Update local state first for immediate feedback
    setInsights(
      insights.map((insight) => (insight.id === insightId ? { ...insight, hasCollectorResponse: true } : insight)),
    )

    // In a real implementation, this would update your database
    try {
      // Simulate API call
      console.log(`Submitting response to insight ${insightId}:`, response)
      return true
    } catch (err) {
      console.error("Error submitting response:", err)
      return false
    }
  }

  return {
    insights,
    loading,
    error,
    markInsightAsViewed,
    submitResponse,
  }
}

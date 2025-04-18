"use client"

import { useState, useEffect } from "react"
import { type PresenceType, suggestPresenceType } from "@/lib/artist-presence"

interface Artwork {
  id: string
  title: string
  imageUrl: string
  artist: {
    id: string
    name: string
    profileImageUrl: string
  }
  themes: string[]
}

interface Visitation {
  id: string
  artworkId: string
  presenceType: PresenceType
  createdAt: string
  viewedAt: string | null
  content: any
}

export function useArtistVisitations(collectorId: string, artworks: Artwork[]) {
  const [visitations, setVisitations] = useState<Visitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch visitations from the server
  useEffect(() => {
    const fetchVisitations = async () => {
      try {
        setLoading(true)

        // In a real implementation, this would be an API call
        // For demo purposes, we'll create mock data

        // Create a mock visitation for one random artwork
        if (artworks.length > 0) {
          const randomIndex = Math.floor(Math.random() * artworks.length)
          const artwork = artworks[randomIndex]

          // Determine presence type based on collector preferences
          // In a real app, this would use actual collector data
          const mockCollectorPreferences = ["process", "meaning", "exclusivity"]
          const presenceType = suggestPresenceType(
            mockCollectorPreferences,
            [], // collection history would come from your database
            artwork.themes,
          )

          const mockVisitation: Visitation = {
            id: `visit-${Date.now()}`,
            artworkId: artwork.id,
            presenceType,
            createdAt: new Date().toISOString(),
            viewedAt: null,
            content: null, // Content is generated in the component
          }

          setVisitations([mockVisitation])
        }
      } catch (err) {
        console.error("Error fetching visitations:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch visitations"))
      } finally {
        setLoading(false)
      }
    }

    if (collectorId && artworks.length > 0) {
      fetchVisitations()
    }
  }, [collectorId, artworks])

  // Mark a visitation as viewed
  const markVisitationAsViewed = async (visitationId: string) => {
    try {
      // In a real implementation, this would update your database

      // Update local state
      setVisitations(
        visitations.map((visit) =>
          visit.id === visitationId ? { ...visit, viewedAt: new Date().toISOString() } : visit,
        ),
      )

      return true
    } catch (err) {
      console.error("Error marking visitation as viewed:", err)
      return false
    }
  }

  // Check if an artwork has an active visitation
  const hasVisitation = (artworkId: string) => {
    return visitations.some((visit) => visit.artworkId === artworkId && !visit.viewedAt)
  }

  // Get the presence type for an artwork
  const getPresenceType = (artworkId: string): PresenceType | undefined => {
    const visitation = visitations.find((visit) => visit.artworkId === artworkId)
    return visitation?.presenceType
  }

  return {
    visitations,
    loading,
    error,
    markVisitationAsViewed,
    hasVisitation,
    getPresenceType,
  }
}

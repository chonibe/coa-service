"use client"

import { useState, useEffect } from "react"
import type { CircleEntry } from "@/lib/collector-circle"
import {
  getCollectorProfile,
  getMutualConnections,
  getInteractionHistory,
  getConnectionOpportunities,
  recordActionTaken,
  getRecommendedActions,
} from "@/app/actions/collector-circle"

export function useCollectorCircle(artistId: string, collectorId: string) {
  const [collectorProfile, setCollectorProfile] = useState<any>(null)
  const [mutualConnections, setMutualConnections] = useState<any[]>([])
  const [interactions, setInteractions] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [recommendedActions, setRecommendedActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load all collector circle data
  useEffect(() => {
    const loadCollectorCircleData = async () => {
      try {
        setLoading(true)

        // Fetch all data in parallel
        const [profileResult, connectionsResult, interactionsResult, opportunitiesResult, actionsResult] =
          await Promise.all([
            getCollectorProfile(collectorId),
            getMutualConnections(artistId, collectorId),
            getInteractionHistory(artistId, collectorId),
            getConnectionOpportunities(artistId, collectorId),
            getRecommendedActions(artistId, collectorId),
          ])

        if (profileResult.profile) {
          setCollectorProfile(profileResult.profile)
        }

        if (connectionsResult.connections) {
          setMutualConnections(connectionsResult.connections)
        }

        if (interactionsResult.interactions) {
          setInteractions(interactionsResult.interactions)
        }

        if (opportunitiesResult.opportunities) {
          setOpportunities(opportunitiesResult.opportunities)
        }

        if (actionsResult.actions) {
          setRecommendedActions(actionsResult.actions)
        }
      } catch (err) {
        console.error("Error loading collector circle data:", err)
        setError(err instanceof Error ? err : new Error("Failed to load collector data"))
      } finally {
        setLoading(false)
      }
    }

    if (artistId && collectorId) {
      loadCollectorCircleData()
    }
  }, [artistId, collectorId])

  // Record that an action has been taken
  const takeAction = async (action: string, strategy: CircleEntry = "personal-touch") => {
    try {
      const result = await recordActionTaken(artistId, collectorId, action, strategy)

      if (result.success) {
        // In a real app, you might refresh data here
        // For now, we'll just return success
        return true
      }

      return false
    } catch (err) {
      console.error("Error taking action:", err)
      return false
    }
  }

  return {
    collectorProfile,
    mutualConnections,
    interactions,
    opportunities,
    recommendedActions,
    loading,
    error,
    takeAction,
  }
}

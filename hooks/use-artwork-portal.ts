"use client"

import { useState, useEffect, useCallback } from "react"
import type { PortalEvent, PortalState } from "@/lib/artwork-portal"
import {
  getPendingVisits,
  recordPortalEvent,
  getUpcomingDrops,
  markVisitViewed,
} from "@/lib/services/artwork-portal-service"

export function useArtworkPortal(artworkId: string, artistId: string, collectorId: string) {
  const [portalState, setPortalState] = useState<PortalState>("dormant")
  const [pendingVisits, setPendingVisits] = useState<any[]>([])
  const [upcomingDrops, setUpcomingDrops] = useState<any[]>([])
  const [activeVisit, setActiveVisit] = useState<any | null>(null)
  const [hasActivity, setHasActivity] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load portal data
  useEffect(() => {
    const loadPortalData = async () => {
      try {
        setLoading(true)

        // Fetch pending visits
        const visits = await getPendingVisits(artworkId, collectorId)
        setPendingVisits(visits)

        // Fetch upcoming drops
        const drops = await getUpcomingDrops([artistId])
        setUpcomingDrops(drops)

        // Determine if there's activity
        setHasActivity(visits.length > 0 || drops.length > 0)
      } catch (error) {
        console.error("Error loading portal data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (artworkId && artistId && collectorId) {
      loadPortalData()

      // Set up polling
      const interval = setInterval(loadPortalData, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [artworkId, artistId, collectorId])

  // Handle a portal event
  const handlePortalEvent = useCallback(
    async (event: PortalEvent) => {
      try {
        await recordPortalEvent(artworkId, collectorId, event)

        // For demo purposes, let's simulate an additional effect
        if (event.type === "visit") {
          // Maybe unlock something special
          console.log("Visit occurred, unlocking special content...")
        }
      } catch (error) {
        console.error("Error handling portal event:", error)
      }
    },
    [artworkId, collectorId],
  )

  // Manually trigger a visit to happen
  const triggerVisit = useCallback(
    async (visitId: string) => {
      try {
        // Find the visit
        const visit = pendingVisits.find((v) => v.id === visitId)
        if (!visit) return

        // Show it
        setActiveVisit(visit)

        // Mark it as viewed
        await markVisitViewed(visitId)

        // Remove from pending
        setPendingVisits((prev) => prev.filter((v) => v.id !== visitId))

        // Return to null after viewing
        setTimeout(() => {
          setActiveVisit(null)
        }, 8000)
      } catch (error) {
        console.error("Error triggering visit:", error)
      }
    },
    [pendingVisits],
  )

  return {
    portalState,
    pendingVisits,
    upcomingDrops,
    activeVisit,
    hasActivity,
    loading,
    handlePortalEvent,
    triggerVisit,
  }
}

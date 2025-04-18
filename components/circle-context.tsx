"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

interface CircleContextProps {
  artistId: string
  certificateId: string
  collectorId: string
}

export function CircleContext({ artistId, certificateId, collectorId }: CircleContextProps) {
  const [lastViewed, setLastViewed] = useState<string | null>(null)

  // Record view and fetch last view time
  useEffect(() => {
    const recordView = async () => {
      try {
        // Get the current timestamp
        const now = new Date().toISOString()

        // Try to store in Supabase if available
        try {
          const { error } = await supabase.from("artwork_views").insert({
            certificate_id: certificateId,
            collector_id: collectorId,
            artist_id: artistId,
            viewed_at: now,
          })

          if (error && error.code !== "PGRST116") {
            console.log("Error recording view:", error)
          }
        } catch (error) {
          // If table doesn't exist or other error, fall back to local storage
          console.log("Falling back to local storage for view tracking")
        }

        // For demo purposes, also use localStorage
        const storageKey = `last-viewed-${certificateId}-${collectorId}`
        const lastViewedTime = localStorage.getItem(storageKey)

        // Update last viewed time
        setLastViewed(lastViewedTime)

        // Save current time as last viewed
        localStorage.setItem(storageKey, now)
      } catch (err) {
        console.error("Error recording view:", err)
      }
    }

    if (certificateId && collectorId && artistId) {
      recordView()
    }
  }, [certificateId, collectorId, artistId])

  // This component doesn't render anything visible
  // It just records and manages data about the relationship
  return null
}

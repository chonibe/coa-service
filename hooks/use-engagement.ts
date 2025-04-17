"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import {
  rewardStrategies,
  getExpiryTime,
  shouldShowScarcityMessage,
  calculateStreak,
} from "@/lib/engagement/reward-engine"

export function useEngagement(artistId: string, certificateId: string, collectorId: string) {
  const [lastVisit, setLastVisit] = useState<Date | null>(null)
  const [viewHistory, setViewHistory] = useState<Date[]>([])
  const [streak, setStreak] = useState(0)
  const [collectorData, setCollectorData] = useState<any>(null)
  const [segment, setSegment] = useState("newCollector")
  const [strategy, setStrategy] = useState(rewardStrategies.newCollector)
  const [expiryTime, setExpiryTime] = useState<Date | null>(null)
  const [showScarcity, setShowScarcity] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load collector data and engagement metrics
  useEffect(() => {
    const loadEngagementData = async () => {
      try {
        setLoading(true)

        // Fetch collector data
        const { data: collector } = await supabase.from("collectors").select("*").eq("id", collectorId).single()

        setCollectorData(collector || { id: collectorId })

        // Determine collector segment - use default for now
        const segment = "newCollector" // Simplified for demo
        setSegment(segment)
        setStrategy(rewardStrategies[segment])

        // Try to fetch view history
        try {
          const { data: views } = await supabase
            .from("collector_views")
            .select("viewed_at")
            .eq("collector_id", collectorId)
            .eq("certificate_id", certificateId)
            .order("viewed_at", { ascending: false })

          if (views && views.length > 0) {
            const viewDates = views.map((v) => new Date(v.viewed_at))
            setViewHistory(viewDates)
            setLastVisit(viewDates[0]) // Most recent view

            // Calculate streak
            const currentStreak = calculateStreak(viewDates)
            setStreak(currentStreak)
          }
        } catch (error) {
          console.log("collector_views table might not exist yet:", error)
          // Continue without view history
        }

        // Determine if we should show scarcity messaging
        setShowScarcity(shouldShowScarcityMessage(rewardStrategies[segment]))

        // Set expiry time for content
        setExpiryTime(getExpiryTime(rewardStrategies[segment]))
      } catch (error) {
        console.error("Error loading engagement data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (collectorId && certificateId) {
      loadEngagementData()
    }
  }, [collectorId, certificateId, artistId])

  // Record a new view
  const recordView = async () => {
    try {
      const now = new Date()

      // Try to record the view in Supabase
      try {
        await supabase.from("collector_views").insert({
          collector_id: collectorId,
          certificate_id: certificateId,
          artist_id: artistId,
          viewed_at: now.toISOString(),
        })
      } catch (error) {
        console.log("collector_views table might not exist yet:", error)
        // Continue without recording the view
      }

      // Update local state
      setLastVisit(now)
      setViewHistory((prev) => [...prev, now])

      // Recalculate streak
      const updatedViewHistory = [...viewHistory, now]
      const newStreak = calculateStreak(updatedViewHistory)
      setStreak(newStreak)

      // If streak milestone reached, maybe unlock special content
      if (newStreak > 0 && newStreak % 5 === 0) {
        await unlockStreakReward(newStreak)
      }
    } catch (error) {
      console.error("Error recording view:", error)
    }
  }

  // Unlock special content for achieving streak milestones
  const unlockStreakReward = async (streakCount: number) => {
    try {
      // Try to check if a streak reward already exists
      try {
        const { data: existingReward } = await supabase
          .from("streak_rewards")
          .select("id")
          .eq("collector_id", collectorId)
          .eq("streak_count", streakCount)
          .single()

        if (!existingReward) {
          // Create a new streak reward
          await supabase.from("streak_rewards").insert({
            collector_id: collectorId,
            artist_id: artistId,
            streak_count: streakCount,
            unlocked_at: new Date().toISOString(),
            claimed: false,
          })
        }
      } catch (error) {
        console.log("streak_rewards table might not exist yet:", error)
        // Continue without creating a streak reward
      }
    } catch (error) {
      console.error("Error unlocking streak reward:", error)
    }
  }

  // Check if there are unclaimed streak rewards
  const [hasUnclaimedRewards, setHasUnclaimedRewards] = useState(false)

  useEffect(() => {
    const checkUnclaimedRewards = async () => {
      try {
        try {
          const { data } = await supabase
            .from("streak_rewards")
            .select("id")
            .eq("collector_id", collectorId)
            .eq("claimed", false)
            .limit(1)

          setHasUnclaimedRewards(data && data.length > 0)
        } catch (error) {
          console.log("streak_rewards table might not exist yet:", error)
          // Continue without checking for unclaimed rewards
        }
      } catch (error) {
        console.error("Error checking unclaimed rewards:", error)
      }
    }

    if (collectorId) {
      checkUnclaimedRewards()
    }
  }, [collectorId, streak])

  return {
    lastVisit,
    viewHistory,
    streak,
    segment,
    expiryTime,
    showScarcity,
    hasUnclaimedRewards,
    recordView,
    loading,
  }
}

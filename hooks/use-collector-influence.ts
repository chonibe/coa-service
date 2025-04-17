"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import {
  calculateInfluenceProgress,
  getPointsForAction,
  type InfluenceProgress,
} from "@/lib/engagement/influence-system"

export function useCollectorInfluence(artistId: string, collectorId: string) {
  const [influenceData, setInfluenceData] = useState<InfluenceProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentContributors, setRecentContributors] = useState<any[]>([])
  const [topContributors, setTopContributors] = useState<any[]>([])
  const [implementedIdeas, setImplementedIdeas] = useState<any[]>([])
  const [error, setError] = useState<Error | null>(null)

  // Load collector influence data
  useEffect(() => {
    const loadInfluenceData = async () => {
      try {
        setLoading(true)

        // Initialize with default influence data
        setInfluenceData(calculateInfluenceProgress(0, 0, 0, 0, 0))

        // Set up mock data for demo purposes
        setRecentContributors([
          {
            collectors: {
              name: "Alex Johnson",
              profile_image_url: "/thoughtful-gaze.png",
            },
            contribution_type: "provide_feedback",
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            collectors: {
              name: "Sam Rivera",
              profile_image_url: "/diverse-group-city.png",
            },
            contribution_type: "submit_idea",
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])

        setTopContributors([
          {
            collectors: {
              name: "Jamie Smith",
              profile_image_url: "/diverse-professional-profiles.png",
            },
            influence_points: 450,
            current_level: "Insider",
          },
          {
            collectors: {
              name: "Taylor Wong",
              profile_image_url: "/mystical-forest-spirit.png",
            },
            influence_points: 280,
            current_level: "Supporter",
          },
        ])

        setImplementedIdeas([
          {
            id: "idea-1",
            title: "Urban Decay Series",
            collectors: {
              name: "Jamie Smith",
            },
            implemented_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])

        // Try to fetch real data from Supabase if tables exist
        try {
          const { data: influenceRecord, error: influenceError } = await supabase
            .from("collector_influence")
            .select("*")
            .eq("collector_id", collectorId)
            .eq("artist_id", artistId)
            .single()

          if (!influenceError && influenceRecord) {
            // Calculate influence progress from existing record
            setInfluenceData(
              calculateInfluenceProgress(
                influenceRecord.influence_points,
                influenceRecord.contributions,
                influenceRecord.feedback_count,
                influenceRecord.ideas_implemented,
                influenceRecord.recognition_count,
              ),
            )
          } else if (influenceError && influenceError.code !== "PGRST116") {
            // If the table exists but there's another error
            console.log("Error fetching influence record:", influenceError)
          }
        } catch (error) {
          console.log("collector_influence table might not exist yet:", error)
        }
      } catch (err) {
        console.error("Error loading influence data:", err)
        setError(err instanceof Error ? err : new Error("Failed to load influence data"))
      } finally {
        setLoading(false)
      }
    }

    if (collectorId && artistId) {
      loadInfluenceData()
    }
  }, [collectorId, artistId])

  // Record an influence-generating action
  const recordAction = async (action: string) => {
    if (!collectorId || !artistId || !influenceData) return

    try {
      const pointsEarned = getPointsForAction(action)
      if (pointsEarned <= 0) return

      const newTotalPoints = influenceData.totalPoints + pointsEarned

      // Update local state first for immediate feedback
      setInfluenceData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          totalPoints: newTotalPoints,
          ...(["provide_feedback", "submit_idea", "share_content"].includes(action)
            ? { contributions: prev.contributions + 1 }
            : {}),
          ...(action === "provide_feedback" ? { feedbackCount: prev.feedbackCount + 1 } : {}),
        }
      })

      // Try to update the influence record in Supabase
      try {
        const { error: checkError } = await supabase
          .from("collector_influence")
          .select("id")
          .eq("collector_id", collectorId)
          .eq("artist_id", artistId)
          .single()

        if (checkError && checkError.code === "PGRST116") {
          // Table doesn't exist, skip
          return
        }

        // Check if record exists
        const { data: existingRecord, error: existingError } = await supabase
          .from("collector_influence")
          .select("id")
          .eq("collector_id", collectorId)
          .eq("artist_id", artistId)
          .maybeSingle()

        if (!existingError) {
          if (existingRecord) {
            // Update existing record
            await supabase
              .from("collector_influence")
              .update({
                influence_points: newTotalPoints,
                last_action_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("collector_id", collectorId)
              .eq("artist_id", artistId)
          } else {
            // Create new record
            await supabase.from("collector_influence").insert({
              collector_id: collectorId,
              artist_id: artistId,
              influence_points: newTotalPoints,
              last_action_at: new Date().toISOString(),
            })
          }
        }
      } catch (error) {
        console.log("Error updating influence record:", error)
      }
    } catch (err) {
      console.error("Error recording action:", err)
    }
  }

  // Submit an idea to the artist
  const submitIdea = async (title: string, description: string) => {
    if (!collectorId || !artistId) return null

    try {
      // Update local state for immediate feedback
      const mockIdea = {
        id: `idea-${Date.now()}`,
        title,
        description,
        collector_id: collectorId,
        artist_id: artistId,
        submitted_at: new Date().toISOString(),
      }

      // Try to insert the idea into Supabase
      try {
        const { error: checkError } = await supabase.from("collector_ideas").select("id").limit(1)

        if (checkError && checkError.code === "PGRST116") {
          // Table doesn't exist, just use mock data
          await recordAction("submit_idea")
          return mockIdea
        }

        const { data, error } = await supabase
          .from("collector_ideas")
          .insert({
            collector_id: collectorId,
            artist_id: artistId,
            title,
            description,
            submitted_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (!error) {
          await recordAction("submit_idea")
          return data
        } else {
          console.log("Error submitting idea:", error)
          await recordAction("submit_idea")
          return mockIdea
        }
      } catch (error) {
        console.log("collector_ideas table might not exist yet:", error)
        await recordAction("submit_idea")
        return mockIdea
      }
    } catch (err) {
      console.error("Error submitting idea:", err)
      return null
    }
  }

  return {
    influence: influenceData,
    loading,
    error,
    recordAction,
    submitIdea,
    recentContributors,
    topContributors,
    implementedIdeas,
  }
}

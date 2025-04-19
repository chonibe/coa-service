"use client"

import { useState, useEffect } from "react"
import {
  fetchInstagramProfile,
  fetchInstagramMedia,
  fetchInstagramStories,
  markStoryViewed,
} from "@/app/actions/instagram"

export function useArtistInstagram(artistId: string) {
  const [profile, setProfile] = useState<any>(null)
  const [stories, setStories] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadInstagramData = async () => {
      try {
        setLoading(true)

        // Load profile, stories, and posts in parallel
        const [profileResult, storiesResult, postsResult] = await Promise.all([
          fetchInstagramProfile(artistId),
          fetchInstagramStories(artistId),
          fetchInstagramMedia(artistId, 6),
        ])

        if (profileResult.profile) {
          setProfile(profileResult.profile)
          setIsConnected(true)
        }

        if (storiesResult.stories) {
          setStories(storiesResult.stories)
        }

        if (postsResult.media) {
          setPosts(postsResult.media)
        }
      } catch (err) {
        console.error("Error loading Instagram data:", err)
        setError(err instanceof Error ? err : new Error("Failed to load Instagram data"))
      } finally {
        setLoading(false)
      }
    }

    if (artistId) {
      loadInstagramData()
    }
  }, [artistId])

  // Mark a story as viewed
  const viewStory = async (storyId: string, collectorId: string) => {
    try {
      await markStoryViewed(storyId, collectorId)
    } catch (error) {
      console.error("Error marking story as viewed:", error)
    }
  }

  return {
    profile,
    stories,
    posts,
    isConnected,
    loading,
    error,
    viewStory,
  }
}

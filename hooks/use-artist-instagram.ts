"use client"

import { useState, useEffect } from "react"
import {
  getArtistInstagramProfile,
  getArtistInstagramStories,
  getArtistRecentPosts,
  hasConnectedInstagram,
} from "@/lib/services/instagram-service"

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

        // Check if Instagram is connected
        const connected = await hasConnectedInstagram(artistId)
        setIsConnected(connected)

        if (connected) {
          // Load profile, stories, and posts in parallel
          const [profileData, storiesData, postsData] = await Promise.all([
            getArtistInstagramProfile(artistId),
            getArtistInstagramStories(artistId),
            getArtistRecentPosts(artistId, 6),
          ])

          setProfile(profileData)
          setStories(storiesData)
          setPosts(postsData)
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

  return {
    profile,
    stories,
    posts,
    isConnected,
    loading,
    error,
  }
}

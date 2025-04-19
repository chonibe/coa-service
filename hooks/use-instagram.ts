"use client"

import { useState, useEffect } from "react"
import type { InstagramProfile, InstagramMedia, InstagramStory } from "@/types/instagram"

interface UseInstagramProps {
  vendorId: string
  accountId: string
}

interface UseInstagramReturn {
  profile: InstagramProfile | null
  posts: InstagramMedia[] | null
  stories: InstagramStory[] | null
  isLoading: boolean
  error: string | null
}

export function useInstagram({ vendorId, accountId }: UseInstagramProps): UseInstagramReturn {
  const [profile, setProfile] = useState<InstagramProfile | null>(null)
  const [posts, setPosts] = useState<InstagramMedia[] | null>(null)
  const [stories, setStories] = useState<InstagramStory[] | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInstagramData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch profile data
        const profileResponse = await fetch(`/api/instagram/profile?vendorId=${vendorId}&accountId=${accountId}`)
        if (!profileResponse.ok) {
          throw new Error(`Failed to fetch Instagram profile: ${profileResponse.statusText}`)
        }
        const { profile: profileData } = await profileResponse.json()
        setProfile(profileData)

        // Fetch media data
        const mediaResponse = await fetch(`/api/instagram/media?vendorId=${vendorId}&accountId=${accountId}`)
        if (!mediaResponse.ok) {
          throw new Error(`Failed to fetch Instagram media: ${mediaResponse.statusText}`)
        }
        const { media: mediaData } = await mediaResponse.json()
        setPosts(mediaData)

        // Fetch stories data
        const storiesResponse = await fetch(`/api/instagram/stories?vendorId=${vendorId}&accountId=${accountId}`)
        if (!storiesResponse.ok) {
          throw new Error(`Failed to fetch Instagram stories: ${storiesResponse.statusText}`)
        }
        const { stories: storiesData } = await storiesResponse.json()
        setStories(storiesData)
      } catch (error: any) {
        console.error("Error fetching Instagram data:", error)
        setError(error.message || "Failed to fetch Instagram data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstagramData()
  }, [vendorId, accountId])

  return { profile, posts, stories, isLoading, error }
}

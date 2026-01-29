"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { RefreshCw } from "lucide-react"
import { StoryCircles } from "./StoryCircles"
import { AddToStorySheet } from "./AddToStorySheet"
import type { StoryPost, StoryUser } from "@/lib/story/types"

// ============================================
// localStorage helpers for tracking seen stories
// ============================================

const getSeenStoriesKey = (productId: string) => `seen-stories-${productId}`

const getSeenStories = (productId: string): Set<string> => {
  if (typeof window === 'undefined') return new Set()
  try {
    const key = getSeenStoriesKey(productId)
    const stored = localStorage.getItem(key)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

const markStorySeen = (productId: string, storyId: string): void => {
  if (typeof window === 'undefined') return
  try {
    const key = getSeenStoriesKey(productId)
    const seen = getSeenStories(productId)
    seen.add(storyId)
    localStorage.setItem(key, JSON.stringify([...seen]))
  } catch {
    // Ignore localStorage errors
  }
}

// ============================================

interface SharedStoryTimelineProps {
  productId: string
  productName: string
  isOwner: boolean // Does the current user own this artwork?
  isArtist?: boolean // Is the current user the artist?
  onReply?: (postId: string) => void
  isPreview?: boolean // Is this being shown in preview mode?
}

/**
 * SharedStoryTimeline - Instagram-style story circles with full-screen viewer
 * 
 * Features:
 * - Horizontal story circles row
 * - Full-screen tap-through story viewer
 * - "Add to Story" button for owners/artists
 * - Auto-grouping of posts by author
 */
export function SharedStoryTimeline({
  productId,
  productName,
  isOwner,
  isArtist = false,
  onReply,
  isPreview = false,
}: SharedStoryTimelineProps) {
  const [posts, setPosts] = useState<StoryPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [seenStoryIds, setSeenStoryIds] = useState<Set<string>>(new Set())

  // Load seen stories from localStorage on mount
  useEffect(() => {
    setSeenStoryIds(getSeenStories(productId))
  }, [productId])

  const apiBase = isArtist 
    ? `/api/vendor/story/${productId}`
    : `/api/collector/story/${productId}`

  const fetchPosts = useCallback(async () => {
    // Skip API call in preview mode
    if (isPreview) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(apiBase, {
        credentials: "include",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch story")
      }

      setPosts(data.posts || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [apiBase, isPreview])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Group posts by author into StoryUser objects
  const storyUsers = useMemo((): StoryUser[] => {
    const userMap = new Map<string, StoryUser>()

    // Sort posts by created_at (newest first for each user)
    const sortedPosts = [...posts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    for (const post of sortedPosts) {
      const existingUser = userMap.get(post.author_id)
      
      if (existingUser) {
        existingUser.stories.push(post)
        // Update hasUnseenStories if this story is unseen
        if (!seenStoryIds.has(post.id)) {
          existingUser.hasUnseenStories = true
        }
      } else {
        userMap.set(post.author_id, {
          id: post.author_id,
          name: post.author_name,
          avatarUrl: post.author_avatar_url,
          isArtist: post.author_type === 'artist',
          stories: [post],
          hasUnseenStories: !seenStoryIds.has(post.id),
        })
      }
    }

    // Sort users: artist first, then by most recent story
    return Array.from(userMap.values()).sort((a, b) => {
      if (a.isArtist && !b.isArtist) return -1
      if (!a.isArtist && b.isArtist) return 1
      
      const aLatest = new Date(a.stories[0]?.created_at || 0).getTime()
      const bLatest = new Date(b.stories[0]?.created_at || 0).getTime()
      return bLatest - aLatest
    })
  }, [posts, seenStoryIds])

  // Handler to mark a story as seen
  const handleStorySeen = useCallback((storyId: string) => {
    markStorySeen(productId, storyId)
    setSeenStoryIds(prev => new Set([...prev, storyId]))
  }, [productId])

  // Handle new post created
  const handlePostCreated = (newPost: StoryPost) => {
    setPosts(prev => [newPost, ...prev])
    setShowAddSheet(false)
  }

  // Loading state
  if (isLoading && !isPreview) {
    return (
      <div className="py-8 text-center">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-2">Loading stories...</p>
      </div>
    )
  }

  // Error state (don't show in preview mode)
  if (error && !isPreview) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={() => fetchPosts()}
          className="mt-2 text-sm text-indigo-600 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Story Circles Row */}
      <StoryCircles
        productId={productId}
        productName={productName}
        isOwner={isOwner}
        isArtist={isArtist}
        onAddStory={() => setShowAddSheet(true)}
        users={storyUsers}
        isPreview={isPreview}
        onStorySeen={handleStorySeen}
      />

      {/* Add to Story sheet */}
      <AddToStorySheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        productId={productId}
        isArtist={isArtist}
        onPostCreated={handlePostCreated}
      />
    </div>
  )
}

export default SharedStoryTimeline

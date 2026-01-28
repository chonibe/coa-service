"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RefreshCw, Plus, ChevronDown } from "lucide-react"
import { StoryPostCard } from "./StoryPostCard"
import { AddToStorySheet } from "./AddToStorySheet"
import type { StoryPost } from "@/lib/story/types"

interface SharedStoryTimelineProps {
  productId: string
  productName: string
  isOwner: boolean // Does the current user own this artwork?
  isArtist?: boolean // Is the current user the artist?
  onReply?: (postId: string) => void
}

/**
 * SharedStoryTimeline - The main story feed component
 * 
 * Features:
 * - Pull-to-refresh on mobile
 * - Infinite scroll (if needed)
 * - Floating "Add to Story" button
 * - Empty state
 */
export function SharedStoryTimeline({
  productId,
  productName,
  isOwner,
  isArtist = false,
  onReply,
}: SharedStoryTimelineProps) {
  const [posts, setPosts] = useState<StoryPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddSheet, setShowAddSheet] = useState(false)
  
  // Pull-to-refresh state
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const startY = useRef(0)

  const apiBase = isArtist 
    ? `/api/vendor/story/${productId}`
    : `/api/collector/story/${productId}`

  const fetchPosts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
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
      setIsRefreshing(false)
    }
  }, [apiBase])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    if (diff > 0 && diff < 150) {
      setPullDistance(diff)
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      fetchPosts(true)
    }
    setPullDistance(0)
    setIsPulling(false)
  }

  // Moderation handler
  const handleModerate = async (postId: string, action: 'hide' | 'pin') => {
    if (!isArtist) return

    const post = posts.find(p => p.id === postId)
    if (!post) return

    const updateData = action === 'hide' 
      ? { is_visible: !post.is_visible }
      : { is_pinned: !post.is_pinned }

    try {
      const response = await fetch(`/api/vendor/story/${productId}/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const data = await response.json()
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...data.post } : p))
      }
    } catch (err) {
      console.error('Failed to moderate post:', err)
    }
  }

  // Handle new post created
  const handlePostCreated = (newPost: StoryPost) => {
    setPosts(prev => [newPost, ...prev])
    setShowAddSheet(false)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin mx-auto" />
        <p className="text-sm text-zinc-500 mt-2">Loading story...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={() => fetchPosts()}
          className="mt-2 text-sm text-blue-500 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
          style={{ height: pullDistance, transform: 'translateY(-100%)' }}
        >
          <RefreshCw 
            className={`w-5 h-5 text-zinc-400 ${pullDistance > 80 ? 'text-blue-500' : ''}`}
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      )}

      {/* Refreshing indicator */}
      {isRefreshing && (
        <div className="py-3 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Story timeline */}
      <div
        ref={containerRef}
        className="space-y-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDistance / 3}px)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Story
          </h2>
          <span className="text-sm text-zinc-500">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        </div>

        {/* Empty state */}
        {posts.length === 0 && (
          <div className="py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <ChevronDown className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
              No story yet
            </h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
              {isOwner 
                ? "Be the first to share a moment with this artwork!"
                : "The story of this artwork is waiting to be written."}
            </p>
            {isOwner && (
              <button
                onClick={() => setShowAddSheet(true)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-colors"
              >
                Add to Story
              </button>
            )}
          </div>
        )}

        {/* Posts */}
        {posts.map((post) => (
          <StoryPostCard
            key={post.id}
            post={post}
            isArtist={isArtist}
            onReply={onReply}
            onModerate={handleModerate}
          />
        ))}
      </div>

      {/* Floating "Add to Story" button */}
      {(isOwner || isArtist) && posts.length > 0 && (
        <button
          onClick={() => setShowAddSheet(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-blue-600 active:scale-95 transition-all"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

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

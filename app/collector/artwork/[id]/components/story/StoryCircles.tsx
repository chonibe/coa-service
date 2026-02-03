"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, CheckCircle2, Lock } from "lucide-react"
import Image from "next/image"
import { StoryViewer } from "./StoryViewer"
import type { StoryCirclesProps, StoryUser } from "@/lib/story/types"

/**
 * StoryCircles - Instagram-style horizontal story circles
 * 
 * Features:
 * - "Add Story" button (first position, if owner)
 * - User avatars with gradient rings (colorful = unseen, gray = viewed)
 * - Artist badge for artist stories
 * - Tap to open StoryViewer at that user's stories
 * - Horizontal scroll with touch support
 * - Lock indicator for non-authenticated users
 */
export function StoryCircles({
  productId,
  productName,
  isOwner,
  isArtist = false,
  onAddStory,
  users = [],
  isPreview = false,
  onStorySeen,
  onAuthRequired, // New prop for showing authentication prompt
}: StoryCirclesProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Handle add story button click
  const handleAddStory = () => {
    if (isOwner || isArtist) {
      onAddStory()
    } else if (onAuthRequired) {
      // Show authentication prompt
      onAuthRequired()
    }
  }

  // Open story viewer at specific user
  const openViewer = (userIndex: number) => {
    if (users.length === 0) return
    setViewerInitialIndex(userIndex)
    setViewerOpen(true)
  }

  // Filter users with stories
  const usersWithStories = users.filter(user => user.stories.length > 0)

  return (
    <>
      <div className="py-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Collector Stories
          </h2>
          {usersWithStories.length > 0 && (
            <span className="text-sm text-gray-500">
              {usersWithStories.length} {usersWithStories.length === 1 ? 'story' : 'stories'}
            </span>
          )}
        </div>

        {/* Circles row */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Add Story button - show for owners, or with lock for non-owners */}
          {(isOwner || isArtist || (!isOwner && !isArtist)) && (
            <button
              onClick={handleAddStory}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 relative group"
              title={!isOwner && !isArtist ? "Authenticate your artwork to add stories" : "Add your story"}
            >
              <div className={`relative w-[68px] h-[68px] rounded-full border-2 ${
                isOwner || isArtist 
                  ? 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400' 
                  : 'border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 hover:border-amber-400'
              } flex items-center justify-center transition-colors`}>
                {isOwner || isArtist ? (
                  <Plus className="w-7 h-7 text-gray-400" />
                ) : (
                  <Lock className="w-6 h-6 text-amber-500" />
                )}
              </div>
              <span className={`text-xs font-medium max-w-[70px] truncate ${
                isOwner || isArtist ? 'text-gray-600' : 'text-amber-600'
              }`}>
                {isOwner || isArtist ? 'Add Story' : 'Locked'}
              </span>
            </button>
          )}

          {/* User circles */}
          {usersWithStories.map((user, index) => (
            <StoryCircle
              key={user.id}
              user={user}
              onClick={() => openViewer(index)}
            />
          ))}

          {/* Empty state hint */}
          {usersWithStories.length === 0 && !isOwner && !isArtist && (
            <div className="flex items-center justify-center w-full py-4">
              <p className="text-sm text-gray-500">
                No stories yet
              </p>
            </div>
          )}

          {/* Preview mode hint */}
          {isPreview && usersWithStories.length === 0 && (isOwner || isArtist) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <p className="text-xs text-amber-700">
                Collectors will add their stories here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      <StoryViewer
        users={usersWithStories}
        initialUserIndex={viewerInitialIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onStorySeen={onStorySeen}
      />
    </>
  )
}

/**
 * Individual story circle with gradient ring
 */
interface StoryCircleProps {
  user: StoryUser
  onClick: () => void
}

function StoryCircle({ user, onClick }: StoryCircleProps) {
  // Get first story's image as background
  const firstStory = user.stories[0]
  const previewImage = firstStory?.media_url || firstStory?.media_thumbnail_url

  // Gradient colors based on unseen status
  const gradientClasses = user.hasUnseenStories
    ? 'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500'
    : 'bg-gray-300'

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
    >
      {/* Outer gradient ring */}
      <div className={`p-[3px] rounded-full ${gradientClasses}`}>
        {/* Inner white ring */}
        <div className="p-[2px] rounded-full bg-white">
          {/* Avatar container */}
          <div className="relative w-[60px] h-[60px] rounded-full overflow-hidden">
            {previewImage ? (
              <Image
                src={previewImage}
                alt={user.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-200"
                sizes="60px"
              />
            ) : user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-200"
                sizes="60px"
                unoptimized={user.avatarUrl.toLowerCase().endsWith('.gif')}
              />
            ) : (
              // Fallback gradient with initial
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Artist badge */}
            {user.isArtist && (
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Name */}
      <span className="text-xs text-gray-700 font-medium max-w-[70px] truncate">
        {user.isArtist ? 'Artist' : user.name}
      </span>
    </button>
  )
}

export default StoryCircles

"use client"

import { useState } from "react"
import Image from "next/image"
import { 
  MapPin, 
  Clock, 
  Play, 
  Pause, 
  Volume2, 
  MoreHorizontal,
  MessageCircle,
  Pin
} from "lucide-react"
import type { StoryPost } from "@/lib/story/types"
import { formatLocation, formatRelativeTime, getCountryFlag } from "@/lib/story/types"
import { ArtistReplyCard } from "./ArtistReplyCard"

interface StoryPostCardProps {
  post: StoryPost
  isArtist?: boolean
  onReply?: (postId: string) => void
  onModerate?: (postId: string, action: 'hide' | 'pin') => void
}

/**
 * StoryPostCard - Displays a single story post
 * 
 * Features:
 * - Responsive location layout (wraps on small screens)
 * - Photo/voice note rendering
 * - Artist badge
 * - Reply button (for artists only)
 * - Nested artist replies
 */
export function StoryPostCard({
  post,
  isArtist = false,
  onReply,
  onModerate,
}: StoryPostCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const isAuthorArtist = post.author_type === 'artist'
  const hasLocation = post.city || post.country
  const hasReplies = post.replies && post.replies.length > 0

  // Format voice duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`relative ${!post.is_visible ? 'opacity-50' : ''}`}>
      {/* Main post card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
        {/* Header: Avatar, name, time, location */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {post.author_avatar_url ? (
              <Image
                src={post.author_avatar_url}
                alt={post.author_name}
                width={44}
                height={44}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                {post.author_name.charAt(0).toUpperCase()}
              </div>
            )}
            {isAuthorArtist && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>

          {/* Name, badges, meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-zinc-900 dark:text-white">
                {post.author_name}
              </span>
              {isAuthorArtist && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                  Artist
                </span>
              )}
              {post.is_pinned && (
                <Pin className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            
            {/* Time and location - responsive wrap */}
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatRelativeTime(post.created_at)}
              </span>
              {hasLocation && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    {post.country_code && (
                      <span className="text-base leading-none">
                        {getCountryFlag(post.country_code)}
                      </span>
                    )}
                    {!post.country_code && <MapPin className="w-3.5 h-3.5" />}
                    <span className="truncate max-w-[150px] sm:max-w-none">
                      {formatLocation(post)}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Menu button (for artists to moderate) */}
          {isArtist && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 -m-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      onModerate?.(post.id, post.is_pinned ? 'pin' : 'pin')
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    {post.is_pinned ? 'Unpin' : 'Pin post'}
                  </button>
                  <button
                    onClick={() => {
                      onModerate?.(post.id, 'hide')
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 text-red-600"
                  >
                    {post.is_visible ? 'Hide post' : 'Show post'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-3">
          {/* Text content */}
          {post.text_content && (
            <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">
              {post.text_content}
            </p>
          )}

          {/* Photo */}
          {post.content_type === 'photo' && post.media_url && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <Image
                src={post.media_url}
                alt="Story photo"
                width={500}
                height={400}
                className="w-full h-auto object-cover max-h-[400px]"
              />
            </div>
          )}

          {/* Voice note */}
          {post.content_type === 'voice_note' && post.media_url && (
            <div className="mt-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">
                    Voice note
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {formatDuration(post.voice_duration_seconds)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {isArtist && !isAuthorArtist && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => onReply?.(post.id)}
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Reply
            </button>
          </div>
        )}
      </div>

      {/* Nested artist replies */}
      {hasReplies && (
        <div className="mt-2 space-y-2">
          {post.replies!.map((reply) => (
            <ArtistReplyCard key={reply.id} reply={reply} />
          ))}
        </div>
      )}
    </div>
  )
}

export default StoryPostCard

"use client"

import Image from "next/image"
import { Clock, MapPin, CheckCircle } from "lucide-react"
import type { StoryPost } from "@/lib/story/types"
import { formatLocation, formatRelativeTime, getCountryFlag } from "@/lib/story/types"

interface ArtistReplyCardProps {
  reply: StoryPost
}

/**
 * ArtistReplyCard - Displays artist reply with shallow indent
 * 
 * Features:
 * - Shallow indent (not deeply nested)
 * - "Artist Reply" badge (PUBLIC visibility indicator)
 * - Compact layout
 */
export function ArtistReplyCard({ reply }: ArtistReplyCardProps) {
  const hasLocation = reply.city || reply.country

  return (
    <div className="ml-6 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
      <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-3">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {reply.author_avatar_url ? (
              <Image
                src={reply.author_avatar_url}
                alt={reply.author_name}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                {reply.author_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Name and meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                {reply.author_name}
              </span>
              <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs font-medium rounded">
                Artist Reply
              </span>
            </div>
            
            {/* Time and location */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(reply.created_at)}
              </span>
              {hasLocation && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    {reply.country_code && (
                      <span className="text-sm leading-none">
                        {getCountryFlag(reply.country_code)}
                      </span>
                    )}
                    {!reply.country_code && <MapPin className="w-3 h-3" />}
                    <span className="truncate max-w-[120px]">
                      {formatLocation(reply)}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {reply.text_content && (
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
            {reply.text_content}
          </p>
        )}

        {/* Photo */}
        {reply.content_type === 'photo' && reply.media_url && (
          <div className="mt-2 rounded-lg overflow-hidden">
            <Image
              src={reply.media_url}
              alt="Reply photo"
              width={300}
              height={200}
              className="w-full h-auto object-cover max-h-[200px]"
            />
          </div>
        )}

        {/* Public visibility notice */}
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <span className="opacity-70">Visible to all collectors</span>
        </div>
      </div>
    </div>
  )
}

export default ArtistReplyCard

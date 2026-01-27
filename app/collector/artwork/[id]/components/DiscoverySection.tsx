"use client"

import React, { useState, useEffect } from "react"
import { Sparkles, Lock, Clock, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatCountdown } from "@/lib/countdown"

interface DiscoveryArtwork {
  id: string
  name: string
  imgUrl: string
  isOwned?: boolean
  isLocked?: boolean
}

interface DiscoverySectionProps {
  artworkId: string
  artistName: string
  seriesId?: string
  unlockedContent?: {
    type: "hidden_series" | "vip_artwork" | "vip_series"
    id: string
    name: string
    thumbnailUrl?: string
  }
  seriesInfo?: {
    name: string
    totalCount: number
    ownedCount: number
    artworks: DiscoveryArtwork[]
    nextArtwork?: { id: string; name: string; imgUrl: string }
    unlockType: "sequential" | "time_based" | "threshold" | "any_purchase"
  }
  countdown?: {
    unlockAt: string // ISO timestamp
    artworkName: string
    artworkImgUrl?: string
  }
  moreFromArtist?: Array<{
    id: string
    name: string
    imgUrl: string
    price?: string
  }>
}

/**
 * DiscoverySection - End-of-page section showing what comes next
 * 
 * Display priority:
 * 1. Unlock Reward - If owning this artwork unlocks hidden content
 * 2. Series Countdown - If part of time-based series with upcoming unlocks
 * 3. Next in Series - If part of sequential series
 * 4. More from Artist - Next drops or other artworks
 */
const DiscoverySection: React.FC<DiscoverySectionProps> = ({
  artistName,
  unlockedContent,
  seriesInfo,
  countdown,
  moreFromArtist,
}) => {
  const [countdownText, setCountdownText] = useState("")

  // Update countdown every second
  useEffect(() => {
    if (!countdown) return

    const updateCountdown = () => {
      setCountdownText(formatCountdown(countdown.unlockAt))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [countdown])

  // Hide section if no discovery data
  if (!unlockedContent && !seriesInfo && !countdown && !moreFromArtist) {
    return null
  }

  return (
    <section className="py-8 md:py-16">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="h-6 w-6 text-purple-400" />
        <h2 className="text-2xl md:text-3xl font-bold text-white">Discover More</h2>
      </div>

      {/* Unlocked Content */}
      {unlockedContent && (
        <div className="bg-gradient-to-br from-purple-900/30 via-gray-900/50 to-pink-900/30 rounded-2xl p-8 md:p-10 shadow-2xl border border-purple-500/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full text-purple-300 text-sm font-semibold mb-6">
              <Lock className="h-4 w-4" />
              UNLOCKED BY THIS PIECE
            </div>

            {unlockedContent.thumbnailUrl && (
              <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 rounded-2xl overflow-hidden">
                <Image
                  src={unlockedContent.thumbnailUrl}
                  alt={unlockedContent.name}
                  fill
                  className="object-cover blur-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}

            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {unlockedContent.name}
            </h3>
            <p className="text-gray-400 mb-8">
              You've unlocked access to this exclusive{" "}
              {unlockedContent.type.replace(/_/g, " ")}
            </p>

            <Link
              href={`/collector/${unlockedContent.type === "hidden_series" ? "series" : "artwork"}/${unlockedContent.id}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/50 active:scale-95"
            >
              <span>Explore Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      )}

      {/* Series Progress */}
      {!unlockedContent && seriesInfo && (
        <div className="bg-gradient-to-br from-blue-900/30 via-gray-900/50 to-cyan-900/30 rounded-2xl p-8 md:p-10 shadow-2xl border border-blue-500/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full text-blue-300 text-sm font-semibold mb-6">
              NEXT IN SERIES
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {seriesInfo.name}
            </h3>
            <p className="text-xl text-blue-400 mb-8">
              {seriesInfo.ownedCount} of {seriesInfo.totalCount} collected
            </p>

            {/* Series Progress Dots */}
            <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
              {seriesInfo.artworks.map((artwork, index) => (
                <div
                  key={artwork.id}
                  className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                    artwork.isOwned
                      ? "bg-green-600 text-white scale-110 shadow-lg shadow-green-500/50"
                      : artwork.isLocked
                      ? "bg-gray-700 text-gray-400"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {artwork.isOwned ? "✓" : artwork.isLocked ? <Lock className="h-5 w-5" /> : index + 1}
                </div>
              ))}
            </div>

            {seriesInfo.nextArtwork && (
              <p className="text-gray-400 mb-8">
                Next unlock: <span className="text-white font-semibold">"{seriesInfo.nextArtwork.name}"</span>
              </p>
            )}

            <Link
              href={`/collector/series/${seriesInfo.name}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/50 active:scale-95"
            >
              <span>View Series</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      )}

      {/* Countdown */}
      {!unlockedContent && !seriesInfo && countdown && (
        <div className="bg-gradient-to-br from-orange-900/30 via-gray-900/50 to-red-900/30 rounded-2xl p-8 md:p-10 shadow-2xl border border-orange-500/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full text-orange-300 text-sm font-semibold mb-6">
              <Clock className="h-4 w-4" />
              COMING SOON
            </div>

            {countdown.artworkImgUrl && (
              <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 rounded-2xl overflow-hidden">
                <Image
                  src={countdown.artworkImgUrl}
                  alt={countdown.artworkName}
                  fill
                  className="object-cover blur-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock className="h-12 w-12 text-white/80" />
                </div>
              </div>
            )}

            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
              {countdown.artworkName}
            </h3>
            <p className="text-gray-400 mb-4">Next artwork unlocks in</p>
            <p className="text-4xl md:text-5xl font-bold text-orange-400 mb-8 font-mono">
              {countdownText}
            </p>

            <button className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-orange-500/50 active:scale-95">
              <Clock className="h-5 w-5" />
              <span>Set Reminder</span>
            </button>
          </div>
        </div>
      )}

      {/* More from Artist */}
      {!unlockedContent && !seriesInfo && !countdown && moreFromArtist && moreFromArtist.length > 0 && (
        <div className="bg-gradient-to-br from-green-900/30 via-gray-900/50 to-emerald-900/30 rounded-2xl p-8 md:p-10 shadow-2xl border border-green-500/20 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              More from {artistName}
            </h3>
          </div>

          {/* Horizontal Scroll */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {moreFromArtist.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/collector/artwork/${artwork.id}`}
                  className="flex-shrink-0 w-40 md:w-48 snap-start group"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 ring-2 ring-gray-700 group-hover:ring-green-500 transition-all">
                    <Image
                      src={artwork.imgUrl}
                      alt={artwork.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                    {artwork.name}
                  </p>
                  {artwork.price && (
                    <p className="text-xs text-gray-400">{artwork.price}</p>
                  )}
                </Link>
              ))}
            </div>

            {/* Fade Edges */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-950 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-950 to-transparent pointer-events-none" />
          </div>

          <div className="text-center mt-8">
            <Link
              href={`/collector/artist/${artistName.toLowerCase().replace(/ /g, "-")}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-green-500/50 active:scale-95"
            >
              <span>View All</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}

export default DiscoverySection

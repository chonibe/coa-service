"use client"

import React from "react"
import { Music, ExternalLink } from "lucide-react"
import { getSpotifyEmbedUrl, isValidSpotifyUrl } from "@/lib/spotify"

interface SoundtrackSectionProps {
  spotifyUrl: string
  note?: string
}

/**
 * SoundtrackSection - Displays a Spotify track embed with optional artist note
 * 
 * Features:
 * - Spotify iframe embed (no auth required)
 * - Optional artist note about the track
 * - "Open in Spotify" link
 * - Modern, immersive design
 */
const SoundtrackSection: React.FC<SoundtrackSectionProps> = ({ spotifyUrl, note }) => {
  if (!spotifyUrl || !isValidSpotifyUrl(spotifyUrl)) {
    return null
  }

  const embedUrl = getSpotifyEmbedUrl(spotifyUrl)

  if (!embedUrl) {
    return null
  }

  return (
    <section className="py-8 md:py-16">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <Music className="h-6 w-6 text-green-400" />
        <h2 className="text-2xl md:text-3xl font-bold text-white">Soundtrack</h2>
      </div>

      {/* Spotify Embed */}
      <div className="bg-gray-900/50 rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50 backdrop-blur-sm">
        <iframe
          src={embedUrl}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="w-full"
          style={{ border: 0 }}
        />

        {/* Artist Note */}
        {note && (
          <div className="p-6 md:p-8 bg-gradient-to-b from-gray-900/50 to-transparent">
            <blockquote className="text-gray-300 text-base md:text-lg leading-relaxed italic border-l-4 border-green-500 pl-6">
              "{note}"
            </blockquote>
            <p className="text-sm text-gray-500 mt-3 pl-6">— Artist's Note</p>
          </div>
        )}
      </div>

      {/* Open in Spotify Link */}
      <a
        href={spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-6 text-green-400 hover:text-green-300 transition-colors font-medium group"
      >
        <span>Open in Spotify</span>
        <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>
    </section>
  )
}

export default SoundtrackSection

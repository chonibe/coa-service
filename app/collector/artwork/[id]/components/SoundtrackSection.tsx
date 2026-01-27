"use client"

import { useEffect, useState } from "react"
import { Music, ExternalLink } from "lucide-react"

interface SoundtrackSectionProps {
  title?: string
  config: {
    spotify_url?: string
    note?: string
  }
}

export default function SoundtrackSection({ title, config }: SoundtrackSectionProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const { spotify_url, note } = config || {}

  useEffect(() => {
    if (spotify_url) {
      // Extract track ID and create embed URL
      try {
        const url = new URL(spotify_url)
        if (url.hostname === "open.spotify.com" && url.pathname.includes("/track/")) {
          const pathParts = url.pathname.split("/")
          const trackIndex = pathParts.indexOf("track")
          if (trackIndex !== -1 && pathParts[trackIndex + 1]) {
            const trackId = pathParts[trackIndex + 1].split("?")[0]
            setEmbedUrl(`https://open.spotify.com/embed/track/${trackId}`)
          }
        }
      } catch (error) {
        console.error("Invalid Spotify URL:", error)
      }
    }
  }, [spotify_url])

  if (!spotify_url || !embedUrl) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Music className="h-6 w-6 text-green-500" />
          {title || "Soundtrack"}
        </h2>
        <a
          href={spotify_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-green-500 hover:text-green-400 flex items-center gap-1 transition-colors"
        >
          Open in Spotify
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Spotify Embed */}
      <div className="relative w-full rounded-lg overflow-hidden bg-gray-900 shadow-xl">
        <iframe
          src={embedUrl}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="w-full"
        />
      </div>

      {/* Artist Note */}
      {note && (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
          <p className="text-gray-300 leading-relaxed italic">
            "{note}"
          </p>
        </div>
      )}
    </div>
  )
}

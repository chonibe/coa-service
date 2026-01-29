"use client"

import { useEffect, useState } from "react"
import { Music, ExternalLink, AlertCircle } from "lucide-react"

interface SoundtrackSectionProps {
  title?: string
  config: {
    spotify_url?: string
    note?: string
  }
}

// Helper function to extract Spotify embed URL from various Spotify URL formats
function getSpotifyEmbedUrl(url: string): { embedUrl: string | null; error: string | null } {
  try {
    const urlObj = new URL(url)
    
    // Must be a Spotify URL
    if (!urlObj.hostname.includes("spotify.com")) {
      return { embedUrl: null, error: "Not a valid Spotify URL" }
    }

    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    
    // Support multiple Spotify content types
    // Tracks: open.spotify.com/track/{id}
    // Albums: open.spotify.com/album/{id}
    // Playlists: open.spotify.com/playlist/{id}
    // Episodes: open.spotify.com/episode/{id}
    // Shows: open.spotify.com/show/{id}
    // Artists: open.spotify.com/artist/{id}
    
    const supportedTypes = ["track", "album", "playlist", "episode", "show", "artist"]
    
    for (const type of supportedTypes) {
      const typeIndex = pathParts.indexOf(type)
      if (typeIndex !== -1 && pathParts[typeIndex + 1]) {
        const contentId = pathParts[typeIndex + 1].split("?")[0]
        // Use the new Spotify embed format with theme=0 for dark mode compatibility
        return { 
          embedUrl: `https://open.spotify.com/embed/${type}/${contentId}?utm_source=generator&theme=0`,
          error: null 
        }
      }
    }

    // Handle intl URLs like open.spotify.com/intl-de/track/...
    if (pathParts[0] && pathParts[0].startsWith("intl-")) {
      const remainingParts = pathParts.slice(1)
      for (const type of supportedTypes) {
        const typeIndex = remainingParts.indexOf(type)
        if (typeIndex !== -1 && remainingParts[typeIndex + 1]) {
          const contentId = remainingParts[typeIndex + 1].split("?")[0]
          return { 
            embedUrl: `https://open.spotify.com/embed/${type}/${contentId}?utm_source=generator&theme=0`,
            error: null 
          }
        }
      }
    }

    return { embedUrl: null, error: "Unsupported Spotify URL format" }
  } catch (error) {
    return { embedUrl: null, error: "Invalid URL" }
  }
}

export default function SoundtrackSection({ title, config }: SoundtrackSectionProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { spotify_url, note } = config || {}

  useEffect(() => {
    if (spotify_url) {
      const result = getSpotifyEmbedUrl(spotify_url)
      setEmbedUrl(result.embedUrl)
      setError(result.error)
    } else {
      setEmbedUrl(null)
      setError(null)
    }
  }, [spotify_url])

  if (!spotify_url) {
    return null
  }

  return (
    <div className="py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-500/10">
            <Music className="h-5 w-5 text-green-500" />
          </div>
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
      {embedUrl ? (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-black">
          <iframe
            src={embedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full"
            style={{ borderRadius: "12px" }}
          />
        </div>
      ) : error ? (
        <div className="p-6 bg-muted/30 rounded-2xl flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="font-medium">Could not embed Spotify player</p>
            <p className="text-sm">{error}</p>
            <a 
              href={spotify_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-green-500 hover:underline"
            >
              Click here to open in Spotify
            </a>
          </div>
        </div>
      ) : null}

      {/* Artist Note */}
      {note && (
        <div className="mt-6 bg-green-500/5 rounded-2xl p-6 border border-green-500/10">
          <p className="text-muted-foreground leading-relaxed italic text-lg">
            "{note}"
          </p>
        </div>
      )}
    </div>
  )
}

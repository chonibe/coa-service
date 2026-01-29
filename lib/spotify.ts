// Spotify URL validation and embed utilities
// No authentication required - uses public embed URLs

// Supported Spotify content types
const SUPPORTED_TYPES = ["track", "album", "playlist", "episode", "show", "artist"] as const
type SpotifyContentType = typeof SUPPORTED_TYPES[number]

export function isValidSpotifyUrl(url: string): boolean {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes("spotify.com")
  } catch {
    return false
  }
}

export function parseSpotifyUrl(url: string): { type: SpotifyContentType; id: string } | null {
  if (!url) return null
  
  try {
    const urlObj = new URL(url)
    
    if (!urlObj.hostname.includes("spotify.com")) {
      return null
    }

    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    
    // Handle intl URLs like open.spotify.com/intl-de/track/...
    if (pathParts[0] && pathParts[0].startsWith("intl-")) {
      pathParts.shift() // Remove the intl prefix
    }

    // Find the content type and ID
    for (const type of SUPPORTED_TYPES) {
      const typeIndex = pathParts.indexOf(type)
      if (typeIndex !== -1 && pathParts[typeIndex + 1]) {
        const contentId = pathParts[typeIndex + 1].split("?")[0]
        return { type, id: contentId }
      }
    }

    return null
  } catch {
    return null
  }
}

export function extractSpotifyTrackId(url: string): string | null {
  const parsed = parseSpotifyUrl(url)
  if (parsed?.type === "track") {
    return parsed.id
  }
  return null
}

export function getSpotifyEmbedUrl(trackUrl: string, options?: { compact?: boolean }): string | null {
  const parsed = parseSpotifyUrl(trackUrl)
  if (!parsed) return null
  
  // Build the embed URL with theme=0 for dark mode compatibility
  const embedUrl = `https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0`
  return embedUrl
}

export async function fetchSpotifyOEmbed(url: string): Promise<{ html: string; title: string; artist: string } | null> {
  if (!isValidSpotifyUrl(url)) return null
  
  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`)
    
    if (!response.ok) return null
    
    const data = await response.json()
    return {
      html: data.html,
      title: data.title,
      artist: data.provider_name
    }
  } catch (error) {
    console.error("Failed to fetch Spotify oEmbed:", error)
    return null
  }
}

export function processSpotifyUrl(url: string): {
  isValid: boolean
  trackId: string | null
  contentType: SpotifyContentType | null
  embedUrl: string | null
  error?: string
} {
  if (!url) {
    return {
      isValid: false,
      trackId: null,
      contentType: null,
      embedUrl: null,
      error: "URL is required"
    }
  }
  
  if (!isValidSpotifyUrl(url)) {
    return {
      isValid: false,
      trackId: null,
      contentType: null,
      embedUrl: null,
      error: "Invalid Spotify URL"
    }
  }
  
  const parsed = parseSpotifyUrl(url)
  
  if (!parsed) {
    return {
      isValid: false,
      trackId: null,
      contentType: null,
      embedUrl: null,
      error: "Unsupported Spotify URL format. Supported: tracks, albums, playlists, episodes, shows, artists"
    }
  }
  
  const embedUrl = getSpotifyEmbedUrl(url)
  
  return {
    isValid: true,
    trackId: parsed.type === "track" ? parsed.id : null,
    contentType: parsed.type,
    embedUrl,
  }
}

// Human-readable labels for content types
export function getSpotifyContentTypeLabel(type: SpotifyContentType): string {
  const labels: Record<SpotifyContentType, string> = {
    track: "Track",
    album: "Album",
    playlist: "Playlist",
    episode: "Episode",
    show: "Podcast",
    artist: "Artist",
  }
  return labels[type] || type
}

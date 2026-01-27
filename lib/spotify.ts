// Spotify URL validation and embed utilities
// No authentication required - uses public oEmbed API

export function isValidSpotifyUrl(url: string): boolean {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === "open.spotify.com" && urlObj.pathname.includes("/track/")
  } catch {
    return false
  }
}

export function extractSpotifyTrackId(url: string): string | null {
  if (!isValidSpotifyUrl(url)) return null
  
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    const trackIndex = pathParts.indexOf("track")
    
    if (trackIndex !== -1 && pathParts[trackIndex + 1]) {
      return pathParts[trackIndex + 1].split("?")[0]
    }
    
    return null
  } catch {
    return null
  }
}

export function getSpotifyEmbedUrl(trackUrl: string): string | null {
  const trackId = extractSpotifyTrackId(trackUrl)
  if (!trackId) return null
  
  return `https://open.spotify.com/embed/track/${trackId}`
}

export async function fetchSpotifyOEmbed(trackUrl: string): Promise<{ html: string; title: string; artist: string } | null> {
  if (!isValidSpotifyUrl(trackUrl)) return null
  
  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trackUrl)}`)
    
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
  embedUrl: string | null
  error?: string
} {
  if (!url) {
    return {
      isValid: false,
      trackId: null,
      embedUrl: null,
      error: "URL is required"
    }
  }
  
  if (!isValidSpotifyUrl(url)) {
    return {
      isValid: false,
      trackId: null,
      embedUrl: null,
      error: "Invalid Spotify URL. Must be a track URL like: https://open.spotify.com/track/..."
    }
  }
  
  const trackId = extractSpotifyTrackId(url)
  const embedUrl = getSpotifyEmbedUrl(url)
  
  return {
    isValid: true,
    trackId,
    embedUrl,
  }
}

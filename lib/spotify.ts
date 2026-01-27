/**
 * Spotify Integration Helpers
 * 
 * Utilities for working with Spotify URLs and embeds.
 * No authentication required for basic embed playback.
 */

/**
 * Validates if a URL is a valid Spotify track URL
 * @param url - The URL to validate
 * @returns true if valid Spotify track URL, false otherwise
 */
export function isValidSpotifyUrl(url: string): boolean {
  if (!url) return false
  
  try {
    const urlObj = new URL(url)
    return (
      urlObj.hostname === "open.spotify.com" &&
      urlObj.pathname.includes("/track/")
    )
  } catch {
    return false
  }
}

/**
 * Extracts the track ID from a Spotify URL
 * @param url - Spotify track URL
 * @returns Track ID or null if invalid
 */
export function extractSpotifyTrackId(url: string): string | null {
  if (!isValidSpotifyUrl(url)) return null
  
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/track\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Generates a Spotify embed iframe URL from a track URL
 * @param trackUrl - Full Spotify track URL
 * @returns Embed URL or null if invalid
 */
export function getSpotifyEmbedUrl(trackUrl: string): string | null {
  const trackId = extractSpotifyTrackId(trackUrl)
  if (!trackId) return null
  
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`
}

/**
 * Validates and prepares a Spotify URL for use
 * @param url - The URL to process
 * @returns Object with validation status and embed URL
 */
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
      error: "Invalid Spotify track URL. Please use a URL like: https://open.spotify.com/track/..."
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

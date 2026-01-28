/**
 * Shared Story Types
 * 
 * A "Shared Story" is a collaborative timeline for an artwork where
 * both the artist and collectors can post updates, photos, and voice notes.
 * Each post includes location (city, country) and timestamp.
 */

export type AuthorType = 'artist' | 'collector'
export type ContentType = 'text' | 'photo' | 'voice_note'

export interface StoryPost {
  id: string
  product_id: string
  
  // Author
  author_type: AuthorType
  author_id: string
  author_name: string
  author_avatar_url?: string
  
  // Content
  content_type: ContentType
  text_content?: string
  media_url?: string
  media_thumbnail_url?: string
  voice_duration_seconds?: number
  
  // Location
  city?: string
  country?: string
  country_code?: string
  
  // Threading
  parent_post_id?: string
  is_artist_reply: boolean
  replies?: StoryPost[] // Populated when fetching
  
  // Status
  is_visible: boolean
  is_pinned: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface CreateStoryPostInput {
  product_id: string
  content_type: ContentType
  text_content?: string
  media_url?: string
  media_thumbnail_url?: string
  voice_duration_seconds?: number
  city?: string
  country?: string
  country_code?: string
  parent_post_id?: string // For artist replies
}

export interface UpdateStoryPostInput {
  text_content?: string
  is_visible?: boolean
  is_pinned?: boolean
}

// Location data from geolocation API
export interface LocationData {
  city?: string
  country?: string
  country_code?: string
  latitude?: number
  longitude?: number
}

// Country codes for common countries (for manual selection)
export const COMMON_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IL', name: 'Israel' },
  { code: 'ZA', name: 'South Africa' },
] as const

// Helper to format location display
export function formatLocation(post: Pick<StoryPost, 'city' | 'country'>): string {
  if (post.city && post.country) {
    return `${post.city}, ${post.country}`
  }
  return post.city || post.country || ''
}

// Helper to format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  if (diffMonths < 12) return `${diffMonths}mo ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Helper to get flag emoji from country code
export function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Type definitions for artwork series and unlock system

export type UnlockType = 'any_purchase' | 'sequential' | 'threshold' | 'time_based' | 'vip'

export interface UnlockConfig {
  order?: string[] // For sequential - array of submission/product IDs in unlock order
  required_count?: number // For threshold - number of artworks needed to unlock
  unlocks?: string[] // Artwork IDs that get unlocked when threshold is met
  unlock_at?: string // ISO timestamp for one-time time-based unlock
  unlock_schedule?: {
    type: 'daily' | 'weekly' | 'custom'
    time: string // HH:MM format
    timezone?: string
    start_date?: string
    end_date?: string
  }
  requires_ownership?: string[] // Artwork IDs that must be owned for VIP unlocks
  vip_tier?: number // Minimum tier level required
  loyalty_points_required?: number
  rules?: any[] // For custom logic
}

export interface ArtworkSeries {
  id: string
  vendor_id: number
  vendor_name: string
  name: string
  description?: string | null
  thumbnail_url?: string | null
  unlock_type: UnlockType
  unlock_config: UnlockConfig
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  member_count?: number // Computed field
  release_date?: string | null // Album release date
  genre_tags?: string[] | null // Series categorization tags
  unlock_progress?: Record<string, any> | null // Track collector progress
  unlock_milestones?: Array<{ milestone: string; achieved_at: string; collector_id?: string }> | null // Achievement markers
}

export interface SeriesMember {
  id: string
  series_id: string
  submission_id?: string | null
  shopify_product_id?: string | null
  is_locked: boolean
  unlock_order?: number | null
  display_order: number
  unlocked_at?: string | null
  artwork_title?: string // Join data
  artwork_image?: string // Join data
}

export interface SeriesFormData {
  name: string
  description?: string
  thumbnail_url?: string
  unlock_type: UnlockType
  unlock_config: UnlockConfig
  display_order: number
  release_date?: string | null
  genre_tags?: string[] | null
  unlock_progress?: Record<string, any> | null
  unlock_milestones?: Array<{ milestone: string; achieved_at: string; collector_id?: string }> | null
}


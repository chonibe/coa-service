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

// Journey Milestone System Types
export type CompletionType = 'all_sold' | 'percentage_sold' | 'manual'

export interface MilestoneConfig {
  completion_type: CompletionType
  completion_threshold?: number // For percentage_sold
  auto_complete: boolean
}

export interface JourneyPosition {
  x: number
  y: number
  level?: number // Depth/tier in journey
  island_group?: string // Grouping for visual organization
}

export interface CompletionProgress {
  total_artworks: number
  sold_artworks: number
  percentage_complete: number
}

export interface JourneyMapSettings {
  id: string
  vendor_id: number
  map_style: 'island' | 'timeline' | 'level' | 'custom'
  background_image_url?: string | null
  theme_colors?: Record<string, any>
  default_series_position?: JourneyPosition
  created_at: string
  updated_at: string
}

export interface SeriesCompletionHistory {
  id: string
  series_id: string
  vendor_id: number
  completed_at: string
  completion_type: string
  final_stats: CompletionProgress
  created_at: string
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
  // Journey Milestone System fields
  milestone_config?: MilestoneConfig | null
  journey_position?: JourneyPosition | null
  completed_at?: string | null
  completion_progress?: CompletionProgress | null
  connected_series_ids?: string[] | null
  unlocks_series_ids?: string[] | null
  is_milestone?: boolean | null
  milestone_order?: number | null
  members?: Array<{
    id: string
    series_id: string
    display_order: number
    is_locked: boolean
    submissions?: {
      id: string
      title: string
      images: string[]
    } | null
  }>
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
  has_benefits?: boolean // Whether artwork has benefits/treasures
  benefit_count?: number // Number of benefits/treasures
  connections?: {
    hidden_series?: { id: string; name: string } | null
    vip_artwork?: { id: string; title: string } | null
    vip_series?: { id: string; name: string } | null
  } // Circular connections from treasures
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


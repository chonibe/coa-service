export type PerkType = "video" | "text" | "link" | "audio" | "code" | "personal-message"

export interface Perk {
  id: string
  artist_id: string
  type: PerkType
  content?: string
  src?: string
  title?: string
  href?: string
  created_at: string
  expires_at?: string
  is_active: boolean
}

export interface Artist {
  id: string
  name: string
  profile_image_url: string
  bio?: string
}

export interface ArtistPerks {
  artist: Artist
  perks: Perk[]
  hasNewContent: boolean
}

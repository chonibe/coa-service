export interface InstagramProfile {
  vendor_id: string
  account_id: string
  username: string
  profile_picture_url: string
  biography: string
  followers_count: number
  follows_count: number
  media_count: number
  created_at: string
  updated_at: string
}

export interface InstagramMedia {
  id: string
  vendor_id: string
  media_type: string
  media_url: string
  permalink: string
  caption: string
  like_count: number
  comments_count: number
  created_at: string
}

export interface InstagramStory {
  id: string
  vendor_id: string
  media_type: string
  media_url: string
  permalink: string
  timestamp: string
  expires_at: string
  created_at: string
}

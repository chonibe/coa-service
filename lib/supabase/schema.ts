// This is a TypeScript representation of our Supabase schema
// You would implement this in Supabase directly

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          name: string
          profile_image_url: string
          bio: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          profile_image_url: string
          bio?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          profile_image_url?: string
          bio?: string
          created_at?: string
        }
      }
      perks: {
        Row: {
          id: string
          artist_id: string
          type: string
          content?: string
          src?: string
          title?: string
          href?: string
          created_at: string
          expires_at?: string
          is_active: boolean
        }
        Insert: {
          id?: string
          artist_id: string
          type: string
          content?: string
          src?: string
          title?: string
          href?: string
          created_at?: string
          expires_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          artist_id?: string
          type?: string
          content?: string
          src?: string
          title?: string
          href?: string
          created_at?: string
          expires_at?: string
          is_active?: boolean
        }
      }
      collector_perks: {
        Row: {
          id: string
          collector_id: string
          perk_id: string
          certificate_id: string
          viewed_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          collector_id: string
          perk_id: string
          certificate_id: string
          viewed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          collector_id?: string
          perk_id?: string
          certificate_id?: string
          viewed_at?: string
          created_at?: string
        }
      }
      collector_preferences: {
        Row: {
          id: string
          collector_id: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collector_id: string
          preferences: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          collector_id?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Types for our application
export type Artist = Database["public"]["Tables"]["artists"]["Row"]
export type Perk = Database["public"]["Tables"]["perks"]["Row"]
export type CollectorPerk = Database["public"]["Tables"]["collector_perks"]["Row"]
export type CollectorPreferences = Database["public"]["Tables"]["collector_preferences"]["Row"]

export type PerkType = "video" | "text" | "link" | "image" | "code" | "ai-message"

export interface ArtistPerks {
  artist: Artist
  perks: Perk[]
  hasNewContent: boolean
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_accounts: {
        Row: {
          auth_id: string | null
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_type: string
          admin_email: string
          created_at: string
          details: Json | null
          id: string
          vendor_id: number | null
        }
        Insert: {
          action_type: string
          admin_email: string
          created_at?: string
          details?: Json | null
          id?: string
          vendor_id?: number | null
        }
        Update: {
          action_type?: string
          admin_email?: string
          created_at?: string
          details?: Json | null
          id?: string
          vendor_id?: number | null
        }
        Relationships: []
      }
      artwork_experience_contents: {
        Row: {
          artwork_experience_id: string | null
          caption: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          description: string | null
          id: string
          is_locked: boolean | null
          media_url: string | null
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          artwork_experience_id?: string | null
          caption?: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_locked?: boolean | null
          media_url?: string | null
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          artwork_experience_id?: string | null
          caption?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_locked?: boolean | null
          media_url?: string | null
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artwork_experience_contents_artwork_experience_id_fkey"
            columns: ["artwork_experience_id"]
            isOneToOne: false
            referencedRelation: "artwork_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_experiences: {
        Row: {
          artist_bio: string
          artist_interview_video: string | null
          artist_portrait: string | null
          artwork_description: string
          artwork_name: string
          audio_narration_url: string | null
          blockchain_certificate_hash: string | null
          community_access_enabled: boolean | null
          created_at: string | null
          creation_process: string | null
          creation_story: string
          edition_number: number
          exclusive_content_enabled: boolean | null
          id: string
          inspiration: string | null
          main_artwork_image: string | null
          nfc_tag_id: string | null
          personal_message: string | null
          product_id: string | null
          status: string | null
          total_editions: number
          updated_at: string | null
          vendor_id: number | null
        }
        Insert: {
          artist_bio: string
          artist_interview_video?: string | null
          artist_portrait?: string | null
          artwork_description: string
          artwork_name: string
          audio_narration_url?: string | null
          blockchain_certificate_hash?: string | null
          community_access_enabled?: boolean | null
          created_at?: string | null
          creation_process?: string | null
          creation_story: string
          edition_number: number
          exclusive_content_enabled?: boolean | null
          id?: string
          inspiration?: string | null
          main_artwork_image?: string | null
          nfc_tag_id?: string | null
          personal_message?: string | null
          product_id?: string | null
          status?: string | null
          total_editions: number
          updated_at?: string | null
          vendor_id?: number | null
        }
        Update: {
          artist_bio?: string
          artist_interview_video?: string | null
          artist_portrait?: string | null
          artwork_description?: string
          artwork_name?: string
          audio_narration_url?: string | null
          blockchain_certificate_hash?: string | null
          community_access_enabled?: boolean | null
          created_at?: string | null
          creation_process?: string | null
          creation_story?: string
          edition_number?: number
          exclusive_content_enabled?: boolean | null
          id?: string
          inspiration?: string | null
          main_artwork_image?: string | null
          nfc_tag_id?: string | null
          personal_message?: string | null
          product_id?: string | null
          status?: string | null
          total_editions?: number
          updated_at?: string | null
          vendor_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artwork_experiences_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_experiences_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_interactive_elements: {
        Row: {
          artwork_experience_id: string | null
          content: string
          created_at: string | null
          element_type: string
          id: string
          media_url: string | null
          position_data: Json
        }
        Insert: {
          artwork_experience_id?: string | null
          content: string
          created_at?: string | null
          element_type: string
          id?: string
          media_url?: string | null
          position_data: Json
        }
        Update: {
          artwork_experience_id?: string | null
          content?: string
          created_at?: string | null
          element_type?: string
          id?: string
          media_url?: string | null
          position_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "artwork_interactive_elements_artwork_experience_id_fkey"
            columns: ["artwork_experience_id"]
            isOneToOne: false
            referencedRelation: "artwork_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_media_gallery: {
        Row: {
          artwork_experience_id: string | null
          caption: string | null
          created_at: string | null
          id: string
          media_category: string
          media_type: string
          media_url: string
          sort_order: number | null
        }
        Insert: {
          artwork_experience_id?: string | null
          caption?: string | null
          created_at?: string | null
          id?: string
          media_category: string
          media_type: string
          media_url: string
          sort_order?: number | null
        }
        Update: {
          artwork_experience_id?: string | null
          caption?: string | null
          created_at?: string | null
          id?: string
          media_category?: string
          media_type?: string
          media_url?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artwork_media_gallery_artwork_experience_id_fkey"
            columns: ["artwork_experience_id"]
            isOneToOne: false
            referencedRelation: "artwork_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_series: {
        Row: {
          completed_at: string | null
          completion_progress: Json | null
          connected_series_ids: string[] | null
          created_at: string | null
          description: string | null
          display_order: number
          genre_tags: Json | null
          id: string
          is_active: boolean
          is_milestone: boolean | null
          is_private: boolean
          journey_position: Json | null
          milestone_config: Json | null
          milestone_order: number | null
          name: string
          release_date: string | null
          requires_ownership: Json | null
          teaser_image_url: string | null
          thumbnail_url: string | null
          unlock_config: Json
          unlock_message: string | null
          unlock_milestones: Json | null
          unlock_progress: Json | null
          unlock_schedule: Json | null
          unlock_type: string
          unlocks_series_ids: string[] | null
          updated_at: string | null
          vendor_id: number
          vendor_name: string
          vip_tier: number | null
        }
        Insert: {
          completed_at?: string | null
          completion_progress?: Json | null
          connected_series_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          genre_tags?: Json | null
          id?: string
          is_active?: boolean
          is_milestone?: boolean | null
          is_private?: boolean
          journey_position?: Json | null
          milestone_config?: Json | null
          milestone_order?: number | null
          name: string
          release_date?: string | null
          requires_ownership?: Json | null
          teaser_image_url?: string | null
          thumbnail_url?: string | null
          unlock_config?: Json
          unlock_message?: string | null
          unlock_milestones?: Json | null
          unlock_progress?: Json | null
          unlock_schedule?: Json | null
          unlock_type: string
          unlocks_series_ids?: string[] | null
          updated_at?: string | null
          vendor_id: number
          vendor_name: string
          vip_tier?: number | null
        }
        Update: {
          completed_at?: string | null
          completion_progress?: Json | null
          connected_series_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          genre_tags?: Json | null
          id?: string
          is_active?: boolean
          is_milestone?: boolean | null
          is_private?: boolean
          journey_position?: Json | null
          milestone_config?: Json | null
          milestone_order?: number | null
          name?: string
          release_date?: string | null
          requires_ownership?: Json | null
          teaser_image_url?: string | null
          thumbnail_url?: string | null
          unlock_config?: Json
          unlock_message?: string | null
          unlock_milestones?: Json | null
          unlock_progress?: Json | null
          unlock_schedule?: Json | null
          unlock_type?: string
          unlocks_series_ids?: string[] | null
          updated_at?: string | null
          vendor_id?: number
          vendor_name?: string
          vip_tier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artwork_series_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_series_members: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_locked: boolean
          series_id: string
          shopify_product_id: string | null
          submission_id: string | null
          unlock_at: string | null
          unlock_order: number | null
          unlocked_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_locked?: boolean
          series_id: string
          shopify_product_id?: string | null
          submission_id?: string | null
          unlock_at?: string | null
          unlock_order?: number | null
          unlocked_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_locked?: boolean
          series_id?: string
          shopify_product_id?: string | null
          submission_id?: string | null
          unlock_at?: string | null
          unlock_order?: number | null
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artwork_series_members_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "artwork_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artwork_series_members_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "vendor_product_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_settings: {
        Row: {
          created_at: string
          google_drive_enabled: boolean
          google_drive_folder_id: string | null
          id: number
          max_backups: number
          retention_days: number
          schedule_database: string
          schedule_sheets: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          google_drive_enabled?: boolean
          google_drive_folder_id?: string | null
          id?: number
          max_backups?: number
          retention_days?: number
          schedule_database?: string
          schedule_sheets?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          google_drive_enabled?: boolean
          google_drive_folder_id?: string | null
          id?: number
          max_backups?: number
          retention_days?: number
          schedule_database?: string
          schedule_sheets?: string
          updated_at?: string
        }
        Relationships: []
      }
      backups: {
        Row: {
          created_at: string
          error: string | null
          id: string
          size: string | null
          status: string
          type: string
          url: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          size?: string | null
          status: string
          type: string
          url?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          size?: string | null
          status?: string
          type?: string
          url?: string | null
        }
        Relationships: []
      }
      benefit_types: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      certificate_access_logs: {
        Row: {
          accessed_at: string | null
          id: number
          ip_address: string | null
          line_item_id: number
          order_id: number
          product_id: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          id?: number
          ip_address?: string | null
          line_item_id: number
          order_id: number
          product_id: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          id?: number
          ip_address?: string | null
          line_item_id?: number
          order_id?: number
          product_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      collector_accounts: {
        Row: {
          account_status: Database["public"]["Enums"]["collector_account_status"]
          account_type: Database["public"]["Enums"]["collector_account_type"]
          collector_identifier: string
          created_at: string | null
          id: string
          updated_at: string | null
          vendor_id: number | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["collector_account_status"]
          account_type: Database["public"]["Enums"]["collector_account_type"]
          collector_identifier: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          vendor_id?: number | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["collector_account_status"]
          account_type?: Database["public"]["Enums"]["collector_account_type"]
          collector_identifier?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          vendor_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collector_accounts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_benefit_claims: {
        Row: {
          claim_code: string | null
          claimed_at: string | null
          customer_email: string | null
          id: number
          line_item_id: string
          product_benefit_id: number | null
          status: string | null
        }
        Insert: {
          claim_code?: string | null
          claimed_at?: string | null
          customer_email?: string | null
          id?: number
          line_item_id: string
          product_benefit_id?: number | null
          status?: string | null
        }
        Update: {
          claim_code?: string | null
          claimed_at?: string | null
          customer_email?: string | null
          id?: number
          line_item_id?: string
          product_benefit_id?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collector_benefit_claims_product_benefit_id_fkey"
            columns: ["product_benefit_id"]
            isOneToOne: false
            referencedRelation: "product_benefits"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_credit_subscriptions: {
        Row: {
          billing_amount_usd: number
          cancelled_at: string | null
          collector_identifier: string
          created_at: string | null
          id: string
          last_credited_at: string | null
          monthly_credit_amount: number
          next_billing_date: string
          paused_at: string | null
          payment_method: string
          payment_subscription_id: string | null
          started_at: string | null
          subscription_status: Database["public"]["Enums"]["collector_subscription_status"]
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          billing_amount_usd: number
          cancelled_at?: string | null
          collector_identifier: string
          created_at?: string | null
          id?: string
          last_credited_at?: string | null
          monthly_credit_amount: number
          next_billing_date: string
          paused_at?: string | null
          payment_method: string
          payment_subscription_id?: string | null
          started_at?: string | null
          subscription_status?: Database["public"]["Enums"]["collector_subscription_status"]
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_amount_usd?: number
          cancelled_at?: string | null
          collector_identifier?: string
          created_at?: string | null
          id?: string
          last_credited_at?: string | null
          monthly_credit_amount?: number
          next_billing_date?: string
          paused_at?: string | null
          payment_method?: string
          payment_subscription_id?: string | null
          started_at?: string | null
          subscription_status?: Database["public"]["Enums"]["collector_subscription_status"]
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      collector_engagement_metrics: {
        Row: {
          artwork_experience_id: string | null
          collector_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string
          timestamp: string | null
        }
        Insert: {
          artwork_experience_id?: string | null
          collector_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id: string
          timestamp?: string | null
        }
        Update: {
          artwork_experience_id?: string | null
          collector_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collector_engagement_metrics_artwork_experience_id_fkey"
            columns: ["artwork_experience_id"]
            isOneToOne: false
            referencedRelation: "artwork_experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_ledger_entries: {
        Row: {
          amount: number
          collector_identifier: string
          created_at: string | null
          created_by: string | null
          currency: string
          description: string | null
          id: number
          line_item_id: string | null
          metadata: Json | null
          order_id: string | null
          payout_id: number | null
          perk_redemption_id: string | null
          purchase_id: string | null
          subscription_id: string | null
          tax_year: number | null
          transaction_type: Database["public"]["Enums"]["collector_transaction_type"]
        }
        Insert: {
          amount: number
          collector_identifier: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: number
          line_item_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          payout_id?: number | null
          perk_redemption_id?: string | null
          purchase_id?: string | null
          subscription_id?: string | null
          tax_year?: number | null
          transaction_type: Database["public"]["Enums"]["collector_transaction_type"]
        }
        Update: {
          amount?: number
          collector_identifier?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: number
          line_item_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          payout_id?: number | null
          perk_redemption_id?: string | null
          purchase_id?: string | null
          subscription_id?: string | null
          tax_year?: number | null
          transaction_type?: Database["public"]["Enums"]["collector_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "collector_ledger_entries_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "vendor_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_ledger_entries_perk_redemption_id_fkey"
            columns: ["perk_redemption_id"]
            isOneToOne: false
            referencedRelation: "collector_perk_redemptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_ledger_entries_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "vendor_store_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_ledger_entries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "collector_credit_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_perk_redemptions: {
        Row: {
          artwork_submission_id: string | null
          collector_identifier: string
          created_at: string | null
          id: string
          ledger_entry_id: number | null
          perk_type: Database["public"]["Enums"]["collector_perk_type"]
          product_sku: string | null
          redemption_status: Database["public"]["Enums"]["collector_redemption_status"]
          total_credits_earned_at_unlock: number | null
          unlocked_at: string | null
          updated_at: string | null
        }
        Insert: {
          artwork_submission_id?: string | null
          collector_identifier: string
          created_at?: string | null
          id?: string
          ledger_entry_id?: number | null
          perk_type: Database["public"]["Enums"]["collector_perk_type"]
          product_sku?: string | null
          redemption_status?: Database["public"]["Enums"]["collector_redemption_status"]
          total_credits_earned_at_unlock?: number | null
          unlocked_at?: string | null
          updated_at?: string | null
        }
        Update: {
          artwork_submission_id?: string | null
          collector_identifier?: string
          created_at?: string | null
          id?: string
          ledger_entry_id?: number | null
          perk_type?: Database["public"]["Enums"]["collector_perk_type"]
          product_sku?: string | null
          redemption_status?: Database["public"]["Enums"]["collector_redemption_status"]
          total_credits_earned_at_unlock?: number | null
          unlocked_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collector_perk_redemptions_artwork_submission_id_fkey"
            columns: ["artwork_submission_id"]
            isOneToOne: false
            referencedRelation: "vendor_product_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_perk_redemptions_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "collector_ledger_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          assigned_to_user_id: string | null
          attachments: Json | null
          company_id: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          customer_id: string | null
          description: string | null
          due_date: string | null
          id: string
          is_archived: boolean | null
          is_completed: boolean | null
          metadata: Json | null
          order_id: string | null
          platform: string | null
          platform_account_id: string | null
          priority: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          assigned_to_user_id?: string | null
          attachments?: Json | null
          company_id?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_archived?: boolean | null
          is_completed?: boolean | null
          metadata?: Json | null
          order_id?: string | null
          platform?: string | null
          platform_account_id?: string | null
          priority?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["crm_activity_type"]
          assigned_to_user_id?: string | null
          attachments?: Json | null
          company_id?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_archived?: boolean | null
          is_completed?: boolean | null
          metadata?: Json | null
          order_id?: string | null
          platform?: string | null
          platform_account_id?: string | null
          priority?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_enrichment: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          customer_id: string | null
          enrichment_data: Json
          enrichment_type: string
          id: string
          source: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          enrichment_data: Json
          enrichment_type: string
          id?: string
          source?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          enrichment_data?: Json
          enrichment_type?: string
          id?: string
          source?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_ai_enrichment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          expires_at: string | null
          id: string
          insight_data: Json
          insight_type: string
          is_active: boolean | null
          model_version: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          expires_at?: string | null
          id?: string
          insight_data: Json
          insight_type: string
          is_active?: boolean | null
          model_version?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          id?: string
          insight_data?: Json
          insight_type?: string
          is_active?: boolean | null
          model_version?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_calls: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          customer_id: string | null
          deal_id: string | null
          duration_seconds: number | null
          id: string
          metadata: Json | null
          notes: string | null
          occurred_at: string | null
          outcome: Database["public"]["Enums"]["crm_call_outcome"] | null
          recording_url: string | null
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          customer_id?: string | null
          deal_id?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          occurred_at?: string | null
          outcome?: Database["public"]["Enums"]["crm_call_outcome"] | null
          recording_url?: string | null
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          customer_id?: string | null
          deal_id?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          occurred_at?: string | null
          outcome?: Database["public"]["Enums"]["crm_call_outcome"] | null
          recording_url?: string | null
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_calls_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_calls_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "crm_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_comments: {
        Row: {
          content: string
          created_at: string | null
          created_by_user_id: string | null
          deleted_at: string | null
          id: string
          is_resolved: boolean | null
          parent_comment_id: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by_user_id?: string | null
          deleted_at?: string | null
          id?: string
          is_resolved?: boolean | null
          parent_comment_id?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by_user_id?: string | null
          deleted_at?: string | null
          id?: string
          is_resolved?: boolean | null
          parent_comment_id?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "crm_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "crm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          address: Json | null
          company_size: string | null
          created_at: string | null
          description: string | null
          domain: string | null
          email: string | null
          first_order_date: string | null
          id: string
          industry: string | null
          is_archived: boolean | null
          last_order_date: string | null
          logo_url: string | null
          metadata: Json | null
          name: string
          phone: string | null
          tags: string[] | null
          total_orders: number | null
          total_people: number | null
          total_spent: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          company_size?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          email?: string | null
          first_order_date?: string | null
          id?: string
          industry?: string | null
          is_archived?: boolean | null
          last_order_date?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name: string
          phone?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_people?: number | null
          total_spent?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          company_size?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          email?: string | null
          first_order_date?: string | null
          id?: string
          industry?: string | null
          is_archived?: boolean | null
          last_order_date?: string | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          phone?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_people?: number | null
          total_spent?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      crm_contact_identifiers: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          identifier_type: string
          identifier_value: string
          is_primary: boolean | null
          metadata: Json | null
          platform: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          identifier_type: string
          identifier_value: string
          is_primary?: boolean | null
          metadata?: Json | null
          platform?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          identifier_type?: string
          identifier_value?: string
          is_primary?: boolean | null
          metadata?: Json | null
          platform?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_identifiers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contact_merge_history: {
        Row: {
          created_at: string | null
          id: string
          merge_reason: string | null
          merged_by_user_id: string | null
          merged_data: Json | null
          merged_from_customer_id: string
          merged_into_customer_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          merge_reason?: string | null
          merged_by_user_id?: string | null
          merged_data?: Json | null
          merged_from_customer_id: string
          merged_into_customer_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          merge_reason?: string | null
          merged_by_user_id?: string | null
          merged_data?: Json | null
          merged_from_customer_id?: string
          merged_into_customer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_merge_history_merged_into_customer_id_fkey"
            columns: ["merged_into_customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_conversation_assignments: {
        Row: {
          assignee_user_id: string | null
          conversation_id: string
          created_at: string | null
          id: string
          last_status_at: string | null
          metadata: Json | null
          status: Database["public"]["Enums"]["crm_conversation_status"]
          updated_at: string | null
        }
        Insert: {
          assignee_user_id?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          last_status_at?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["crm_conversation_status"]
          updated_at?: string | null
        }
        Update: {
          assignee_user_id?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          last_status_at?: string | null
          metadata?: Json | null
          status?: Database["public"]["Enums"]["crm_conversation_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_conversation_assignments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          tag_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          tag_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_conversation_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_conversations: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          is_starred: boolean | null
          last_message_at: string | null
          platform: Database["public"]["Enums"]["crm_platform"]
          platform_account_id: string | null
          status: Database["public"]["Enums"]["crm_conversation_status"]
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          is_starred?: boolean | null
          last_message_at?: string | null
          platform: Database["public"]["Enums"]["crm_platform"]
          platform_account_id?: string | null
          status?: Database["public"]["Enums"]["crm_conversation_status"]
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          is_starred?: boolean | null
          last_message_at?: string | null
          platform?: Database["public"]["Enums"]["crm_platform"]
          platform_account_id?: string | null
          status?: Database["public"]["Enums"]["crm_conversation_status"]
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_custom_field_values: {
        Row: {
          active_from: string | null
          active_until: string | null
          created_at: string | null
          created_by_actor_id: string | null
          entity_id: string
          entity_type: string
          field_id: string
          field_value: string | null
          field_value_json: Json | null
          id: string
          updated_at: string | null
        }
        Insert: {
          active_from?: string | null
          active_until?: string | null
          created_at?: string | null
          created_by_actor_id?: string | null
          entity_id: string
          entity_type: string
          field_id: string
          field_value?: string | null
          field_value_json?: Json | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          active_from?: string | null
          active_until?: string | null
          created_at?: string | null
          created_by_actor_id?: string | null
          entity_id?: string
          entity_type?: string
          field_id?: string
          field_value?: string | null
          field_value_json?: Json | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "crm_custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_custom_fields: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          default_value: string | null
          default_value_jsonb: Json | null
          display_name: string
          display_order: number | null
          enrichment_source: string | null
          entity_type: string
          field_name: string
          field_type: string
          id: string
          is_active: boolean | null
          is_default_value_enabled: boolean | null
          is_enriched: boolean | null
          is_required: boolean | null
          is_unique: boolean | null
          options: Json | null
          relationship_id: string | null
          status_workflow: Json | null
          updated_at: string | null
          validation_rules: Json | null
          visibility_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          default_value?: string | null
          default_value_jsonb?: Json | null
          display_name: string
          display_order?: number | null
          enrichment_source?: string | null
          entity_type: string
          field_name: string
          field_type: string
          id?: string
          is_active?: boolean | null
          is_default_value_enabled?: boolean | null
          is_enriched?: boolean | null
          is_required?: boolean | null
          is_unique?: boolean | null
          options?: Json | null
          relationship_id?: string | null
          status_workflow?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
          visibility_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          default_value?: string | null
          default_value_jsonb?: Json | null
          display_name?: string
          display_order?: number | null
          enrichment_source?: string | null
          entity_type?: string
          field_name?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_default_value_enabled?: boolean | null
          is_enriched?: boolean | null
          is_required?: boolean | null
          is_unique?: boolean | null
          options?: Json | null
          relationship_id?: string | null
          status_workflow?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
          visibility_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_custom_fields_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "crm_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_customer_orders: {
        Row: {
          created_at: string | null
          currency_code: string | null
          customer_id: string
          id: string
          metadata: Json | null
          order_date: string | null
          order_id: string
          order_number: string | null
          order_source: string
          products: Json | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          currency_code?: string | null
          customer_id: string
          id?: string
          metadata?: Json | null
          order_date?: string | null
          order_id: string
          order_number?: string | null
          order_source: string
          products?: Json | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string | null
          customer_id?: string
          id?: string
          metadata?: Json | null
          order_date?: string | null
          order_id?: string
          order_number?: string | null
          order_source?: string
          products?: Json | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_customer_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_customers: {
        Row: {
          address: Json | null
          chinadivision_order_ids: string[] | null
          company_id: string | null
          created_at: string | null
          email: string | null
          enrichment_data: Json | null
          facebook_id: string | null
          facebook_username: string | null
          first_name: string | null
          first_order_date: string | null
          id: string
          instagram_id: string | null
          instagram_username: string | null
          is_archived: boolean | null
          last_name: string | null
          last_order_date: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          shopify_customer_id: number | null
          shopify_order_ids: string[] | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          whatsapp_id: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          address?: Json | null
          chinadivision_order_ids?: string[] | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          enrichment_data?: Json | null
          facebook_id?: string | null
          facebook_username?: string | null
          first_name?: string | null
          first_order_date?: string | null
          id?: string
          instagram_id?: string | null
          instagram_username?: string | null
          is_archived?: boolean | null
          last_name?: string | null
          last_order_date?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          shopify_customer_id?: number | null
          shopify_order_ids?: string[] | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          whatsapp_id?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          address?: Json | null
          chinadivision_order_ids?: string[] | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          enrichment_data?: Json | null
          facebook_id?: string | null
          facebook_username?: string | null
          first_name?: string | null
          first_order_date?: string | null
          id?: string
          instagram_id?: string | null
          instagram_username?: string | null
          is_archived?: boolean | null
          last_name?: string | null
          last_order_date?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          shopify_customer_id?: number | null
          shopify_order_ids?: string[] | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          whatsapp_id?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_activities: {
        Row: {
          activity_id: string
          created_at: string | null
          deal_id: string
          id: string
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          deal_id: string
          id?: string
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          deal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "crm_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_pipelines: {
        Row: {
          created_at: string | null
          currency_code: string | null
          id: string
          is_default: boolean | null
          metadata: Json | null
          name: string
          owner_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency_code?: string | null
          id?: string
          is_default?: boolean | null
          metadata?: Json | null
          name: string
          owner_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string | null
          id?: string
          is_default?: boolean | null
          metadata?: Json | null
          name?: string
          owner_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_deal_stages: {
        Row: {
          created_at: string | null
          id: string
          name: string
          pipeline_id: string
          position: number
          updated_at: string | null
          win_probability: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          pipeline_id: string
          position: number
          updated_at?: string | null
          win_probability?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          pipeline_id?: string
          position?: number
          updated_at?: string | null
          win_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          amount_cents: number | null
          amount_currency_code: string | null
          company_id: string | null
          created_at: string | null
          customer_id: string | null
          expected_close_date: string | null
          id: string
          metadata: Json | null
          name: string
          owner_user_id: string | null
          pipeline_id: string
          stage_id: string
          status: Database["public"]["Enums"]["crm_deal_status"]
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          amount_cents?: number | null
          amount_currency_code?: string | null
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          metadata?: Json | null
          name: string
          owner_user_id?: string | null
          pipeline_id: string
          stage_id: string
          status?: Database["public"]["Enums"]["crm_deal_status"]
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number | null
          amount_currency_code?: string | null
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          expected_close_date?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          owner_user_id?: string | null
          pipeline_id?: string
          stage_id?: string
          status?: Database["public"]["Enums"]["crm_deal_status"]
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_deal_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_accounts: {
        Row: {
          access_token: string | null
          account_name: string
          created_at: string | null
          email_address: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          provider: string
          provider_account_id: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          account_name: string
          created_at?: string | null
          email_address: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          provider: string
          provider_account_id?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          account_name?: string
          created_at?: string | null
          email_address?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          provider?: string
          provider_account_id?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crm_facebook_accounts: {
        Row: {
          access_token: string
          account_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          page_id: string
          page_name: string
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          account_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          page_id: string
          page_name: string
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          account_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          page_id?: string
          page_name?: string
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crm_instagram_accounts: {
        Row: {
          access_token: string
          account_name: string
          created_at: string | null
          id: string
          instagram_account_id: string
          instagram_username: string | null
          is_active: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          account_name: string
          created_at?: string | null
          id?: string
          instagram_account_id: string
          instagram_username?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          account_name?: string
          created_at?: string | null
          id?: string
          instagram_account_id?: string
          instagram_username?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crm_list_attributes: {
        Row: {
          created_at: string | null
          default_value: string | null
          display_name: string
          display_order: number | null
          field_name: string
          field_type: string
          id: string
          is_required: boolean | null
          list_id: string
          options: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          display_name: string
          display_order?: number | null
          field_name: string
          field_type: string
          id?: string
          is_required?: boolean | null
          list_id: string
          options?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          display_name?: string
          display_order?: number | null
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          list_id?: string
          options?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_list_attributes_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "crm_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_list_entries: {
        Row: {
          created_at: string | null
          id: string
          is_archived: boolean | null
          list_id: string
          position: number | null
          record_id: string
          record_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          list_id: string
          position?: number | null
          record_id: string
          record_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          list_id?: string
          position?: number | null
          record_id?: string
          record_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_list_entries_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "crm_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_list_entry_attribute_values: {
        Row: {
          active_from: string | null
          active_until: string | null
          attribute_id: string
          created_at: string | null
          entry_id: string
          id: string
          updated_at: string | null
          value: string | null
          value_json: Json | null
        }
        Insert: {
          active_from?: string | null
          active_until?: string | null
          attribute_id: string
          created_at?: string | null
          entry_id: string
          id?: string
          updated_at?: string | null
          value?: string | null
          value_json?: Json | null
        }
        Update: {
          active_from?: string | null
          active_until?: string | null
          attribute_id?: string
          created_at?: string | null
          entry_id?: string
          id?: string
          updated_at?: string | null
          value?: string | null
          value_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_list_entry_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "crm_list_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_list_entry_attribute_values_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "crm_list_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lists: {
        Row: {
          color: string | null
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          object_type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          object_type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          object_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "crm_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          direction: Database["public"]["Enums"]["crm_message_direction"]
          external_id: string | null
          id: string
          metadata: Json | null
          parent_message_id: string | null
          thread_depth: number | null
          thread_id: string | null
          thread_order: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          direction: Database["public"]["Enums"]["crm_message_direction"]
          external_id?: string | null
          id?: string
          metadata?: Json | null
          parent_message_id?: string | null
          thread_depth?: number | null
          thread_id?: string | null
          thread_order?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          direction?: Database["public"]["Enums"]["crm_message_direction"]
          external_id?: string | null
          id?: string
          metadata?: Json | null
          parent_message_id?: string | null
          thread_depth?: number | null
          thread_id?: string | null
          thread_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "crm_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_permission_scopes: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          resource_type: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          resource_type: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          resource_type?: string
        }
        Relationships: []
      }
      crm_record_actions: {
        Row: {
          action_type: string
          config: Json | null
          created_at: string | null
          display_order: number | null
          entity_type: string
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          name: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          config?: Json | null
          created_at?: string | null
          display_order?: number | null
          entity_type: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          name: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          config?: Json | null
          created_at?: string | null
          display_order?: number | null
          entity_type?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_record_widgets: {
        Row: {
          config: Json | null
          created_at: string | null
          display_order: number | null
          entity_type: string
          id: string
          is_active: boolean | null
          name: string
          title: string
          updated_at: string | null
          widget_type: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          display_order?: number | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          name: string
          title: string
          updated_at?: string | null
          widget_type: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          display_order?: number | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          title?: string
          updated_at?: string | null
          widget_type?: string
        }
        Relationships: []
      }
      crm_relationships: {
        Row: {
          created_at: string | null
          id: string
          name: string
          object_a_attribute_id: string | null
          object_a_type: string
          object_b_attribute_id: string | null
          object_b_type: string
          relationship_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          object_a_attribute_id?: string | null
          object_a_type: string
          object_b_attribute_id?: string | null
          object_b_type: string
          relationship_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          object_a_attribute_id?: string | null
          object_a_type?: string
          object_b_attribute_id?: string | null
          object_b_type?: string
          relationship_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_role_permissions: {
        Row: {
          created_at: string | null
          permissions: Json
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          permissions: Json
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          permissions?: Json
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_saved_views: {
        Row: {
          column_config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_type: string
          filter_config: Json
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          name: string
          sort_config: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          column_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_type: string
          filter_config?: Json
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name: string
          sort_config?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          column_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_type?: string
          filter_config?: Json
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name?: string
          sort_config?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      crm_sequence_enrollments: {
        Row: {
          company_id: string | null
          created_at: string | null
          current_step_order: number | null
          customer_id: string | null
          enrolled_by_user_id: string | null
          id: string
          last_error: string | null
          metadata: Json | null
          next_scheduled_at: string | null
          sequence_id: string
          status: Database["public"]["Enums"]["crm_sequence_status"]
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          current_step_order?: number | null
          customer_id?: string | null
          enrolled_by_user_id?: string | null
          id?: string
          last_error?: string | null
          metadata?: Json | null
          next_scheduled_at?: string | null
          sequence_id: string
          status?: Database["public"]["Enums"]["crm_sequence_status"]
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          current_step_order?: number | null
          customer_id?: string | null
          enrolled_by_user_id?: string | null
          id?: string
          last_error?: string | null
          metadata?: Json | null
          next_scheduled_at?: string | null
          sequence_id?: string
          status?: Database["public"]["Enums"]["crm_sequence_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_sequence_enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sequence_enrollments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "crm_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sequence_outbox: {
        Row: {
          created_at: string | null
          enrollment_id: string
          id: string
          last_error: string | null
          payload: Json | null
          retry_count: number | null
          scheduled_at: string
          send_channel: string | null
          status: Database["public"]["Enums"]["crm_sequence_send_status"]
          step_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enrollment_id: string
          id?: string
          last_error?: string | null
          payload?: Json | null
          retry_count?: number | null
          scheduled_at: string
          send_channel?: string | null
          status?: Database["public"]["Enums"]["crm_sequence_send_status"]
          step_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string
          id?: string
          last_error?: string | null
          payload?: Json | null
          retry_count?: number | null
          scheduled_at?: string
          send_channel?: string | null
          status?: Database["public"]["Enums"]["crm_sequence_send_status"]
          step_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_sequence_outbox_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "crm_sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sequence_outbox_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "crm_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sequence_sends: {
        Row: {
          bounced_at: string | null
          created_at: string | null
          enrollment_id: string
          error: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          provider: string | null
          provider_message_id: string | null
          replied_at: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["crm_sequence_send_status"]
          step_id: string
          updated_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          created_at?: string | null
          enrollment_id: string
          error?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          replied_at?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["crm_sequence_send_status"]
          step_id: string
          updated_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          created_at?: string | null
          enrollment_id?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          replied_at?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["crm_sequence_send_status"]
          step_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_sequence_sends_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "crm_sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_sequence_sends_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "crm_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sequence_steps: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          sender_account_id: string | null
          sequence_id: string
          step_order: number
          step_type: Database["public"]["Enums"]["crm_sequence_step_type"]
          template_body: string | null
          template_body_html: string | null
          template_subject: string | null
          updated_at: string | null
          wait_hours: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          sender_account_id?: string | null
          sequence_id: string
          step_order: number
          step_type: Database["public"]["Enums"]["crm_sequence_step_type"]
          template_body?: string | null
          template_body_html?: string | null
          template_subject?: string | null
          updated_at?: string | null
          wait_hours?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          sender_account_id?: string | null
          sequence_id?: string
          step_order?: number
          step_type?: Database["public"]["Enums"]["crm_sequence_step_type"]
          template_body?: string | null
          template_body_html?: string | null
          template_subject?: string | null
          updated_at?: string | null
          wait_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "crm_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sequences: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_user_id: string | null
          send_window: Json | null
          settings: Json | null
          status: Database["public"]["Enums"]["crm_sequence_status"]
          unsubscribe_token: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
          send_window?: Json | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["crm_sequence_status"]
          unsubscribe_token?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
          send_window?: Json | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["crm_sequence_status"]
          unsubscribe_token?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_slas: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          due_at: string | null
          id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["crm_conversation_status"] | null
          updated_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["crm_conversation_status"] | null
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["crm_conversation_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_slas_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          assignee_user_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by_user_id: string | null
          customer_id: string | null
          deal_id: string | null
          description: string | null
          due_at: string | null
          id: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["crm_task_priority"]
          related_conversation_id: string | null
          status: Database["public"]["Enums"]["crm_task_status"]
          task_type: Database["public"]["Enums"]["crm_activity_type"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_user_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          customer_id?: string | null
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["crm_task_priority"]
          related_conversation_id?: string | null
          status?: Database["public"]["Enums"]["crm_task_status"]
          task_type?: Database["public"]["Enums"]["crm_activity_type"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_user_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          customer_id?: string | null
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["crm_task_priority"]
          related_conversation_id?: string | null
          status?: Database["public"]["Enums"]["crm_task_status"]
          task_type?: Database["public"]["Enums"]["crm_activity_type"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_related_conversation_id_fkey"
            columns: ["related_conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_threads: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          id: string
          parent_id: string
          parent_type: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          parent_id: string
          parent_type: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          parent_id?: string
          parent_type?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_webhook_subscriptions: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by_user_id: string | null
          events: string[]
          filter: Json | null
          id: string
          secret: string
          updated_at: string | null
          url: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by_user_id?: string | null
          events: string[]
          filter?: Json | null
          id?: string
          secret: string
          updated_at?: string | null
          url: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by_user_id?: string | null
          events?: string[]
          filter?: Json | null
          id?: string
          secret?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      crm_whatsapp_accounts: {
        Row: {
          account_name: string
          api_credentials: Json | null
          business_account_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          phone_number: string
          sync_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
          webhook_url: string | null
          webhook_verified: boolean | null
        }
        Insert: {
          account_name: string
          api_credentials?: Json | null
          business_account_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          phone_number: string
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string | null
          webhook_verified?: boolean | null
        }
        Update: {
          account_name?: string
          api_credentials?: Json | null
          business_account_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          phone_number?: string
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string | null
          webhook_verified?: boolean | null
        }
        Relationships: []
      }
      crm_workspace_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by_user_id: string | null
          is_active: boolean | null
          joined_at: string | null
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by_user_id?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by_user_id?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          access_token: string | null
          access_token_expires_at: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          orders_count: number | null
          shopify_access_token: string | null
          shopify_customer_id: string | null
          shopify_shop_domain: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          access_token_expires_at?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          orders_count?: number | null
          shopify_access_token?: string | null
          shopify_customer_id?: string | null
          shopify_shop_domain?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          access_token_expires_at?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          orders_count?: number | null
          shopify_access_token?: string | null
          shopify_customer_id?: string | null
          shopify_shop_domain?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      edition_product_edition_stage_state: {
        Row: {
          edition_sold: number
          shopify_product_id: string
          stage_key: string
          total_editions: number
          updated_at: string
        }
        Insert: {
          edition_sold?: number
          shopify_product_id: string
          stage_key: string
          total_editions?: number
          updated_at?: string
        }
        Update: {
          edition_sold?: number
          shopify_product_id?: string
          stage_key?: string
          total_editions?: number
          updated_at?: string
        }
        Relationships: []
      }
      edition_watchlist: {
        Row: {
          artist_name: string | null
          created_at: string
          id: string
          product_handle: string | null
          product_title: string | null
          shopify_product_id: string
          stage_at_save: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artist_name?: string | null
          created_at?: string
          id?: string
          product_handle?: string | null
          product_title?: string | null
          shopify_product_id: string
          stage_at_save: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artist_name?: string | null
          created_at?: string
          id?: string
          product_handle?: string | null
          product_title?: string | null
          shopify_product_id?: string
          stage_at_save?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      edition_watchlist_conversion_events: {
        Row: {
          created_at: string
          id: string
          order_id: string
          watchlist_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          watchlist_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'edition_watchlist_conversion_events_watchlist_id_fkey'
            columns: ['watchlist_id']
            isOneToOne: false
            referencedRelation: 'edition_watchlist'
            referencedColumns: ['id']
          },
        ]
      }
      edition_watchlist_stage_notifications: {
        Row: {
          id: string
          sent_at: string
          stage_key: string
          watchlist_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          stage_key: string
          watchlist_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          stage_key?: string
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'edition_watchlist_stage_notifications_watchlist_id_fkey'
            columns: ['watchlist_id']
            isOneToOne: false
            referencedRelation: 'edition_watchlist'
            referencedColumns: ['id']
          },
        ]
      }
      email_log: {
        Row: {
          delivered_at: string | null
          email_type: string
          error_message: string | null
          id: number
          message_id: string | null
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          delivered_at?: string | null
          email_type: string
          error_message?: string | null
          id?: number
          message_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status: string
          subject: string
        }
        Update: {
          delivered_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: number
          message_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      error_tracking: {
        Row: {
          context: Json | null
          created_at: string | null
          error_type: string
          id: string
          message: string
          severity: string
          stack_trace: string | null
          timestamp: number
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_type: string
          id?: string
          message: string
          severity: string
          stack_trace?: string | null
          timestamp: number
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_type?: string
          id?: string
          message?: string
          severity?: string
          stack_trace?: string | null
          timestamp?: number
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          method: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          method: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          reason?: string | null
        }
        Relationships: []
      }
      impersonation_logs: {
        Row: {
          admin_email: string
          created_at: string
          id: string
          vendor_id: number | null
          vendor_name: string | null
        }
        Insert: {
          admin_email: string
          created_at?: string
          id?: string
          vendor_id?: number | null
          vendor_name?: string | null
        }
        Update: {
          admin_email?: string
          created_at?: string
          id?: string
          vendor_id?: number | null
          vendor_name?: string | null
        }
        Relationships: []
      }
      instagram_media_cache: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          instagram_media_id: string
          media_type: string
          media_url: string
          permalink: string
          thumbnail_url: string | null
          timestamp: string
          updated_at: string
          username: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          instagram_media_id: string
          media_type: string
          media_url: string
          permalink: string
          thumbnail_url?: string | null
          timestamp: string
          updated_at?: string
          username: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          instagram_media_id?: string
          media_type?: string
          media_url?: string
          permalink?: string
          thumbnail_url?: string | null
          timestamp?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      instagram_profile_cache: {
        Row: {
          biography: string | null
          created_at: string
          followers_count: number | null
          id: string
          media_count: number | null
          name: string | null
          profile_picture_url: string | null
          updated_at: string
          username: string
          website: string | null
        }
        Insert: {
          biography?: string | null
          created_at?: string
          followers_count?: number | null
          id?: string
          media_count?: number | null
          name?: string | null
          profile_picture_url?: string | null
          updated_at?: string
          username: string
          website?: string | null
        }
        Update: {
          biography?: string | null
          created_at?: string
          followers_count?: number | null
          id?: string
          media_count?: number | null
          name?: string | null
          profile_picture_url?: string | null
          updated_at?: string
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      instagram_stories_cache: {
        Row: {
          created_at: string
          id: string
          instagram_media_id: string
          media_type: string
          media_url: string
          permalink: string
          timestamp: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          instagram_media_id: string
          media_type: string
          media_url: string
          permalink: string
          timestamp: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          instagram_media_id?: string
          media_type?: string
          media_url?: string
          permalink?: string
          timestamp?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      instagram_story_views: {
        Row: {
          collector_id: string
          id: string
          instagram_media_id: string
          viewed_at: string
        }
        Insert: {
          collector_id: string
          id?: string
          instagram_media_id: string
          viewed_at?: string
        }
        Update: {
          collector_id?: string
          id?: string
          instagram_media_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      instagram_vendors: {
        Row: {
          created_at: string | null
          instagram_username: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          instagram_username?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          instagram_username?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      journey_map_settings: {
        Row: {
          background_image_url: string | null
          created_at: string | null
          default_series_position: Json | null
          id: string
          map_style: string | null
          theme_colors: Json | null
          updated_at: string | null
          vendor_id: number
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string | null
          default_series_position?: Json | null
          id?: string
          map_style?: string | null
          theme_colors?: Json | null
          updated_at?: string | null
          vendor_id: number
        }
        Update: {
          background_image_url?: string | null
          created_at?: string | null
          default_series_position?: Json | null
          id?: string
          map_style?: string | null
          theme_colors?: Json | null
          updated_at?: string | null
          vendor_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "journey_map_settings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          currency_code: string
          id: string
          image_alt: string | null
          image_url: string | null
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          shopify_id: string | null
          sku: string | null
          title: string
          variant_id: string | null
        }
        Insert: {
          currency_code: string
          id: string
          image_alt?: string | null
          image_url?: string | null
          order_id: string
          price: number
          product_id?: string | null
          quantity: number
          shopify_id?: string | null
          sku?: string | null
          title: string
          variant_id?: string | null
        }
        Update: {
          currency_code?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          shopify_id?: string | null
          sku?: string | null
          title?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      nfc_tag_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: number
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: number
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: number
        }
        Relationships: []
      }
      nfc_tags: {
        Row: {
          certificate_url: string | null
          claimed_at: string | null
          created_at: string | null
          customer_id: string | null
          id: number
          line_item_id: string | null
          notes: string | null
          order_id: string | null
          programmed_at: string | null
          status: string
          tag_id: string
          updated_at: string | null
        }
        Insert: {
          certificate_url?: string | null
          claimed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: number
          line_item_id?: string | null
          notes?: string | null
          order_id?: string | null
          programmed_at?: string | null
          status?: string
          tag_id: string
          updated_at?: string | null
        }
        Update: {
          certificate_url?: string | null
          claimed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: number
          line_item_id?: string | null
          notes?: string | null
          order_id?: string | null
          programmed_at?: string | null
          status?: string
          tag_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      onboarding_analytics: {
        Row: {
          completed: boolean | null
          created_at: string | null
          entered_at: string | null
          exited_at: string | null
          id: string
          step_name: string
          step_number: number
          time_spent_seconds: number | null
          vendor_name: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          entered_at?: string | null
          exited_at?: string | null
          id?: string
          step_name: string
          step_number: number
          time_spent_seconds?: number | null
          vendor_name: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          entered_at?: string | null
          exited_at?: string | null
          id?: string
          step_name?: string
          step_number?: number
          time_spent_seconds?: number | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_analytics_vendor_name_fkey"
            columns: ["vendor_name"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_name"]
          },
        ]
      }
      order_line_items_v2: {
        Row: {
          certificate_generated_at: string | null
          certificate_token: string | null
          certificate_url: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          edition_number: number | null
          edition_total: number | null
          fulfillment_status: string | null
          id: number
          img_url: string | null
          line_item_id: string
          name: string
          nfc_claimed_at: string | null
          nfc_tag_id: string | null
          order_id: string
          order_name: string | null
          price: number
          product_id: number | null
          quantity: number
          refund_status: string | null
          refunded_amount: number | null
          refunded_at: string | null
          removed_reason: string | null
          restocked: boolean
          sku: string | null
          status: string | null
          updated_at: string | null
          variant_id: string | null
          vendor_name: string | null
        }
        Insert: {
          certificate_generated_at?: string | null
          certificate_token?: string | null
          certificate_url?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          edition_number?: number | null
          edition_total?: number | null
          fulfillment_status?: string | null
          id?: number
          img_url?: string | null
          line_item_id: string
          name: string
          nfc_claimed_at?: string | null
          nfc_tag_id?: string | null
          order_id: string
          order_name?: string | null
          price: number
          product_id?: number | null
          quantity?: number
          refund_status?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          removed_reason?: string | null
          restocked?: boolean
          sku?: string | null
          status?: string | null
          updated_at?: string | null
          variant_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          certificate_generated_at?: string | null
          certificate_token?: string | null
          certificate_url?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          edition_number?: number | null
          edition_total?: number | null
          fulfillment_status?: string | null
          id?: number
          img_url?: string | null
          line_item_id?: string
          name?: string
          nfc_claimed_at?: string | null
          nfc_tag_id?: string | null
          order_id?: string
          order_name?: string | null
          price?: number
          product_id?: number | null
          quantity?: number
          refund_status?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          removed_reason?: string | null
          restocked?: boolean
          sku?: string | null
          status?: string | null
          updated_at?: string | null
          variant_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_line_items_v2_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency_code: string
          customer_email: string | null
          customer_id: string | null
          customer_reference: string | null
          financial_status: string | null
          fulfillment_status: string | null
          id: string
          order_number: number
          processed_at: string
          raw_shopify_order_data: Json | null
          shopify_id: string | null
          subtotal_price: number | null
          total_price: number
          total_tax: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency_code: string
          customer_email?: string | null
          customer_id?: string | null
          customer_reference?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          id: string
          order_number: number
          processed_at: string
          raw_shopify_order_data?: Json | null
          shopify_id?: string | null
          subtotal_price?: number | null
          total_price: number
          total_tax?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_reference?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          order_number?: number
          processed_at?: string
          raw_shopify_order_data?: Json | null
          shopify_id?: string | null
          subtotal_price?: number | null
          total_price?: number
          total_tax?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      otp_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      payout_dispute_comments: {
        Row: {
          author: string
          created_at: string | null
          dispute_id: string
          id: string
          is_internal: boolean | null
          text: string
        }
        Insert: {
          author: string
          created_at?: string | null
          dispute_id: string
          id?: string
          is_internal?: boolean | null
          text: string
        }
        Update: {
          author?: string
          created_at?: string | null
          dispute_id?: string
          id?: string
          is_internal?: boolean | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_dispute_comments_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "payout_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_disputes: {
        Row: {
          amount: number
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          id: string
          payout_id: string
          priority: string
          reason: string
          status: string
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          amount: number
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          payout_id: string
          priority?: string
          reason: string
          status?: string
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          amount?: number
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          payout_id?: string
          priority?: string
          reason?: string
          status?: string
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_disputes_vendor_name_fkey"
            columns: ["vendor_name"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_name"]
          },
        ]
      }
      payout_schedules: {
        Row: {
          auto_process: boolean | null
          created_at: string | null
          day_of_month: number | null
          day_of_week: number | null
          enabled: boolean | null
          frequency: string | null
          id: number
          last_run: string | null
          minimum_amount: number | null
          name: string | null
          next_run: string | null
          schedule_type: string
          threshold: number | null
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          auto_process?: boolean | null
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          enabled?: boolean | null
          frequency?: string | null
          id?: number
          last_run?: string | null
          minimum_amount?: number | null
          name?: string | null
          next_run?: string | null
          schedule_type: string
          threshold?: number | null
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          auto_process?: boolean | null
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          enabled?: boolean | null
          frequency?: string | null
          id?: number
          last_run?: string | null
          minimum_amount?: number | null
          name?: string | null
          next_run?: string | null
          schedule_type?: string
          threshold?: number | null
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_schedules_vendor_name_fkey"
            columns: ["vendor_name"]
            isOneToOne: true
            referencedRelation: "vendors"
            referencedColumns: ["vendor_name"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          duration: number
          error_message: string | null
          id: string
          operation: string
          status: string
          timestamp: number
        }
        Insert: {
          created_at?: string | null
          duration: number
          error_message?: string | null
          id?: string
          operation: string
          status: string
          timestamp: number
        }
        Update: {
          created_at?: string | null
          duration?: number
          error_message?: string | null
          id?: string
          operation?: string
          status?: string
          timestamp?: number
        }
        Relationships: []
      }
      product_analytics: {
        Row: {
          average_time_on_page: number
          bounce_rate: number
          conversion_rate: number
          created_at: string
          id: string
          last_updated: string
          page_views: number
          product_id: string
          unique_visitors: number
          updated_at: string
        }
        Insert: {
          average_time_on_page?: number
          bounce_rate?: number
          conversion_rate?: number
          created_at?: string
          id?: string
          last_updated?: string
          page_views?: number
          product_id: string
          unique_visitors?: number
          updated_at?: string
        }
        Update: {
          average_time_on_page?: number
          bounce_rate?: number
          conversion_rate?: number
          created_at?: string
          id?: string
          last_updated?: string
          page_views?: number
          product_id?: string
          unique_visitors?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_benefits: {
        Row: {
          access_code: string | null
          benefit_type_id: number | null
          content_url: string | null
          created_at: string | null
          credits_amount: number | null
          description: string | null
          drop_date: string | null
          exclusive_visibility_series_id: string | null
          expires_at: string | null
          hidden_series_id: string | null
          id: number
          is_active: boolean | null
          product_id: string | null
          series_id: string | null
          starts_at: string | null
          title: string
          updated_at: string | null
          vendor_name: string
          vip_artwork_id: string | null
        }
        Insert: {
          access_code?: string | null
          benefit_type_id?: number | null
          content_url?: string | null
          created_at?: string | null
          credits_amount?: number | null
          description?: string | null
          drop_date?: string | null
          exclusive_visibility_series_id?: string | null
          expires_at?: string | null
          hidden_series_id?: string | null
          id?: number
          is_active?: boolean | null
          product_id?: string | null
          series_id?: string | null
          starts_at?: string | null
          title: string
          updated_at?: string | null
          vendor_name: string
          vip_artwork_id?: string | null
        }
        Update: {
          access_code?: string | null
          benefit_type_id?: number | null
          content_url?: string | null
          created_at?: string | null
          credits_amount?: number | null
          description?: string | null
          drop_date?: string | null
          exclusive_visibility_series_id?: string | null
          expires_at?: string | null
          hidden_series_id?: string | null
          id?: number
          is_active?: boolean | null
          product_id?: string | null
          series_id?: string | null
          starts_at?: string | null
          title?: string
          updated_at?: string | null
          vendor_name?: string
          vip_artwork_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_benefits_benefit_type_id_fkey"
            columns: ["benefit_type_id"]
            isOneToOne: false
            referencedRelation: "benefit_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_benefits_exclusive_visibility_series_id_fkey"
            columns: ["exclusive_visibility_series_id"]
            isOneToOne: false
            referencedRelation: "artwork_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_benefits_hidden_series_id_fkey"
            columns: ["hidden_series_id"]
            isOneToOne: false
            referencedRelation: "artwork_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_benefits_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "artwork_series"
            referencedColumns: ["id"]
          },
        ]
      }
      product_edition_counters: {
        Row: {
          certificate_generated_at: string | null
          certificate_token: string | null
          certificate_url: string | null
          current_edition_number: number
          edition_number: number | null
          edition_total: string | null
          id: number
          last_updated: string | null
          product_id: string
          product_title: string | null
          updated_at: string | null
        }
        Insert: {
          certificate_generated_at?: string | null
          certificate_token?: string | null
          certificate_url?: string | null
          current_edition_number?: number
          edition_number?: number | null
          edition_total?: string | null
          id?: number
          last_updated?: string | null
          product_id: string
          product_title?: string | null
          updated_at?: string | null
        }
        Update: {
          certificate_generated_at?: string | null
          certificate_token?: string | null
          certificate_url?: string | null
          current_edition_number?: number
          edition_number?: number | null
          edition_total?: string | null
          id?: number
          last_updated?: string | null
          product_id?: string
          product_title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_vendor_payouts: {
        Row: {
          created_at: string | null
          id: number
          is_percentage: boolean | null
          payout_amount: number | null
          product_id: string
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_percentage?: boolean | null
          payout_amount?: number | null
          product_id: string
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_percentage?: boolean | null
          payout_amount?: number | null
          product_id?: string
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          edition_counter: number | null
          edition_size: string | null
          handle: string | null
          id: string
          image_url: string | null
          img_url: string | null
          name: string
          parent_shopify_id: string | null
          payout_percentage: number | null
          price: number
          product_id: number | null
          sku: string | null
          updated_at: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          edition_counter?: number | null
          edition_size?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          img_url?: string | null
          name: string
          parent_shopify_id?: string | null
          payout_percentage?: number | null
          price: number
          product_id?: number | null
          sku?: string | null
          updated_at?: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          edition_counter?: number | null
          edition_size?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          img_url?: string | null
          name?: string
          parent_shopify_id?: string | null
          payout_percentage?: number | null
          price?: number
          product_id?: number | null
          sku?: string | null
          updated_at?: string
          vendor_name?: string
        }
        Relationships: []
      }
      series_completion_history: {
        Row: {
          completed_at: string | null
          completion_type: string
          created_at: string | null
          final_stats: Json | null
          id: string
          series_id: string
          vendor_id: number
        }
        Insert: {
          completed_at?: string | null
          completion_type: string
          created_at?: string | null
          final_stats?: Json | null
          id?: string
          series_id: string
          vendor_id: number
        }
        Update: {
          completed_at?: string | null
          completion_type?: string
          created_at?: string | null
          final_stats?: Json | null
          id?: string
          series_id?: string
          vendor_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "series_completion_history_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "artwork_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_completion_history_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_order_tracking_links: {
        Row: {
          access_count: number | null
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          logo_url: string | null
          order_ids: string[]
          primary_color: string | null
          title: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          logo_url?: string | null
          order_ids: string[]
          primary_color?: string | null
          title?: string | null
          token: string
          updated_at?: string | null
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          logo_url?: string | null
          order_ids?: string[]
          primary_color?: string | null
          title?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shopify_customers: {
        Row: {
          created_at: string | null
          id: number
          shopify_customer_access_token: string
          shopify_customer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          shopify_customer_access_token: string
          shopify_customer_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          shopify_customer_access_token?: string
          shopify_customer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: number
          type: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: number
          type?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: number
          type?: string | null
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          created_at: string | null
          id: string
          initialized: boolean | null
          last_cursor: string | null
          last_sync: string | null
          total_line_items: number | null
          total_orders: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          initialized?: boolean | null
          last_cursor?: string | null
          last_sync?: string | null
          total_line_items?: number | null
          total_orders?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          initialized?: boolean | null
          last_cursor?: string | null
          last_sync?: string | null
          total_line_items?: number | null
          total_orders?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          level: string
          message: string
          source: string
          timestamp: number
          trace_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level: string
          message: string
          source: string
          timestamp: number
          trace_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          source?: string
          timestamp?: number
          trace_id?: string | null
        }
        Relationships: []
      }
      tracking_link_label_emails: {
        Row: {
          created_at: string | null
          email: string
          id: string
          label_name: string
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          label_name: string
          token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          label_name?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_link_label_emails_token_fkey"
            columns: ["token"]
            isOneToOne: false
            referencedRelation: "shared_order_tracking_links"
            referencedColumns: ["token"]
          },
        ]
      }
      tracking_link_labels: {
        Row: {
          created_at: string | null
          id: string
          label_name: string
          token: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label_name: string
          token: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label_name?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_link_labels_token_fkey"
            columns: ["token"]
            isOneToOne: false
            referencedRelation: "shared_order_tracking_links"
            referencedColumns: ["token"]
          },
        ]
      }
      tracking_link_notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: number
          last_notified_status: Json | null
          notification_email: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: number
          last_notified_status?: Json | null
          notification_email?: string | null
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: number
          last_notified_status?: Json | null
          notification_email?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_link_notification_preferences_token_fkey"
            columns: ["token"]
            isOneToOne: true
            referencedRelation: "shared_order_tracking_links"
            referencedColumns: ["token"]
          },
        ]
      }
      tracking_link_order_labels: {
        Row: {
          created_at: string | null
          id: string
          label_name: string
          order_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label_name: string
          order_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label_name?: string
          order_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_link_order_labels_token_fkey"
            columns: ["token"]
            isOneToOne: false
            referencedRelation: "shared_order_tracking_links"
            referencedColumns: ["token"]
          },
        ]
      }
      transfer_history: {
        Row: {
          created_at: string | null
          id: number
          line_item_id: number
          new_owner_email: string
          new_owner_name: string
          order_id: number
          previous_owner_email: string
          previous_owner_name: string
          transferred_at: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          line_item_id: number
          new_owner_email: string
          new_owner_name: string
          order_id: number
          previous_owner_email: string
          previous_owner_name: string
          transferred_at: string
        }
        Update: {
          created_at?: string | null
          id?: number
          line_item_id?: number
          new_owner_email?: string
          new_owner_name?: string
          order_id?: number
          previous_owner_email?: string
          previous_owner_name?: string
          transferred_at?: string
        }
        Relationships: []
      }
      user_shopify_connections: {
        Row: {
          created_at: string | null
          customer_id: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vendor_collections: {
        Row: {
          collection_title: string
          created_at: string | null
          id: string
          shopify_collection_handle: string
          shopify_collection_id: string | null
          updated_at: string | null
          vendor_id: number
          vendor_name: string
        }
        Insert: {
          collection_title: string
          created_at?: string | null
          id?: string
          shopify_collection_handle: string
          shopify_collection_id?: string | null
          updated_at?: string | null
          vendor_id: number
          vendor_name: string
        }
        Update: {
          collection_title?: string
          created_at?: string | null
          id?: string
          shopify_collection_handle?: string
          shopify_collection_id?: string | null
          updated_at?: string | null
          vendor_id?: number
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_collections_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_lamp_purchases: {
        Row: {
          created_at: string | null
          discount_applied: boolean
          id: string
          product_sku: string
          purchase_price: number
          purchased_at: string | null
          vendor_id: number
          vendor_name: string
        }
        Insert: {
          created_at?: string | null
          discount_applied?: boolean
          id?: string
          product_sku: string
          purchase_price: number
          purchased_at?: string | null
          vendor_id: number
          vendor_name: string
        }
        Update: {
          created_at?: string | null
          discount_applied?: boolean
          id?: string
          product_sku?: string
          purchase_price?: number
          purchased_at?: string | null
          vendor_id?: number
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_lamp_purchases_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_lamp_purchases_vendor_name_fkey"
            columns: ["vendor_name"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_name"]
          },
        ]
      }
      vendor_ledger_entries: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_type: string
          id: number
          line_item_id: string | null
          metadata: Json | null
          order_id: string | null
          payout_id: number | null
          vendor_name: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_type: string
          id?: number
          line_item_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          payout_id?: number | null
          vendor_name: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_type?: string
          id?: number
          line_item_id?: string | null
          metadata?: Json | null
          order_id?: string | null
          payout_id?: number | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_ledger_entries_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "vendor_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_ledger_entries_vendor_name_fkey"
            columns: ["vendor_name"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_name"]
          },
        ]
      }
      vendor_messages: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          recipient_id: string | null
          recipient_type: string
          sender_id: string | null
          sender_type: string
          subject: string | null
          thread_id: string
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id?: string | null
          recipient_type: string
          sender_id?: string | null
          sender_type: string
          subject?: string | null
          thread_id: string
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id?: string | null
          recipient_type?: string
          sender_id?: string | null
          sender_type?: string
          subject?: string | null
          thread_id?: string
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      vendor_notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          message_received: boolean | null
          new_order: boolean | null
          payout_failed: boolean | null
          payout_pending: boolean | null
          payout_processed: boolean | null
          product_status_change: boolean | null
          push_enabled: boolean | null
          refund_deduction: boolean | null
          system_announcement: boolean | null
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          message_received?: boolean | null
          new_order?: boolean | null
          payout_failed?: boolean | null
          payout_pending?: boolean | null
          payout_processed?: boolean | null
          product_status_change?: boolean | null
          push_enabled?: boolean | null
          refund_deduction?: boolean | null
          system_announcement?: boolean | null
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          message_received?: boolean | null
          new_order?: boolean | null
          payout_failed?: boolean | null
          payout_pending?: boolean | null
          payout_processed?: boolean | null
          product_status_change?: boolean | null
          push_enabled?: boolean | null
          refund_deduction?: boolean | null
          system_announcement?: boolean | null
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      vendor_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          vendor_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          vendor_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          vendor_name?: string
        }
        Relationships: []
      }
      vendor_payout_items: {
        Row: {
          amount: number
          created_at: string | null
          id: number
          line_item_id: string
          manually_marked_paid: boolean | null
          marked_at: string | null
          marked_by: string | null
          order_id: string
          payout_id: number | null
          payout_reference: string | null
          product_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: number
          line_item_id: string
          manually_marked_paid?: boolean | null
          marked_at?: string | null
          marked_by?: string | null
          order_id: string
          payout_id?: number | null
          payout_reference?: string | null
          product_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: number
          line_item_id?: string
          manually_marked_paid?: boolean | null
          marked_at?: string | null
          marked_by?: string | null
          order_id?: string
          payout_id?: number | null
          payout_reference?: string | null
          product_id?: string
        }
        Relationships: []
      }
      vendor_payouts: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: number
          invoice_number: string | null
          is_self_billed: boolean | null
          notes: string | null
          payment_details: Json | null
          payment_id: string | null
          payment_method: string | null
          payout_batch_id: string | null
          payout_date: string | null
          processed_by: string | null
          product_count: number | null
          reference: string | null
          status: string
          tax_amount: number | null
          tax_rate: number | null
          updated_at: string | null
          vendor_name: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: number
          invoice_number?: string | null
          is_self_billed?: boolean | null
          notes?: string | null
          payment_details?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          payout_batch_id?: string | null
          payout_date?: string | null
          processed_by?: string | null
          product_count?: number | null
          reference?: string | null
          status?: string
          tax_amount?: number | null
          tax_rate?: number | null
          updated_at?: string | null
          vendor_name: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: number
          invoice_number?: string | null
          is_self_billed?: boolean | null
          notes?: string | null
          payment_details?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          payout_batch_id?: string | null
          payout_date?: string | null
          processed_by?: string | null
          product_count?: number | null
          reference?: string | null
          status?: string
          tax_amount?: number | null
          tax_rate?: number | null
          updated_at?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_vendor_name_fkey"
            columns: ["vendor_name"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_name"]
          },
        ]
      }
      vendor_product_submissions: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          product_data: Json
          published_at: string | null
          rejection_reason: string | null
          series_id: string | null
          series_metadata: Json | null
          shopify_product_id: string | null
          status: Database["public"]["Enums"]["product_submission_status"]
          submitted_at: string | null
          updated_at: string | null
          vendor_id: number
          vendor_name: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          product_data: Json
          published_at?: string | null
          rejection_reason?: string | null
          series_id?: string | null
          series_metadata?: Json | null
          shopify_product_id?: string | null
          status?: Database["public"]["Enums"]["product_submission_status"]
          submitted_at?: string | null
          updated_at?: string | null
          vendor_id: number
          vendor_name: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          product_data?: Json
          published_at?: string | null
          rejection_reason?: string | null
          series_id?: string | null
          series_metadata?: Json | null
          shopify_product_id?: string | null
          status?: Database["public"]["Enums"]["product_submission_status"]
          submitted_at?: string | null
          updated_at?: string | null
          vendor_id?: number
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_product_submissions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "artwork_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_product_submissions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_proof_prints: {
        Row: {
          artwork_image_url: string | null
          artwork_title: string
          created_at: string | null
          id: string
          last_ordered_at: string | null
          quantity_ordered: number
          submission_id: string
          updated_at: string | null
          vendor_id: number
        }
        Insert: {
          artwork_image_url?: string | null
          artwork_title: string
          created_at?: string | null
          id?: string
          last_ordered_at?: string | null
          quantity_ordered?: number
          submission_id: string
          updated_at?: string | null
          vendor_id: number
        }
        Update: {
          artwork_image_url?: string | null
          artwork_title?: string
          created_at?: string | null
          id?: string
          last_ordered_at?: string | null
          quantity_ordered?: number
          submission_id?: string
          updated_at?: string | null
          vendor_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_proof_prints_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "vendor_product_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_proof_prints_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_store_purchases: {
        Row: {
          artwork_submission_id: string | null
          created_at: string | null
          credits_used: number | null
          discount_percentage: number | null
          external_payment_id: string | null
          fulfilled_at: string | null
          id: string
          payment_method: Database["public"]["Enums"]["store_payment_method"]
          payout_balance_used: number | null
          product_sku: string | null
          purchase_type: Database["public"]["Enums"]["store_purchase_type"]
          quantity: number
          status: Database["public"]["Enums"]["store_purchase_status"]
          total_amount: number
          unit_price: number
          updated_at: string | null
          vendor_id: number
          vendor_name: string
        }
        Insert: {
          artwork_submission_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          discount_percentage?: number | null
          external_payment_id?: string | null
          fulfilled_at?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["store_payment_method"]
          payout_balance_used?: number | null
          product_sku?: string | null
          purchase_type: Database["public"]["Enums"]["store_purchase_type"]
          quantity?: number
          status?: Database["public"]["Enums"]["store_purchase_status"]
          total_amount: number
          unit_price: number
          updated_at?: string | null
          vendor_id: number
          vendor_name: string
        }
        Update: {
          artwork_submission_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          discount_percentage?: number | null
          external_payment_id?: string | null
          fulfilled_at?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["store_payment_method"]
          payout_balance_used?: number | null
          product_sku?: string | null
          purchase_type?: Database["public"]["Enums"]["store_purchase_type"]
          quantity?: number
          status?: Database["public"]["Enums"]["store_purchase_status"]
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
          vendor_id?: number
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_store_purchases_artwork_submission_id_fkey"
            columns: ["artwork_submission_id"]
            isOneToOne: false
            referencedRelation: "vendor_product_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_store_purchases_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_store_purchases_vendor_name_fkey"
            columns: ["vendor_name"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_name"]
          },
        ]
      }
      vendor_users: {
        Row: {
          auth_id: string | null
          created_at: string | null
          email: string | null
          id: string
          vendor_id: number
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          vendor_id: number
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          vendor_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendor_users_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          artist_bio: string | null
          artist_history: string | null
          artist_spotlight_enabled: boolean
          artwork_style: string | null
          auth_id: string | null
          bank_account: string | null
          bio: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          delivery_address1: string | null
          delivery_address2: string | null
          delivery_city: string | null
          delivery_country: string | null
          delivery_name: string | null
          delivery_phone: string | null
          delivery_province: string | null
          delivery_zip: string | null
          has_used_lamp_discount: boolean | null
          id: number
          instagram_url: string | null
          is_company: boolean | null
          last_login_at: string | null
          last_modified: string | null
          notes: string | null
          onboarded_at: string | null
          onboarding_abandoned_at: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_data: Json | null
          onboarding_started_at: string | null
          onboarding_step: number | null
          password: string | null
          password_hash: string | null
          payout_method: string | null
          paypal_email: string | null
          phone: string | null
          product_count: number | null
          profile_image: string | null
          profile_picture: string | null
          profile_picture_url: string | null
          signature_url: string | null
          status: string | null
          store_balance: number | null
          tax_country: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
          vendor_name: string
          website: string | null
        }
        Insert: {
          address?: string | null
          artist_bio?: string | null
          artist_history?: string | null
          artist_spotlight_enabled?: boolean
          artwork_style?: string | null
          auth_id?: string | null
          bank_account?: string | null
          bio?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          delivery_address1?: string | null
          delivery_address2?: string | null
          delivery_city?: string | null
          delivery_country?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          delivery_province?: string | null
          delivery_zip?: string | null
          has_used_lamp_discount?: boolean | null
          id?: number
          instagram_url?: string | null
          is_company?: boolean | null
          last_login_at?: string | null
          last_modified?: string | null
          notes?: string | null
          onboarded_at?: string | null
          onboarding_abandoned_at?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_data?: Json | null
          onboarding_started_at?: string | null
          onboarding_step?: number | null
          password?: string | null
          password_hash?: string | null
          payout_method?: string | null
          paypal_email?: string | null
          phone?: string | null
          product_count?: number | null
          profile_image?: string | null
          profile_picture?: string | null
          profile_picture_url?: string | null
          signature_url?: string | null
          status?: string | null
          store_balance?: number | null
          tax_country?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vendor_name: string
          website?: string | null
        }
        Update: {
          address?: string | null
          artist_bio?: string | null
          artist_history?: string | null
          artist_spotlight_enabled?: boolean
          artwork_style?: string | null
          auth_id?: string | null
          bank_account?: string | null
          bio?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          delivery_address1?: string | null
          delivery_address2?: string | null
          delivery_city?: string | null
          delivery_country?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          delivery_province?: string | null
          delivery_zip?: string | null
          has_used_lamp_discount?: boolean | null
          id?: number
          instagram_url?: string | null
          is_company?: boolean | null
          last_login_at?: string | null
          last_modified?: string | null
          notes?: string | null
          onboarded_at?: string | null
          onboarding_abandoned_at?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_data?: Json | null
          onboarding_started_at?: string | null
          onboarding_step?: number | null
          password?: string | null
          password_hash?: string | null
          payout_method?: string | null
          paypal_email?: string | null
          phone?: string | null
          product_count?: number | null
          profile_image?: string | null
          profile_picture?: string | null
          profile_picture_url?: string | null
          signature_url?: string | null
          status?: string | null
          store_balance?: number | null
          tax_country?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vendor_name?: string
          website?: string | null
        }
        Relationships: []
      }
      webhook_delivery_logs: {
        Row: {
          attempts: number
          created_at: string | null
          destination_id: string | null
          error_message: string | null
          event: string
          id: string
          last_attempt_at: string | null
          payload: Json
          response_code: number | null
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string | null
          destination_id?: string | null
          error_message?: string | null
          event: string
          id?: string
          last_attempt_at?: string | null
          payload: Json
          response_code?: number | null
          status: string
        }
        Update: {
          attempts?: number
          created_at?: string | null
          destination_id?: string | null
          error_message?: string | null
          event?: string
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          response_code?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "webhook_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_destinations: {
        Row: {
          active: boolean | null
          created_at: string | null
          events: string[]
          id: string
          secret: string
          updated_at: string | null
          url: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          events: string[]
          id?: string
          secret: string
          updated_at?: string | null
          url: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          events?: string[]
          id?: string
          secret?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: number
          type: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: number
          type?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: number
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      order_line_items: {
        Row: {
          created_at: string | null
          description: string | null
          fulfillment_status: string | null
          id: number | null
          line_item_id: string | null
          name: string | null
          order_id: string | null
          order_name: string | null
          price: number | null
          product_id: number | null
          quantity: number | null
          sku: string | null
          status: string | null
          updated_at: string | null
          variant_id: string | null
          vendor_name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fulfillment_status?: string | null
          id?: number | null
          line_item_id?: string | null
          name?: string | null
          order_id?: string | null
          order_name?: string | null
          price?: number | null
          product_id?: number | null
          quantity?: number | null
          sku?: string | null
          status?: string | null
          updated_at?: string | null
          variant_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fulfillment_status?: string | null
          id?: number | null
          line_item_id?: string | null
          name?: string | null
          order_id?: string | null
          order_name?: string | null
          price?: number | null
          product_id?: number | null
          quantity?: number | null
          sku?: string | null
          status?: string | null
          updated_at?: string | null
          variant_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_line_items_v2_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payout_summary: {
        Row: {
          fulfilled_line_items: number | null
          last_updated_at: string | null
          order_created_at: string | null
          order_id: string | null
          order_name: string | null
          paid_line_items: number | null
          paid_payout_amount: number | null
          pending_payout_amount: number | null
          pending_payout_items: number | null
          total_line_items: number | null
          vendor_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_line_items_v2_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_field_defaults: {
        Args: { p_entity_id: string; p_entity_type: string; p_user_id?: string }
        Returns: undefined
      }
      archive_record: {
        Args: { p_record_id: string; p_table_name: string }
        Returns: undefined
      }
      assign_edition_numbers: {
        Args: { p_product_id: string }
        Returns: number
      }
      calculate_edition_numbers: {
        Args: { product_id: string }
        Returns: number
      }
      calculate_next_payout_run: {
        Args: {
          p_day_of_month?: number
          p_day_of_week?: number
          p_schedule_type: string
        }
        Returns: string
      }
      calculate_series_completion_progress: {
        Args: { series_id_param: string }
        Returns: Json
      }
      calculate_thread_depth: {
        Args: { p_message_id: string }
        Returns: number
      }
      check_and_complete_series: {
        Args: { series_id_param: string }
        Returns: boolean
      }
      check_product_id_types: {
        Args: never
        Returns: {
          has_mismatch: boolean
          line_items_type: string
          line_items_value: string
          product_id: string
          products_type: string
          products_value: string
        }[]
      }
      check_specific_product_ids: {
        Args: never
        Returns: {
          has_mismatch: boolean
          line_items_type: string
          line_items_value: string
          product_id: string
          products_type: string
          products_value: string
        }[]
      }
      check_workspace_permission: {
        Args: {
          p_permission_name: string
          p_user_id: string
          p_workspace_id?: string
        }
        Returns: boolean
      }
      cleanup_orphaned_products: { Args: never; Returns: undefined }
      create_policy_if_not_exists: {
        Args: {
          action: string
          policy_name: string
          roles: string
          table_name: string
          using_expr?: string
          with_check_expr?: string
        }
        Returns: undefined
      }
      enable_pg_trgm_if_needed: { Args: never; Returns: undefined }
      evaluate_webhook_filter: {
        Args: { p_filter: Json; p_payload: Json }
        Returns: boolean
      }
      exec_sql: { Args: { sql_query: string }; Returns: undefined }
      find_duplicate_contacts: {
        Args: { p_customer_id?: string }
        Returns: {
          customer_id: string
          duplicate_customer_id: string
          match_score: number
          matching_identifiers: string[]
        }[]
      }
      format_attribute_value_for_display: {
        Args: { p_field_type: string; p_value: Json }
        Returns: string
      }
      fuzzy_search_companies: {
        Args: {
          result_limit?: number
          search_term: string
          similarity_threshold?: number
        }
        Returns: {
          domain: string
          id: string
          industry: string
          matched_fields: string[]
          name: string
          similarity: number
          website: string
        }[]
      }
      fuzzy_search_people: {
        Args: {
          result_limit?: number
          search_term: string
          similarity_threshold?: number
        }
        Returns: {
          display_name: string
          email: string
          id: string
          instagram_username: string
          matched_fields: string[]
          phone: string
          similarity: number
        }[]
      }
      generate_thread_id: { Args: never; Returns: string }
      get_collector_balance:
        | { Args: { p_collector_identifier: string }; Returns: number }
        | {
            Args: { p_collector_identifier: string; p_currency?: string }
            Returns: number
          }
      get_collector_credits_balance: {
        Args: { p_collector_identifier: string }
        Returns: number
      }
      get_collector_credits_earned: {
        Args: { p_collector_identifier: string }
        Returns: number
      }
      get_collector_unified_balance: {
        Args: { p_collector_identifier: string }
        Returns: {
          credits_balance: number
          total_credits_earned: number
          total_usd_earned: number
          usd_balance: number
        }[]
      }
      get_collector_usd_balance: {
        Args: { p_collector_identifier: string }
        Returns: number
      }
      get_current_field_values: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          active_from: string
          field_id: string
          value: string
          value_json: Json
        }[]
      }
      get_customer_timeline: {
        Args: { p_customer_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          created_at: string
          description: string
          id: string
          metadata: Json
          platform: string
          title: string
        }[]
      }
      get_default_saved_view: {
        Args: { p_entity_type: string; p_user_id: string }
        Returns: {
          description: string
          filters: Json
          id: string
          name: string
          sort: Json
        }[]
      }
      get_list_entry_attribute_value: {
        Args: { p_attribute_id: string; p_entry_id: string }
        Returns: {
          active_from: string
          value: string
          value_json: Json
        }[]
      }
      get_next_edition_number: { Args: { product_id: string }; Returns: number }
      get_pending_vendor_payouts: {
        Args: never
        Returns: {
          amount: number
          is_company: boolean
          last_payout_date: string
          paypal_email: string
          product_count: number
          tax_country: string
          tax_id: string
          vendor_name: string
        }[]
      }
      get_total_editions: { Args: { product_id: string }; Returns: number }
      get_vendor_payout_by_order: {
        Args: { p_order_id?: string; p_vendor_name: string }
        Returns: {
          fulfilled_line_items: number
          line_items: Json
          order_date: string
          order_id: string
          order_name: string
          order_total: number
          paid_line_items: number
          payout_amount: number
          pending_line_items: number
          total_line_items: number
        }[]
      }
      get_vendor_pending_line_items: {
        Args: { p_vendor_name: string }
        Returns: {
          created_at: string
          fulfillment_status: string
          is_percentage: boolean
          line_item_id: string
          order_id: string
          order_name: string
          payout_amount: number
          price: number
          product_id: string
          product_title: string
        }[]
      }
      get_workspace_member_role: {
        Args: { p_user_id: string; p_workspace_id?: string }
        Returns: string
      }
      hash_password: { Args: { plain_password: string }; Returns: string }
      increment_tracking_link_access: {
        Args: { token_param: string }
        Returns: undefined
      }
      migrate_conversation_tags: { Args: never; Returns: undefined }
      process_default_value: {
        Args: {
          p_default_value: Json
          p_field_type: string
          p_user_id?: string
        }
        Returns: Json
      }
      resequence_edition_numbers: {
        Args: { product_id_param: string }
        Returns: Json
      }
      resolve_comment: {
        Args: { p_comment_id: string; p_user_id: string }
        Returns: undefined
      }
      restore_record: {
        Args: { p_record_id: string; p_table_name: string }
        Returns: undefined
      }
      revoke_and_reassign_editions: {
        Args: { p_line_item_id: number }
        Returns: undefined
      }
      scheduled_cleanup: { Args: never; Returns: undefined }
      setup_cleanup_schedule: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sync_all_products: { Args: never; Returns: undefined }
      sync_relationship_attribute: {
        Args: {
          p_add?: boolean
          p_from_entity_id: string
          p_from_entity_type: string
          p_relationship_id: string
          p_to_entity_id: string
          p_to_entity_type: string
        }
        Returns: undefined
      }
      unresolve_comment: { Args: { p_comment_id: string }; Returns: undefined }
      update_payout_schedule_next_runs: { Args: never; Returns: undefined }
      validate_attribute_value: {
        Args: { p_field_type: string; p_value: Json }
        Returns: boolean
      }
      validate_status_transition: {
        Args: { p_field_id: string; p_from_status: string; p_to_status: string }
        Returns: boolean
      }
      verify_password: {
        Args: { input_password: string; stored_password: string }
        Returns: boolean
      }
    }
    Enums: {
      collector_account_status: "active" | "inactive"
      collector_account_type: "customer" | "vendor"
      collector_perk_type: "lamp" | "proof_print"
      collector_redemption_status: "pending" | "fulfilled" | "cancelled"
      collector_subscription_status:
        | "active"
        | "paused"
        | "cancelled"
        | "expired"
      collector_transaction_type:
        | "credit_earned"
        | "subscription_credit"
        | "purchase"
        | "perk_redemption"
        | "payout_earned"
        | "payout_withdrawal"
        | "payout_balance_purchase"
        | "refund_deduction"
        | "adjustment"
        | "platform_fee"
      content_type: "image" | "video" | "text" | "audio" | "quote"
      crm_activity_type:
        | "email"
        | "call"
        | "meeting"
        | "note"
        | "task"
        | "order"
        | "message"
        | "facebook_message"
        | "whatsapp_message"
        | "instagram_message"
        | "shopify_order"
        | "custom"
      crm_call_outcome:
        | "connected"
        | "voicemail"
        | "no_answer"
        | "busy"
        | "failed"
        | "scheduled"
      crm_conversation_status: "open" | "closed" | "pending"
      crm_deal_status: "open" | "won" | "lost" | "on_hold"
      crm_message_direction: "inbound" | "outbound"
      crm_platform: "email" | "instagram"
      crm_sequence_send_status:
        | "pending"
        | "queued"
        | "sending"
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "replied"
        | "bounced"
        | "failed"
        | "cancelled"
      crm_sequence_status:
        | "draft"
        | "active"
        | "paused"
        | "completed"
        | "stopped"
      crm_sequence_step_type: "email" | "task" | "wait"
      crm_task_priority: "low" | "normal" | "high" | "urgent"
      crm_task_status: "open" | "in_progress" | "completed" | "cancelled"
      product_submission_status:
        | "pending"
        | "approved"
        | "rejected"
        | "published"
      store_payment_method: "payout_balance" | "external" | "credits"
      store_purchase_status:
        | "pending"
        | "processing"
        | "fulfilled"
        | "cancelled"
      store_purchase_type: "lamp" | "proof_print"
      vendor_status: "pending" | "active" | "review" | "disabled" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      collector_account_status: ["active", "inactive"],
      collector_account_type: ["customer", "vendor"],
      collector_perk_type: ["lamp", "proof_print"],
      collector_redemption_status: ["pending", "fulfilled", "cancelled"],
      collector_subscription_status: [
        "active",
        "paused",
        "cancelled",
        "expired",
      ],
      collector_transaction_type: [
        "credit_earned",
        "subscription_credit",
        "purchase",
        "perk_redemption",
        "payout_earned",
        "payout_withdrawal",
        "payout_balance_purchase",
        "refund_deduction",
        "adjustment",
        "platform_fee",
      ],
      content_type: ["image", "video", "text", "audio", "quote"],
      crm_activity_type: [
        "email",
        "call",
        "meeting",
        "note",
        "task",
        "order",
        "message",
        "facebook_message",
        "whatsapp_message",
        "instagram_message",
        "shopify_order",
        "custom",
      ],
      crm_call_outcome: [
        "connected",
        "voicemail",
        "no_answer",
        "busy",
        "failed",
        "scheduled",
      ],
      crm_conversation_status: ["open", "closed", "pending"],
      crm_deal_status: ["open", "won", "lost", "on_hold"],
      crm_message_direction: ["inbound", "outbound"],
      crm_platform: ["email", "instagram"],
      crm_sequence_send_status: [
        "pending",
        "queued",
        "sending",
        "sent",
        "delivered",
        "opened",
        "clicked",
        "replied",
        "bounced",
        "failed",
        "cancelled",
      ],
      crm_sequence_status: [
        "draft",
        "active",
        "paused",
        "completed",
        "stopped",
      ],
      crm_sequence_step_type: ["email", "task", "wait"],
      crm_task_priority: ["low", "normal", "high", "urgent"],
      crm_task_status: ["open", "in_progress", "completed", "cancelled"],
      product_submission_status: [
        "pending",
        "approved",
        "rejected",
        "published",
      ],
      store_payment_method: ["payout_balance", "external", "credits"],
      store_purchase_status: [
        "pending",
        "processing",
        "fulfilled",
        "cancelled",
      ],
      store_purchase_type: ["lamp", "proof_print"],
      vendor_status: ["pending", "active", "review", "disabled", "suspended"],
    },
  },
} as const

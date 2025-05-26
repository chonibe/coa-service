export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          name: string
          created_at: string
          total_price: number
          financial_status: string
          customer_id: string
        }
        Insert: {
          id: string
          name: string
          created_at?: string
          total_price: number
          financial_status: string
          customer_id: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          total_price?: number
          financial_status?: string
          customer_id?: string
        }
      }
      order_line_items: {
        Row: {
          id: string
          order_id: string
          line_item_id: string
          title: string
          quantity: number
          price: string
          image_url: string | null
          nfc_tag_id: string | null
          nfc_claimed_at: string | null
          certificate_url: string | null
          edition_number: number | null
          edition_total: number | null
          vendor_name: string | null
        }
        Insert: {
          id?: string
          order_id: string
          line_item_id: string
          title: string
          quantity: number
          price: string
          image_url?: string | null
          nfc_tag_id?: string | null
          nfc_claimed_at?: string | null
          certificate_url?: string | null
          edition_number?: number | null
          edition_total?: number | null
          vendor_name?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          line_item_id?: string
          title?: string
          quantity?: number
          price?: string
          image_url?: string | null
          nfc_tag_id?: string | null
          nfc_claimed_at?: string | null
          certificate_url?: string | null
          edition_number?: number | null
          edition_total?: number | null
          vendor_name?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 
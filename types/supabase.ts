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
      products: {
        Row: {
          id: string
          product_id: string
          name: string
          vendor_name: string
          sku: string
          edition_size: string | null
          price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          vendor_name: string
          sku: string
          edition_size?: string | null
          price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          vendor_name?: string
          sku?: string
          edition_size?: string | null
          price?: number | null
          created_at?: string
        }
      }
      order_line_items: {
        Row: {
          id: number
          order_id: string
          order_name: string | null
          line_item_id: string
          product_id: string
          variant_id: string | null
          name: string
          description: string | null
          price: number
          vendor_name: string | null
          fulfillment_status: string | null
          status: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          order_id: string
          order_name?: string | null
          line_item_id: string
          product_id: string
          variant_id?: string | null
          name: string
          description?: string | null
          price: number
          vendor_name?: string | null
          fulfillment_status?: string | null
          status: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          order_id?: string
          order_name?: string | null
          line_item_id?: string
          product_id?: string
          variant_id?: string | null
          name?: string
          description?: string | null
          price?: number
          vendor_name?: string | null
          fulfillment_status?: string | null
          status?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      order_line_items: {
        Row: {
          id: number
          order_id: string
          order_name: string | null
          line_item_id: string
          product_id: string
          variant_id: string | null
          name: string
          description: string | null
          price: number
          quantity: number
          sku: string | null
          vendor_name: string | null
          fulfillment_status: string | null
          status: string
          created_at: string
          updated_at: string | null
          nfc_tag_id: string | null
          certificate_url: string | null
          certificate_token: string | null
          nfc_claimed_at: string | null
          edition_number: number | null
          edition_total: number | null
          img_url: string | null
        }
        Insert: {
          id?: number
          order_id: string
          order_name?: string | null
          line_item_id: string
          product_id: string
          variant_id?: string | null
          name: string
          description?: string | null
          price: number
          quantity?: number
          sku?: string | null
          vendor_name?: string | null
          fulfillment_status?: string | null
          status: string
          created_at?: string
          updated_at?: string | null
          nfc_tag_id?: string | null
          certificate_url?: string | null
          certificate_token?: string | null
          nfc_claimed_at?: string | null
          edition_number?: number | null
          edition_total?: number | null
          img_url?: string | null
        }
        Update: {
          id?: number
          order_id?: string
          order_name?: string | null
          line_item_id?: string
          product_id?: string
          variant_id?: string | null
          name?: string
          description?: string | null
          price?: number
          quantity?: number
          sku?: string | null
          vendor_name?: string | null
          fulfillment_status?: string | null
          status?: string
          created_at?: string
          updated_at?: string | null
          nfc_tag_id?: string | null
          certificate_url?: string | null
          certificate_token?: string | null
          nfc_claimed_at?: string | null
          edition_number?: number | null
          edition_total?: number | null
          img_url?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
export type DatabasePublic = Database["public"]
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: any
    }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName]["Row"]
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: any
      }
      ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions]["Row"]
      : never
    : never

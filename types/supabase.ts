export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      order_line_items: {
        Row: {
          id: number
          order_id: string
          order_name: string | null
          line_item_id: string
          product_id: string
          variant_id: string | null
          edition_number: number | null
          edition_total: number | null
          created_at: string | null
          updated_at: string | null
          status: string | null
          removed_reason: string | null
          vendor_name: string | null
          certificate_url: string | null
          certificate_token: string | null
          certificate_generated_at: string | null
        }
        Insert: {
          id?: number
          order_id: string
          order_name?: string | null
          line_item_id: string
          product_id: string
          variant_id?: string | null
          edition_number?: number | null
          edition_total?: number | null
          created_at?: string | null
          updated_at?: string | null
          status?: string | null
          removed_reason?: string | null
          vendor_name?: string | null
          certificate_url?: string | null
          certificate_token?: string | null
          certificate_generated_at?: string | null
        }
        Update: {
          id?: number
          order_id?: string
          order_name?: string | null
          line_item_id?: string
          product_id?: string
          variant_id?: string | null
          edition_number?: number | null
          edition_total?: number | null
          created_at?: string | null
          updated_at?: string | null
          status?: string | null
          removed_reason?: string | null
          vendor_name?: string | null
          certificate_url?: string | null
          certificate_token?: string | null
          certificate_generated_at?: string | null
        }
        Relationships: []
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

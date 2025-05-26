export interface Order {
  id: string
  name: string
  created_at: string
  total_price: number
  financial_status: string
  customer_id: string
  order_line_items: OrderLineItem[]
}

export interface OrderLineItem {
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
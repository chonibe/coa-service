export interface Order {
  id: string
  name: string
  created_at: string
  financial_status: string
  line_items: OrderLineItem[]
}

export interface OrderLineItem {
  id: string
  line_item_id: string
  product_id: string
  title: string
  quantity: number
  price: string
  total: string
  vendor: string
  image: string
  status: string
  nfc_tag_id?: string
  nfc_claimed_at?: string
  certificate_url?: string
  edition_number?: number
  edition_total?: number
} 
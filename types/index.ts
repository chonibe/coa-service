export interface LineItem {
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
  customer_id: string
} 
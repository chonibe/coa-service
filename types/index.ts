export interface LineItem {
  id: number
  order_id: string
  order_name: string | null
  line_item_id: string
  product_id: string
  variant_id: string | null
  title: string
  sku: string | null
  vendor_name: string | null
  quantity: number
  price: number
  total_discount: number | null
  fulfillment_status: string | null
  status: string
  edition_number: number | null
  edition_total: number | null
  created_at: string
  certificate_generated_at: string | null
} 
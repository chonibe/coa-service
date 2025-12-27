export interface Vendor {
  id: string
  name: string
  paypal_email: string | null
  tax_id: string | null
  tax_country: string | null
  is_company: boolean
}

export interface PendingPayout {
  vendor_name: string
  amount: number
  product_count: number
  paypal_email: string | null
  tax_id: string | null
  tax_country: string | null
  is_company: boolean
  last_payout_date: string | null
}

export interface PendingLineItem {
  line_item_id: string
  order_id: string
  order_name: string
  product_id: string
  product_title: string
  price: number
  created_at: string
  payout_amount: number
  is_percentage: boolean
  fulfillment_status?: string | null
  is_paid?: boolean
  payout_reference?: string | null
  payout_id?: number | null
}

export interface PayoutHistory {
  id: number
  vendor_name: string
  amount: number
  status: string
  payout_date: string
  created_at: string
  reference: string
  product_count: number
  payment_method: string
  invoice_number: string | null
  tax_amount: number
  processed_by: string | null
  payout_batch_id?: string | null
}

export interface RedemptionRequest {
  id: number
  vendorName: string
  amount: number
  currency: string
  reference: string
  productCount: number
  invoiceNumber: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  paypalEmail: string | null
  contactName: string | null
  contactEmail: string | null
}

export interface PayoutPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}


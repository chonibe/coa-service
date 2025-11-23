// Type definitions for vendor product submissions

export type ProductSubmissionStatus = 'pending' | 'approved' | 'rejected' | 'published'

export interface ProductVariant {
  price: string
  sku: string
  compare_at_price?: string | null
  inventory_quantity?: number
  inventory_management?: 'shopify' | null
  requires_shipping?: boolean
  weight?: number | null
  weight_unit?: string | null
  options?: Record<string, string>
}

export interface ProductImage {
  src: string // URL or base64
  alt?: string | null
  position?: number
}

export interface ProductMetafield {
  namespace: string
  key: string
  value: string
  type: string
}

export interface ProductSubmissionData {
  title: string
  description?: string
  product_type?: string
  vendor: string
  handle?: string // Auto-generated if not provided
  tags?: string[]
  variants: ProductVariant[]
  images?: ProductImage[]
  metafields?: ProductMetafield[]
}

export interface VendorProductSubmission {
  id: string
  vendor_id: number
  vendor_name: string
  status: ProductSubmissionStatus
  shopify_product_id?: string | null
  product_data: ProductSubmissionData
  admin_notes?: string | null
  rejection_reason?: string | null
  submitted_at: string
  approved_at?: string | null
  published_at?: string | null
  approved_by?: string | null
  created_at: string
  updated_at: string
}

export interface VendorCollection {
  id: string
  vendor_id: number
  vendor_name: string
  shopify_collection_id?: string | null
  shopify_collection_handle: string
  collection_title: string
  created_at: string
  updated_at: string
}

export interface ShopifyFieldDefinition {
  name: string
  type: string
  required: boolean
  description?: string
  options?: string[]
}

export interface ShopifyMetafieldDefinition {
  namespace: string
  key: string
  name: string
  type: string
  description?: string
  required?: boolean
  options?: string[]
}

export interface ProductCreationFields {
  fields: ShopifyFieldDefinition[]
  metafields: ShopifyMetafieldDefinition[]
  vendor_collections?: VendorCollection[]
}

// Type definitions for vendor product submissions

export type ProductSubmissionStatus = 'pending' | 'approved' | 'rejected' | 'published'

export interface ProductVariant {
  price: string
  sku: string
  barcode?: string | null
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
  mediaType?: 'image' | 'video' // Type of media, defaults to 'image'
  maskSettings?: {
    x?: number // Position X
    y?: number // Position Y
    scale?: number // Scale factor
    rotation?: number // Rotation in degrees
  }
}

export interface ProductMetafield {
  namespace: string
  key: string
  value: string
  type: string
}

export interface PrintFiles {
  pdf_url?: string | null // Uploaded PDF URL
  drive_link?: string | null // Google Drive link
}

export interface ProductBenefit {
  id?: number // Existing benefit ID (for edits)
  benefit_type_id: number
  title: string
  description?: string
  content_url?: string
  access_code?: string
  starts_at?: string | null
  expires_at?: string | null
  is_series_level?: boolean // Whether this benefit applies to series or artwork
  hidden_series_id?: string | null // For "Hidden Series" benefit type - series only accessible via this benefit
  // Circular benefit fields
  vip_artwork_id?: string | null // For VIP Artwork Unlock - artwork from VIP series to unlock
  vip_series_id?: string | null // For VIP Series Unlock - entire VIP series to unlock
  credits_amount?: number | null // For Credits Bonus - amount of credits to grant
  drop_date?: string | null // For Early Drop Access - date when collectors get early access
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
  print_files?: PrintFiles
  series_id?: string | null // Series assignment
  series_name?: string | null // For quick reference
  is_locked?: boolean // Manual lock toggle
  unlock_order?: number | null // For sequential unlocks
  benefits?: ProductBenefit[] // Perks for purchased artworks
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

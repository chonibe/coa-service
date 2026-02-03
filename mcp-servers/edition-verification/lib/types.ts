/**
 * Shared TypeScript types for Edition Ledger MCP Server
 */

export interface ShopifyRefundLineItem {
  line_item_id: string | number;
  quantity?: number;
  restock_type?: string | null;
  restocked?: boolean;
}

export interface ShopifyRefund {
  id: string | number;
  refund_line_items?: ShopifyRefundLineItem[];
}

export interface ShopifyLineItem {
  id: string | number;
  product_id?: string | number;
  variant_id?: string | number;
  title: string;
  quantity: number;
  price: string | number;
  sku?: string;
  vendor?: string;
  fulfillment_status?: string | null;
  fulfillable_quantity?: number | string;
  refunded_quantity?: number;
  refund_status?: string;
  restocked?: boolean;
  restock_type?: string | null;
  properties?: Array<{ name?: string; key?: string; value: any }>;
}

export interface ShopifyOrder {
  id: string | number;
  name: string;
  order_number?: string | number;
  email?: string;
  created_at: string;
  processed_at?: string;
  financial_status: string;
  fulfillment_status?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  closed_at?: string | null;
  tags?: string;
  current_total_price?: string;
  total_price?: string;
  currency?: string;
  customer?: {
    id?: string | number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: any;
  billing_address?: any;
  line_items: ShopifyLineItem[];
  refunds?: ShopifyRefund[];
  status?: string;
}

export interface LineItemStatusResult {
  status: 'active' | 'inactive';
  isRefunded: boolean;
  isRestocked: boolean;
  isRemovedByProperty: boolean;
  isRemovedByQty: boolean;
  isCancelled: boolean;
  isFulfilled: boolean;
  isPaid: boolean;
}

export interface DatabaseLineItem {
  order_id: string;
  order_name: string;
  line_item_id: string;
  product_id: string;
  variant_id: string | null;
  name: string;
  description: string;
  quantity: number;
  price: number;
  sku: string | null;
  vendor_name: string | null;
  fulfillment_status: string | null;
  status: 'active' | 'inactive';
  owner_email: string | null;
  owner_name: string | null;
  img_url: string | null;
  created_at: string;
  updated_at: string;
  restocked: boolean;
  refund_status: string;
}

export interface CollectorEdition {
  id: string;
  lineItemId: string;
  productId: string;
  name: string;
  editionNumber: number | null;
  editionTotal: number | null;
  editionType: 'limited' | 'open' | 'accessory' | null;
  verificationSource: 'supabase' | null;
  imgUrl: string | null;
  vendorName: string;
  series: {
    id: string;
    name: string;
    vendorName: string;
  } | null;
  purchaseDate: string;
  price: number;
  certificateUrl?: string | null;
}

export interface DataIntegrityIssue {
  type: 'refunded_but_active' | 'duplicate_edition' | 'missing_edition' | 'status_mismatch';
  line_item_id?: string;
  product_id?: string;
  edition_number?: number;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Database } from '@/types/supabase';
import OrderDetails from '../OrderDetails';

// Define interfaces for the order structure from Shopify API
interface ShopifyAddress {
  address1: string;
  city: string;
  province_code: string;
  zip: string;
  country_code: string;
  name?: string;
  phone?: string;
}

interface ShopifyCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  default_address?: ShopifyAddress;
}

interface ShopifyLineItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string | null;
  vendor: string | null;
  product_id: number;
  variant_id: number;
  fulfillment_status: string | null; // e.g., null, "fulfilled", "partial"
  // Add other line item properties you need
}

interface ShopifyOrderData {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  currency: string;
  current_total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  discount_codes: Array<{
    code: string;
    amount: string;
    type: string;
  }>;
  total_shipping_price_set: { shop_money: { amount: string } };
  customer: ShopifyCustomer;
  line_items: ShopifyLineItem[];
  shipping_address?: ShopifyAddress;
  billing_address?: ShopifyAddress;
  order_status_url: string;
}

interface ApiResponse {
  order: ShopifyOrderData;
}

interface OrderLineItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  sku: string | null;
  vendor_name: string | null;
  product_id: string;
  variant_id: string | null;
}

interface Order {
  id: string;
  order_number: string;
  processed_at: string;
  financial_status: string;
  fulfillment_status: string;
  total_price: number;
  currency_code: string;
  customer_email: string;
  line_items: OrderLineItem[];
  total_discounts: number;
  subtotal_price: number;
  total_tax: number;
  discount_codes: Array<{
    code: string;
    amount: number;
    type: string;
  }>;
}

interface DatabaseOrderLineItem {
  line_item_id: string;
  title: string;
  quantity: number;
  price: number;
  sku: string | null;
  vendor_name: string | null;
  product_id: string;
  variant_id: string | null;
}

async function getOrderData(orderId: string) {
  // Get order and line items from Supabase only
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {},
        remove(name: string, options: any) {},
      },
    }
  );

  const { data: orderData } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!orderData) {
    console.error('Order not found in Supabase');
    return null;
  }

  // Use Shopify order ID for line items query
  const shopifyOrderId = orderData.raw_shopify_order_data?.id?.toString();
  if (!shopifyOrderId) {
    console.error('No Shopify order ID found in order data');
    return null;
  }

  const { data: lineItems } = await supabase
    .from('order_line_items_v2')
    .select('line_item_id, title, quantity, price, sku, vendor_name, product_id, variant_id, fulfillment_status, status, edition_number, image_url')
    .eq('order_id', shopifyOrderId);

  return {
    id: orderData.id,
    order_number: orderData.order_number,
    processed_at: orderData.processed_at,
    financial_status: orderData.financial_status,
    fulfillment_status: orderData.fulfillment_status || 'pending',
    total_price: orderData.total_price,
    currency_code: orderData.currency_code,
    customer_email: orderData.customer_email,
    total_discounts: orderData.total_discounts || 0,
    subtotal_price: orderData.subtotal_price || 0,
    total_tax: orderData.total_tax || 0,
    discount_codes: orderData.raw_shopify_order_data?.discount_codes?.map((code: { code: string; amount: string; type: string }) => ({
      code: code.code,
      amount: parseFloat(code.amount),
      type: code.type
    })) || [],
    line_items: (lineItems || []).map(item => ({
      id: item.line_item_id,
      title: item.title || '',
      quantity: item.quantity || 1,
      price: item.price || 0,
      sku: item.sku || '',
      vendor_name: item.vendor_name || '',
      product_id: item.product_id || '',
      variant_id: item.variant_id || null,
      fulfillment_status: item.fulfillment_status || 'pending',
      status: item.status || 'active',
      edition_number: item.edition_number ?? null,
      image_url: item.image_url || '',
    }))
  };
}

export default async function OrderDetailsPage({
  params,
}: {
  params: { orderId: string }
}) {
  const { orderId } = await Promise.resolve(params);
  console.log('OrderDetailsPage params:', { orderId });
  
  const order = await getOrderData(orderId);
  console.log('Order data:', order);

  if (!order) {
    console.log('Order not found, redirecting to 404');
    notFound();
  }

  return <OrderDetails order={order} />;
} 
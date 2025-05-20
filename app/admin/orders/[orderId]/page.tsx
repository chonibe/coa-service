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
  sku?: string | null;
  vendor_name: string | null;
  product_id: string;
  variant_id: string | null;
  fulfillment_status?: string;
  status?: string;
  image_url?: string;
  edition_number?: number;
  edition_size?: number;
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
  // First get the order from Supabase to get the Shopify ID and line items
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

  // Get line items from Supabase
  const { data: lineItems } = await supabase
    .from('order_line_items_v2')
    .select('*')
    .eq('order_id', orderId);

  // Fetch product details for all unique product_ids
  const productIds = Array.from(new Set((lineItems || []).map(item => item.product_id).filter(Boolean)));
  let productDetails: Record<string, { sku?: string | null; edition_number?: number; edition_size?: number; image_url?: string }> = {};
  if (productIds.length > 0) {
    // First get basic product details
    const { data: products } = await supabase
      .from('products')
      .select('id, sku, image_url')
      .in('id', productIds);

    // Then get edition counters
    const { data: editionCounters } = await supabase
      .from('product_edition_counters')
      .select('product_id, edition_total')
      .in('product_id', productIds);

    if (products) {
      productDetails = Object.fromEntries(products.map(p => [p.id, {
        sku: p.sku,
        image_url: p.image_url,
        edition_size: editionCounters?.find(ec => ec.product_id === p.id)?.edition_total ? 
          Number.parseInt(editionCounters.find(ec => ec.product_id === p.id)?.edition_total || '0', 10) : 
          undefined
      }]));
    }
  }

  console.log('DEBUG productDetails:', productDetails);
  console.log('DEBUG lineItems before mapping:', lineItems);

  // Try to fetch additional details from Shopify
  try {
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    
    // Use the Shopify ID from the raw data
    const shopifyOrderId = orderData.raw_shopify_order_data?.id;
    if (!shopifyOrderId) {
      console.error('No Shopify ID found in order data');
      return null;
    }

    const res = await fetch(`https://${shop}/admin/api/2023-10/orders/${shopifyOrderId}.json`, {
      headers: {
        'X-Shopify-Access-Token': token!,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const { order: shopifyOrder } = await res.json();
      const mappedLineItems = lineItems?.map(item => ({
        id: item.line_item_id,
        title: item.name,
        quantity: item.quantity || 1,
        price: item.price,
        sku: productDetails[item.product_id]?.sku || null,
        vendor_name: item.vendor_name,
        product_id: item.product_id,
        variant_id: item.variant_id,
        fulfillment_status: item.fulfillment_status || 'pending',
        status: item.status || 'active',
        image_url: productDetails[item.product_id]?.image_url || undefined,
        edition_number: item.edition_number,
        edition_size: productDetails[item.product_id]?.edition_size
      })) || [];
      console.log('DEBUG mappedLineItems:', mappedLineItems);
      return {
        id: shopifyOrder.id.toString(),
        order_number: shopifyOrder.name.replace('#', ''),
        processed_at: shopifyOrder.created_at,
        financial_status: shopifyOrder.financial_status,
        fulfillment_status: shopifyOrder.fulfillment_status || 'pending',
        total_price: parseFloat(shopifyOrder.current_total_price),
        currency_code: shopifyOrder.currency,
        customer_email: shopifyOrder.email,
        total_discounts: parseFloat(shopifyOrder.total_discounts || '0'),
        subtotal_price: parseFloat(shopifyOrder.subtotal_price || '0'),
        total_tax: parseFloat(shopifyOrder.total_tax || '0'),
        discount_codes: shopifyOrder.discount_codes?.map((code: { code: string; amount: string; type: string }) => ({
          code: code.code,
          amount: parseFloat(code.amount),
          type: code.type
        })) || [],
        line_items: mappedLineItems
      };
    }
  } catch (err) {
    console.error('Error fetching order from Shopify:', err);
  }

  // If Shopify fetch fails, return data from Supabase
  const mappedLineItems = lineItems?.map(item => ({
    id: item.line_item_id,
    title: item.name,
    quantity: item.quantity || 1,
    price: item.price,
    sku: productDetails[item.product_id]?.sku || null,
    vendor_name: item.vendor_name,
    product_id: item.product_id,
    variant_id: item.variant_id,
    fulfillment_status: item.fulfillment_status || 'pending',
    status: item.status || 'active',
    image_url: productDetails[item.product_id]?.image_url || undefined,
    edition_number: item.edition_number,
    edition_size: productDetails[item.product_id]?.edition_size
  })) || [];
  console.log('DEBUG mappedLineItems:', mappedLineItems);
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
    line_items: mappedLineItems
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

  console.log('Order line items:', order.line_items);

  return <OrderDetails order={order} />;
} 
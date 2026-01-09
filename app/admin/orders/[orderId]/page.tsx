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
    customer_profile?: any;
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

  // Fetch comprehensive profile for the customer email
  const { data: profileData } = await supabase
    .from('collector_profile_comprehensive')
    .select('*')
    .ilike('user_email', orderData.customer_email)
    .maybeSingle();

  // Fetch line items without join
  const { data: lineItems, error: lineItemsError } = await supabase
    .from("order_line_items_v2")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (lineItemsError) {
    console.error("Error fetching line items:", lineItemsError);
    throw new Error("Failed to fetch line items");
  }

  // Collect unique product IDs (as bigint)
  const productIds = Array.from(new Set((lineItems || []).map(item => item.product_id).filter(Boolean)));
  let productDetails: Record<string, { sku?: string | null; edition_number?: number; edition_size?: number; image_url?: string; name?: string }> = {};
  if (productIds.length > 0) {
    // Fetch product details using the correct field (shopify_id or id as bigint)
    const { data: products } = await supabase
      .from('products')
      .select('shopify_id, product_id, sku, image_url, name')
      .in('shopify_id', productIds);

    // Fetch edition counters if needed
    const { data: editionCounters } = await supabase
      .from('product_edition_counters')
      .select('product_id, edition_total')
      .in('product_id', productIds);

    if (products) {
      productDetails = Object.fromEntries(products.map(p => [p.shopify_id, {
        sku: p.sku,
        image_url: p.image_url,
        name: p.name || null,
        edition_size: editionCounters?.find(ec => ec.product_id === p.shopify_id)?.edition_total ? 
          Number.parseInt(editionCounters.find(ec => ec.product_id === p.shopify_id)?.edition_total || '0', 10) : 
          undefined
      }]));
    }
  }

  // Merge product data into line items
  const mappedLineItems = lineItems?.map(item => ({
    ...item,
    sku: productDetails[item.product_id]?.sku || null,
    image_url: productDetails[item.product_id]?.image_url || null,
    product_name: productDetails[item.product_id]?.name || item.name || 'Unknown Product',
  })) || [];

  console.log('DEBUG productDetails:', productDetails);
  console.log('DEBUG lineItems before mapping:', lineItems);

  // Try to fetch additional details from Shopify ONLY if it's a Shopify order
  const shopifyOrderId = orderData.raw_shopify_order_data?.id;
  const orderName = orderData.order_name || '';
  const isWhNumber = orderName.startsWith('#9') || orderName.startsWith('9');
  
  if (shopifyOrderId && !orderId.startsWith('WH-') && !isWhNumber) {
    try {
      const shop = process.env.SHOPIFY_SHOP;
      const token = process.env.SHOPIFY_ACCESS_TOKEN;
      
      const res = await fetch(`https://${shop}/admin/api/2023-10/orders/${shopifyOrderId}.json`, {
        headers: {
          'X-Shopify-Access-Token': token!,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const { order: shopifyOrder } = await res.json();
        
        // Use database line items as the base (since they now include warehouse-only items)
        // but ensure we have all Shopify items too.
        const shopifyLineItems = shopifyOrder.line_items || [];
        
        const finalLineItems = mappedLineItems.map(item => {
          const sMatch = shopifyLineItems.find((sli: ShopifyLineItem) => sli.id.toString() === item.line_item_id);
          
          return {
            ...item,
            id: item.line_item_id || item.id.toString(),
            title: item.name,
            fulfillment_status: sMatch?.fulfillment_status || item.fulfillment_status || 'pending',
            price: item.price || (sMatch ? parseFloat(sMatch.price) : 0),
            quantity: item.quantity || (sMatch ? sMatch.quantity : 1),
            image_url: item.img_url || item.image_url || (sMatch ? productDetails[sMatch.product_id.toString()]?.image_url : null),
            edition_size: productDetails[item.product_id]?.edition_size
          };
        });

        // Add any Shopify items that are missing from our database (sync failure safety)
        shopifyLineItems.forEach((sli: ShopifyLineItem) => {
          if (!finalLineItems.some(fli => fli.id === sli.id.toString())) {
            finalLineItems.push({
              id: sli.id.toString(),
              line_item_id: sli.id.toString(),
              title: sli.title,
              product_name: sli.title,
              quantity: sli.quantity,
              price: parseFloat(sli.price),
              sku: sli.sku || null,
              vendor_name: sli.vendor,
              product_id: sli.product_id.toString(),
              variant_id: sli.variant_id?.toString() || null,
              fulfillment_status: sli.fulfillment_status || 'pending',
              status: 'active',
              image_url: productDetails[sli.product_id.toString()]?.image_url || null,
              edition_number: undefined,
              edition_size: productDetails[sli.product_id.toString()]?.edition_size
            });
          }
        });
        
        return {
          id: shopifyOrder.id.toString(),
          order_number: shopifyOrder.name.replace('#', ''),
          source: 'shopify',
          processed_at: shopifyOrder.created_at,
          financial_status: shopifyOrder.financial_status,
          fulfillment_status: shopifyOrder.fulfillment_status || 'pending',
          total_price: parseFloat(shopifyOrder.current_total_price),
          currency_code: shopifyOrder.currency,
          customer_email: shopifyOrder.email,
          customer_profile: profileData,
          total_discounts: parseFloat(shopifyOrder.total_discounts || '0'),
          subtotal_price: parseFloat(shopifyOrder.subtotal_price || '0'),
          total_tax: parseFloat(shopifyOrder.total_tax || '0'),
          discount_codes: shopifyOrder.discount_codes?.map((code: { code: string; amount: string; type: string }) => ({
            code: code.code,
            amount: parseFloat(code.amount),
            type: code.type,
          })) || [],
          line_items: finalLineItems,
          kickstarter_backing_amount_gbp: orderData.kickstarter_backing_amount_gbp,
          kickstarter_backing_amount_usd: orderData.kickstarter_backing_amount_usd,
        };
      }
    } catch (err) {
      console.error('Error fetching order from Shopify:', err);
    }
  }

  // For Manual Warehouse orders or failed Shopify fetch, return data from Supabase
  return {
    id: orderData.id,
    order_number: orderData.order_number?.toString() || orderData.order_name?.replace('#', '') || 'Manual',
    source: isWhNumber || orderId.startsWith('WH-') ? 'warehouse_made' : 'shopify',
    processed_at: orderData.processed_at || orderData.created_at,
    financial_status: orderData.financial_status || 'paid',
    fulfillment_status: orderData.fulfillment_status || 'fulfilled',
    total_price: orderData.total_price || 0,
    currency_code: orderData.currency_code || 'USD',
    customer_email: orderData.customer_email,
    customer_profile: profileData,
    total_discounts: orderData.total_discounts || 0,
    subtotal_price: orderData.subtotal_price || 0,
    total_tax: orderData.total_tax || 0,
    kickstarter_backing_amount_gbp: orderData.kickstarter_backing_amount_gbp,
    kickstarter_backing_amount_usd: orderData.kickstarter_backing_amount_usd,
    discount_codes: orderData.raw_shopify_order_data?.discount_codes?.map((code: { code: string; amount: string; type: string }) => ({
      code: code.code,
      amount: parseFloat(code.amount),
      type: code.type
    })) || [],
    line_items: mappedLineItems.map(item => ({
      ...item,
      id: item.line_item_id || item.id.toString(),
      title: item.name,
      image_url: item.img_url || item.image_url,
      edition_size: productDetails[item.product_id]?.edition_size
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

  console.log('Order line items:', order.line_items);

  return <OrderDetails order={order} />;
} 
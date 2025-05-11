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
  name: string; // e.g., #1001
  email: string; // Customer email
  created_at: string;
  updated_at: string;
  financial_status: string; // e.g., "paid", "pending", "refunded"
  fulfillment_status: string | null; // e.g., null, "fulfilled", "partial", "unfulfilled"
  currency: string;
  current_total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_shipping_price_set: { shop_money: { amount: string } };
  customer: ShopifyCustomer;
  line_items: ShopifyLineItem[];
  shipping_address?: ShopifyAddress;
  billing_address?: ShopifyAddress;
  // Add other order properties you need
  order_status_url: string; // Link to Shopify order status page
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
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Server components can't set cookies
          },
          remove(name: string, options: any) {
            // Server components can't remove cookies
          },
        },
      }
    );

    console.log('Fetching order:', orderId);

    // First, check if the order exists
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return null;
    }

    if (!orderData) {
      console.log('Order not found:', orderId);
      return null;
    }

    // Then fetch the line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('order_line_items')
      .select('*')
      .eq('order_id', orderId);

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError);
      return null;
    }

    // Transform the data to match our Order interface
    const order: Order = {
      id: orderData.id,
      order_number: orderData.order_number,
      processed_at: orderData.processed_at,
      financial_status: orderData.financial_status,
      fulfillment_status: orderData.fulfillment_status || 'pending',
      total_price: orderData.total_price,
      currency_code: orderData.currency_code,
      customer_email: orderData.customer_email,
      line_items: lineItems?.map(item => ({
        id: item.line_item_id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        sku: item.sku,
        vendor_name: item.vendor_name,
        product_id: item.product_id,
        variant_id: item.variant_id
      })) || []
    };

    console.log('Transformed order data:', order);
    return order;
  } catch (error) {
    console.error('Error in getOrderData:', error);
    return null;
  }
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
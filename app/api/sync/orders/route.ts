import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

interface ShopifyLineItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
  sku: string | null;
  vendor: string | null;
  product_id: number | null;
  variant_id: number | null;
}

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  processed_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  currency: string;
  created_at: string;
  updated_at: string;
  line_items: ShopifyLineItem[];
}

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    // Get Shopify access token from environment
    const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const shopifyShopDomain = process.env.SHOPIFY_SHOP_DOMAIN;

    if (!shopifyAccessToken || !shopifyShopDomain) {
      return NextResponse.json(
        { error: 'Shopify credentials not configured' },
        { status: 500 }
      );
    }

    // Fetch orders from Shopify
    const response = await fetch(
      `https://${shopifyShopDomain}/admin/api/2024-01/orders.json?status=any&limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    const orders = data.orders as ShopifyOrder[];
    let syncedOrders = 0;
    let syncedLineItems = 0;

    // Process each order
    for (const order of orders) {
      try {
        // Upsert order
        const { error: orderError } = await supabase
          .from('orders')
          .upsert({
            id: order.id.toString(),
            order_number: order.name.replace('#', ''),
            processed_at: order.processed_at,
            financial_status: order.financial_status,
            fulfillment_status: order.fulfillment_status || 'pending',
            total_price: parseFloat(order.total_price),
            currency_code: order.currency,
            customer_email: order.email,
            created_at: order.created_at,
            updated_at: order.updated_at,
          });

        if (orderError) {
          console.error('Error upserting order:', orderError);
          continue;
        }

        syncedOrders++;

        // Delete existing line items for this order
        const { error: deleteError } = await supabase
          .from('order_line_items')
          .delete()
          .eq('order_id', order.id.toString());

        if (deleteError) {
          console.error('Error deleting existing line items:', deleteError);
          continue;
        }

        // Insert new line items
        if (order.line_items && order.line_items.length > 0) {
          const lineItems = order.line_items.map(item => ({
            order_id: order.id.toString(),
            order_name: order.name,
            line_item_id: item.id.toString(),
            product_id: item.product_id?.toString() || '',
            variant_id: item.variant_id?.toString() || null,
            title: item.title,
            quantity: item.quantity,
            price: parseFloat(item.price),
            sku: item.sku || null,
            vendor_name: item.vendor || null,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { error: lineItemsError } = await supabase
            .from('order_line_items')
            .insert(lineItems);

          if (lineItemsError) {
            console.error('Error inserting line items:', lineItemsError);
          } else {
            syncedLineItems += lineItems.length;
          }
        }
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${syncedOrders} orders and ${syncedLineItems} line items` 
    });

  } catch (error) {
    console.error('Error syncing orders:', error);
    return NextResponse.json(
      { error: 'Failed to sync orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
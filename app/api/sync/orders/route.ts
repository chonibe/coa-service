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
  fulfillment_status: string | null;
  total_discount: string;
}

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Fetch orders from Shopify
    const shop = process.env.SHOPIFY_SHOP;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!shop || !token) {
      return NextResponse.json({ error: 'Shopify credentials not set' }, { status: 500 });
    }

    const response = await fetch(
      `https://${shop}/admin/api/2023-10/orders.json?status=any&limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const { orders } = await response.json();
    let syncedOrders = 0;
    let syncedLineItems = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        // Prepare order data
        const orderData = {
          id: order.id.toString(),
          order_number: order.name.replace('#', ''),
          processed_at: order.created_at,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status || 'pending',
          total_price: parseFloat(order.current_total_price),
          currency_code: order.currency,
          customer_email: order.email,
          raw_shopify_order_data: order,
          updated_at: new Date().toISOString(),
        };

        // Upsert order
        const { error: orderError } = await supabase
          .from('orders')
          .upsert(orderData, { onConflict: 'id' });

        if (orderError) {
          console.error('Error upserting order:', orderError);
          errors++;
          continue;
        }

        syncedOrders++;

        // Handle line items
        if (order.line_items && order.line_items.length > 0) {
          // First, delete existing line items for this order
          await supabase
            .from('order_line_items')
            .delete()
            .eq('order_id', order.id.toString());

          // Then insert new line items
          const lineItems = order.line_items.map((item: ShopifyLineItem) => ({
            order_id: order.id.toString(),
            order_name: order.name,
            line_item_id: item.id.toString(),
            product_id: item.product_id?.toString() || null,
            variant_id: item.variant_id?.toString() || null,
            title: item.title,
            quantity: item.quantity,
            price: parseFloat(item.price),
            sku: item.sku || null,
            vendor_name: item.vendor || null,
            fulfillment_status: item.fulfillment_status,
            total_discount: parseFloat(item.total_discount || '0'),
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { error: lineItemsError } = await supabase
            .from('order_line_items')
            .insert(lineItems);

          if (lineItemsError) {
            console.error('Error inserting line items:', lineItemsError);
            errors++;
          } else {
            syncedLineItems += lineItems.length;
          }
        }
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${syncedOrders} orders and ${syncedLineItems} line items`,
      stats: {
        totalOrders: orders.length,
        syncedOrders,
        syncedLineItems,
        errors
      }
    });

  } catch (error) {
    console.error('Error syncing orders:', error);
    return NextResponse.json(
      { error: 'Failed to sync orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
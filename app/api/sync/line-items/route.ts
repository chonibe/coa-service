import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@/lib/supabase/server';
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

interface ShopifyOrder {
  id: string;
  name: string;
  created_at: string;
  line_items: ShopifyLineItem[];
}

interface OrderWithData {
  id: string;
  raw_shopify_order_data: ShopifyOrder;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const supabase = createClient()
  
  try {
    console.log('Starting line items sync...');
    
    // Create a Supabase client with service role
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let allOrders: OrderWithData[] = [];
    let page = 0;
    const pageSize = 100;
    let hasMore = true;

    // Fetch all orders with pagination
    while (hasMore) {
      console.log(`Fetching orders page ${page + 1}...`);
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, raw_shopify_order_data')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .returns<OrderWithData[]>();

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return NextResponse.json(
          { error: 'Failed to fetch orders', details: ordersError },
          { status: 500 }
        );
      }

      if (!orders || orders.length === 0) {
        hasMore = false;
      } else {
        allOrders = [...allOrders, ...orders];
        page++;
      }
    }

    console.log(`Found total of ${allOrders.length} orders to process`);

    let syncedLineItems = 0;
    let errors = 0;

    // Process each order
    for (const order of allOrders) {
      try {
        console.log(`Processing order ${order.id}...`);
        
        if (!order.raw_shopify_order_data?.line_items) {
          console.log(`No line items found for order ${order.id}`);
          continue;
        }

        console.log(`Found ${order.raw_shopify_order_data.line_items.length} line items for order ${order.id}`);

        // First, delete existing line items for this order in the new table
        console.log(`Deleting existing line items for order ${order.id}...`);
        const { error: deleteError } = await supabase
          .from('order_line_items_v2')
          .delete()
          .eq('order_id', order.id);

        if (deleteError) {
          console.error(`Error deleting existing line items for order ${order.id}:`, deleteError);
        }

        // Then insert new line items
        const lineItems = order.raw_shopify_order_data.line_items.map((item: ShopifyLineItem) => {
          console.log(`Mapping line item ${item.id} for order ${order.id}`);
          return {
            order_id: order.id,
            order_name: order.raw_shopify_order_data.name,
            line_item_id: item.id.toString(),
            product_id: item.product_id?.toString() || '',
            variant_id: item.variant_id?.toString() || null,
            name: item.title,
            description: item.title,
            price: parseFloat(item.price),
            vendor_name: item.vendor || null,
            fulfillment_status: item.fulfillment_status,
            status: 'active',
            created_at: new Date(order.raw_shopify_order_data.created_at).toISOString(),
            updated_at: new Date().toISOString()
          };
        });

        console.log(`Inserting ${lineItems.length} line items for order ${order.id}...`);
        const { error: lineItemsError, data: insertedItems } = await supabase
          .from('order_line_items_v2')
          .insert(lineItems)
          .select();

        if (lineItemsError) {
          console.error(`Error inserting line items for order ${order.id}:`, lineItemsError);
          errors++;
        } else {
          console.log(`Successfully inserted ${lineItems.length} line items for order ${order.id}`);
          syncedLineItems += lineItems.length;
        }
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        errors++;
      }
    }

    console.log('Sync completed. Summary:', {
      totalOrders: allOrders.length,
      syncedLineItems,
      errors
    });

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${syncedLineItems} line items from ${allOrders.length} orders`,
      stats: {
        totalOrders: allOrders.length,
        syncedLineItems,
        errors
      }
    });

  } catch (error) {
    console.error('Error syncing line items:', error);
    return NextResponse.json(
      { error: 'Failed to sync line items', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
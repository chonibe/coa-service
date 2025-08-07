import { createClient } from '@/lib/supabase/server';
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
    console.log('Starting new line items sync...');
    
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

    // Get the latest synced order timestamp
    const { data: latestSyncedOrder } = await supabase
      .from('order_line_items_v2')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastSyncTime = latestSyncedOrder?.[0]?.created_at || '1970-01-01T00:00:00Z';
    console.log(`Last sync time: ${lastSyncTime}`);

    // Get new orders since last sync
    const { data: newOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, raw_shopify_order_data')
      .gt('created_at', lastSyncTime)
      .returns<OrderWithData[]>();

    if (ordersError) {
      console.error('Error fetching new orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch new orders', details: ordersError },
        { status: 500 }
      );
    }

    console.log(`Found ${newOrders?.length || 0} new orders to process`);

    let syncedLineItems = 0;
    let errors = 0;

    // Process each new order
    for (const order of newOrders || []) {
      try {
        console.log(`Processing new order ${order.id}...`);
        
        if (!order.raw_shopify_order_data?.line_items) {
          console.log(`No line items found for order ${order.id}`);
          continue;
        }

        console.log(`Found ${order.raw_shopify_order_data.line_items.length} line items for order ${order.id}`);

        // Delete any existing line items for this order (in case of partial sync)
        console.log(`Deleting existing line items for order ${order.id}...`);
        const { error: deleteError } = await supabase
          .from('order_line_items_v2')
          .delete()
          .eq('order_id', order.id);

        if (deleteError) {
          console.error(`Error deleting existing line items for order ${order.id}:`, deleteError);
        }

        // Insert new line items
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

        // Get product image URLs
        const productIds = lineItems.map(item => item.product_id).filter(Boolean);
        const { data: products } = await supabase
          .from('products')
          .select('product_id, image_url')
          .in('product_id', productIds);

        const productImageMap = new Map(
          products?.map(p => [p.product_id, p.image_url]) || []
        );

        // Add image URLs to line items
        const lineItemsWithImages = lineItems.map(item => ({
          ...item,
          img_url: productImageMap.get(item.product_id) || null
        }));

        console.log(`Inserting ${lineItemsWithImages.length} line items for order ${order.id}...`);
        const { error: insertError } = await supabase
          .from('order_line_items_v2')
          .insert(lineItemsWithImages);

        if (insertError) {
          console.error(`Error inserting line items for order ${order.id}:`, insertError);
          errors++;
        } else {
          console.log(`Successfully inserted ${lineItemsWithImages.length} line items for order ${order.id}`);
          syncedLineItems += lineItemsWithImages.length;
        }
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        errors++;
      }
    }

    console.log('Sync completed. Summary:', {
      totalNewOrders: newOrders?.length || 0,
      syncedLineItems,
      errors
    });

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${syncedLineItems} line items from ${newOrders?.length || 0} new orders`,
      stats: {
        totalNewOrders: newOrders?.length || 0,
        syncedLineItems,
        errors
      }
    });

  } catch (error) {
    console.error('Error syncing new line items:', error);
    return NextResponse.json(
      { error: 'Failed to sync new line items', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
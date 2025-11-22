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
    const productIdsToResequence = new Set<string>();

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

        // Check for restocked items from refund data
        const restockedLineItemIds = new Set<number>();
        if (order.raw_shopify_order_data.refunds && Array.isArray(order.raw_shopify_order_data.refunds)) {
          order.raw_shopify_order_data.refunds.forEach((refund: any) => {
            if (refund.refund_line_items && Array.isArray(refund.refund_line_items)) {
              refund.refund_line_items.forEach((refundItem: any) => {
                if (refundItem.restock === true) {
                  restockedLineItemIds.add(refundItem.line_item_id);
                }
              });
            }
          });
        }

        // Then insert new line items
        const orderFinancialStatus = order.raw_shopify_order_data?.financial_status || 'pending';
        const lineItems = order.raw_shopify_order_data.line_items.map((item: ShopifyLineItem) => {
          console.log(`Mapping line item ${item.id} for order ${order.id}`);
          const isRestocked = restockedLineItemIds.has(item.id);
          const isCancelled = orderFinancialStatus === 'voided';
          const isFulfilled = item.fulfillment_status === 'fulfilled';
          const isOrderPaid = ['paid', 'authorized', 'pending', 'partially_paid'].includes(orderFinancialStatus);
          
          // Determine status:
          // - inactive if restocked or cancelled
          // - active if order is paid/in-progress (even if not fulfilled yet)
          // - active if fulfilled
          const status = (isRestocked || isCancelled) ? 'inactive' : (isOrderPaid || isFulfilled ? 'active' : 'inactive');
          
          // Edition numbers will be assigned by assign_edition_numbers function for all active items
          // Set to undefined so it gets assigned, or null if restocked/cancelled
          const shouldClearEdition = isRestocked || isCancelled;
          
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
            restocked: isRestocked,
            status: status,
            edition_number: shouldClearEdition ? null : undefined, // Will be assigned by assign_edition_numbers for active items
            edition_total: shouldClearEdition ? null : undefined, // Will be set by assign_edition_numbers
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
          
          // Collect product IDs that have active items for edition number assignment
          // Also collect products that had restocked items (need resequencing)
            // Collect product IDs for edition number assignment
            // Assign edition numbers to all active items (not just fulfilled ones)
            // This ensures edition numbers are visible even for in-progress orders
            lineItems.forEach((item: any) => {
              if (item.status === 'active' && item.product_id) {
                productIdsToResequence.add(item.product_id);
              }
              // If item was restocked, we need to resequence the product
              if (item.restocked && item.product_id) {
                productIdsToResequence.add(item.product_id);
              }
            });
        }
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        errors++;
      }
    }

    // Assign edition numbers for all products with active items
    let editionAssignmentErrors = 0;
    let editionAssignments = 0;
    
    if (productIdsToResequence.size > 0) {
      console.log(`Assigning edition numbers for ${productIdsToResequence.size} products...`);
      
      for (const productId of productIdsToResequence) {
        try {
          const { data, error: assignError } = await supabase
            .rpc('assign_edition_numbers', { p_product_id: productId });
          
          if (assignError) {
            console.error(`Error assigning edition numbers for product ${productId}:`, assignError);
            editionAssignmentErrors++;
          } else {
            console.log(`Assigned ${data} edition numbers for product ${productId}`);
            editionAssignments++;
          }
        } catch (error) {
          console.error(`Error in edition assignment for product ${productId}:`, error);
          editionAssignmentErrors++;
        }
      }
    }

    console.log('Sync completed. Summary:', {
      totalOrders: allOrders.length,
      syncedLineItems,
      errors,
      productsWithEditionsAssigned: editionAssignments,
      editionAssignmentErrors
    });

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${syncedLineItems} line items from ${allOrders.length} orders. Assigned edition numbers for ${editionAssignments} products.`,
      stats: {
        totalOrders: allOrders.length,
        syncedLineItems,
        errors,
        productsWithEditionsAssigned: editionAssignments,
        editionAssignmentErrors
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
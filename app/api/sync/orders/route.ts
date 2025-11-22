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
    const productIdsToResequence = new Set<string>();

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
          // Check for restocked items from refund data
          const restockedLineItemIds = new Set<number>();
          if (order.refunds && Array.isArray(order.refunds)) {
            order.refunds.forEach((refund: any) => {
              if (refund.refund_line_items && Array.isArray(refund.refund_line_items)) {
                refund.refund_line_items.forEach((refundItem: any) => {
                  if (refundItem.restock === true) {
                    restockedLineItemIds.add(refundItem.line_item_id);
                  }
                });
              }
            });
          }

          // First, delete existing line items for this order
          await supabase
            .from('order_line_items_v2')
            .delete()
            .eq('order_id', order.id.toString());

          // Then insert new line items
          const lineItems = order.line_items.map((item: ShopifyLineItem) => {
            const isRestocked = restockedLineItemIds.has(item.id);
            const isCancelled = order.financial_status === 'voided';
            const isFulfilled = item.fulfillment_status === 'fulfilled';
            const isOrderPaid = ['paid', 'authorized', 'pending', 'partially_paid'].includes(order.financial_status);
            
            // Determine status:
            // - inactive if restocked or cancelled
            // - active if order is paid/in-progress (even if not fulfilled yet)
            // - active if fulfilled
            const status = (isRestocked || isCancelled) ? 'inactive' : (isOrderPaid || isFulfilled ? 'active' : 'inactive');
            
            // Edition numbers will be assigned by assign_edition_numbers function for all active items
            // Set to undefined so it gets assigned, or null if restocked/cancelled
            const shouldClearEdition = isRestocked || isCancelled;
            
            return {
              order_id: order.id.toString(),
              order_name: order.name,
              line_item_id: item.id.toString(),
              product_id: item.product_id?.toString() || '',
              variant_id: item.variant_id?.toString() || null,
              name: item.title,
              description: item.title,
              quantity: item.quantity,
              price: parseFloat(item.price),
              sku: item.sku || null,
              vendor_name: item.vendor || null,
              fulfillment_status: item.fulfillment_status,
              restocked: isRestocked,
              status: status,
              edition_number: shouldClearEdition ? null : undefined, // Will be assigned by assign_edition_numbers for active items
              edition_total: shouldClearEdition ? null : undefined, // Will be set by assign_edition_numbers
              created_at: new Date(order.created_at).toISOString(),
              updated_at: new Date().toISOString(),
            };
          });

          const { error: lineItemsError } = await supabase
            .from('order_line_items_v2')
            .insert(lineItems);

          if (lineItemsError) {
            console.error('Error inserting line items:', lineItemsError);
            errors++;
          } else {
            syncedLineItems += lineItems.length;
            
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

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${syncedOrders} orders and ${syncedLineItems} line items. Assigned edition numbers for ${editionAssignments} products.`,
      stats: {
        totalOrders: orders.length,
        syncedOrders,
        syncedLineItems,
        errors,
        productsWithEditionsAssigned: editionAssignments,
        editionAssignmentErrors
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
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

    let allOrders: ShopifyOrder[] = [];
    let hasNextPage = true;
    let pageInfo: string | null = null;
    let pageCount = 0;
    const maxPages = 200; // Safety limit

    // Fetch all orders using pagination
    while (hasNextPage && pageCount < maxPages) {
      pageCount++;
      
      // Build URL - only include status=any on first page, not with page_info
      let url = `https://${shopifyShopDomain}/admin/api/2024-01/orders.json?limit=250`;
      if (pageInfo) {
        url += `&page_info=${pageInfo}`;
      } else {
        url += `&status=any`; // Only include status on first page
      }

      console.log(`[sync-all-orders] Fetching page ${pageCount}: ${url}`);

      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[sync-all-orders] Shopify API error (${response.status}):`, errorText);
        throw new Error(`Shopify API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const orders = data.orders as ShopifyOrder[];
      allOrders = [...allOrders, ...orders];
      console.log(`[sync-all-orders] Fetched ${orders.length} orders (total: ${allOrders.length})`);

      // Check if there are more pages
      const linkHeader = response.headers.get('Link');
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextPageMatch = linkHeader.match(/<([^>]+)>; rel="next"/);
        if (nextPageMatch) {
          // Extract page_info from the URL
          const nextUrl = nextPageMatch[1];
          const pageInfoMatch = nextUrl.match(/page_info=([^&]+)/);
          pageInfo = pageInfoMatch ? decodeURIComponent(pageInfoMatch[1]) : null;
          hasNextPage = !!pageInfo;
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }
    }

    console.log(`[sync-all-orders] Total orders fetched: ${allOrders.length}`);

    let syncedOrders = 0;
    let syncedLineItems = 0;
    let errors = 0;
    const productIdsToResequence = new Set<string>();

    // Process each order
    for (const order of allOrders) {
      try {
        // Upsert order - ensure we have all required fields
        const orderData: any = {
          id: order.id.toString(),
          order_number: order.name.replace('#', ''),
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status || 'pending',
          total_price: parseFloat(order.total_price || '0'),
          currency_code: order.currency || 'USD',
          customer_email: order.email || null,
          updated_at: new Date().toISOString(),
        };

        // Use processed_at if available, otherwise use created_at
        if (order.processed_at) {
          orderData.processed_at = order.processed_at;
        } else if (order.created_at) {
          orderData.processed_at = order.created_at;
        } else {
          orderData.processed_at = new Date().toISOString();
        }

        // Use created_at if available
        if (order.created_at) {
          orderData.created_at = order.created_at;
        } else {
          orderData.created_at = orderData.processed_at;
        }

        const { error: orderError } = await supabase
          .from('orders')
          .upsert(orderData, { onConflict: 'id' });

        if (orderError) {
          console.error('Error upserting order:', orderError);
          errors++;
          continue;
        }

        syncedOrders++;

        // Delete existing line items for this order
        const { error: deleteError } = await supabase
          .from('order_line_items_v2')
          .delete()
          .eq('order_id', order.id.toString());

        if (deleteError) {
          console.error('Error deleting existing line items:', deleteError);
          errors++;
          continue;
        }

        // Insert new line items
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

          const lineItems = order.line_items.map(item => {
            const isRestocked = Boolean(restockedLineItemIds.has(item.id));
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
              fulfillment_status: item.fulfillment_status || null,
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
            
            // Collect product IDs that have active items for edition number assignment
            // Also collect products that had restocked items (need resequencing)
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

    // Log products with active items (edition numbers auto-assigned by triggers)
    if (productIdsToResequence.size > 0) {
      console.log(`Synced active items for ${productIdsToResequence.size} products. Edition numbers will be auto-assigned by triggers.`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${syncedOrders} orders and ${syncedLineItems} line items. Edition numbers will be auto-assigned by triggers.`,
      stats: {
        totalOrders: allOrders.length,
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
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!shop || !token) {
    return NextResponse.json({ error: 'Shopify credentials not set' }, { status: 500 });
  }

  try {
    // Fetch order from Shopify
    const res = await fetch(`https://${shop}/admin/api/2023-10/orders/${orderId}.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch order from Shopify' }, { status: 500 });
    }
    const { order: shopifyOrder } = await res.json();

    // Update Supabase
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get existing line items to preserve their status
    const { data: existingLineItems, error: fetchError } = await supabase
      .from('order_line_items_v2')
      .select('line_item_id, status, edition_number')
      .eq('order_id', shopifyOrder.id.toString());

    if (fetchError) {
      console.error('Error fetching existing line items:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch existing line items' }, { status: 500 });
    }

    // Create maps for quick lookup of existing statuses and edition numbers
    const existingStatuses = new Map(
      existingLineItems?.map(item => [item.line_item_id, item.status]) || []
    );
    const existingEditionNumbers = new Map(
      existingLineItems?.map(item => [item.line_item_id, item.edition_number]) || []
    );

    console.log('Existing statuses:', Object.fromEntries(existingStatuses));
    console.log('Existing edition numbers:', Object.fromEntries(existingEditionNumbers));

    const orderUpdate = {
      id: shopifyOrder.id.toString(),
      order_number: shopifyOrder.name.replace('#', ''),
      processed_at: shopifyOrder.created_at,
      financial_status: shopifyOrder.financial_status,
      fulfillment_status: shopifyOrder.fulfillment_status || 'pending',
      total_price: parseFloat(shopifyOrder.current_total_price),
      currency_code: shopifyOrder.currency,
      customer_email: shopifyOrder.email,
      raw_shopify_order_data: shopifyOrder,
      updated_at: new Date().toISOString(),
    };

    // Prepare line items with preserved statuses
    const lineItems = shopifyOrder.line_items.map((item: any) => {
      const lineItemId = item.id.toString();
      const existingStatus = existingStatuses.get(lineItemId);
      const existingEditionNumber = existingEditionNumbers.get(lineItemId);

      console.log(`Processing line item ${lineItemId}:`, {
        existingStatus,
        existingEditionNumber,
        willUseStatus: existingStatus || 'active'
      });

      return {
        order_id: shopifyOrder.id.toString(),
        order_name: shopifyOrder.name,
        line_item_id: lineItemId,
        product_id: item.product_id?.toString() || '',
        variant_id: item.variant_id?.toString() || null,
        title: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        sku: item.sku || null,
        vendor_name: item.vendor || null,
        status: existingStatus || 'active', // Preserve existing status or default to active
        edition_number: existingEditionNumber, // Preserve existing edition number
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
    });

    // Upsert order
    const { error: orderError } = await supabase.from('orders').upsert(orderUpdate, { onConflict: 'id' });
    if (orderError) {
      console.error('Error upserting order:', orderError);
      return NextResponse.json({ error: 'Failed to upsert order', details: orderError.message }, { status: 500 });
    }

    // Upsert line items one by one to ensure status preservation
    for (const item of lineItems) {
      const { error: upsertError } = await supabase
        .from('order_line_items_v2')
        .upsert(item, { 
          onConflict: 'order_id,line_item_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error(`Error upserting line item ${item.line_item_id}:`, upsertError);
        return NextResponse.json({ 
          error: 'Failed to upsert line items', 
          details: upsertError.message,
          failedItem: item.line_item_id
        }, { status: 500 });
      }
    }

    // Get final state to verify
    const { data: finalLineItems, error: verifyError } = await supabase
      .from('order_line_items_v2')
      .select('line_item_id, status, edition_number')
      .eq('order_id', shopifyOrder.id.toString());

    if (verifyError) {
      console.error('Error verifying final state:', verifyError);
    } else {
      console.log('Final line item states:', finalLineItems);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Order refreshed successfully with status preservation',
      lineItemsCount: lineItems.length
    });
  } catch (error: any) {
    console.error('Error in order refresh:', error);
    return NextResponse.json({ error: 'Unexpected error', details: error.message }, { status: 500 });
  }
} 
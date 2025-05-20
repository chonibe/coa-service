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
      return NextResponse.json({ error: 'Failed to upsert order', details: orderError.message }, { status: 500 });
    }

    // Delete old line items for this order
    const { error: deleteError } = await supabase
      .from('order_line_items_v2')
      .delete()
      .eq('order_id', shopifyOrder.id.toString());

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete old line items', details: deleteError.message }, { status: 500 });
    }

    // Insert new line items
    const { error: lineItemsError } = await supabase
      .from('order_line_items_v2')
      .insert(lineItems);

    if (lineItemsError) {
      return NextResponse.json({ error: 'Failed to insert line items', details: lineItemsError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in order refresh:', error);
    return NextResponse.json({ error: 'Unexpected error', details: error.message }, { status: 500 });
  }
} 
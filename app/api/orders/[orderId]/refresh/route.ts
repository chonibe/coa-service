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

    // Prepare order and line items for Supabase
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
    const lineItems = shopifyOrder.line_items.map((item: any) => ({
      order_id: shopifyOrder.id.toString(),
      order_name: shopifyOrder.name,
      line_item_id: item.id.toString(),
      product_id: item.product_id?.toString() || '',
      variant_id: item.variant_id?.toString() || null,
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price),
      sku: item.sku || null,
      vendor_name: item.vendor || null,
      status: 'active',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }));

    // Update Supabase
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    // Upsert order
    const { error: orderError } = await supabase.from('orders').upsert(orderUpdate, { onConflict: 'id' });
    if (orderError) {
      return NextResponse.json({ error: 'Failed to upsert order', details: orderError.message }, { status: 500 });
    }
    // Delete old line items for this order
    await supabase.from('order_line_items').delete().eq('order_id', shopifyOrder.id.toString());
    // Insert new line items
    const { error: lineItemsError } = await supabase.from('order_line_items').insert(lineItems);
    if (lineItemsError) {
      return NextResponse.json({ error: 'Failed to insert line items', details: lineItemsError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Unexpected error', details: error.message }, { status: 500 });
  }
} 
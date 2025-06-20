import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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
  id: string;
  name: string;
  created_at: string;
  processed_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  currency: string;
  email: string;
  line_items: ShopifyLineItem[];
}

interface ExistingLineItem {
  line_item_id: string;
  status: string;
  edition_number: number | null;
  edition_total: number | null;
  nfc_tag_id: string | null;
  certificate_url: string | null;
  certificate_token: string | null;
  nfc_claimed_at: string | null;
}

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
    const { order: shopifyOrder } = await res.json() as { order: ShopifyOrder };

    // Update Supabase
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get existing line items to preserve their status
    const { data: existingLineItems, error: fetchError } = await supabase
      .from('order_line_items_v2')
      .select('line_item_id, status, edition_number, edition_total, nfc_tag_id, certificate_url, certificate_token, nfc_claimed_at')
      .eq('order_id', shopifyOrder.id.toString());

    if (fetchError) {
      console.error('Error fetching existing line items:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch existing line items' }, { status: 500 });
    }

    // Create maps for quick lookup of existing statuses and edition numbers
    const existingItems = new Map(
      existingLineItems?.map(item => [item.line_item_id, item]) || []
    );

    console.log('Existing statuses:', Object.fromEntries(existingItems));

    // Get product data for img_urls
    const productIds = shopifyOrder.line_items
      .map((item) => item.product_id)
      .filter((id): id is number => id !== null);

    const { data: products } = await supabase
      .from("products")
      .select("id, img_url")
      .in("id", productIds);

    const productMap = new Map(
      products?.map((p) => [p.id.toString(), p.img_url]) || []
    );

    // Map line items, preserving existing statuses and edition numbers
    const lineItems = shopifyOrder.line_items.map((item) => {
      const existingItem = existingItems.get(item.id.toString());

      console.log(`Processing line item ${item.id} for order ${shopifyOrder.id}`);
      console.log(`Existing status: ${existingItem?.status || 'none'}`);
      console.log(`Existing edition number: ${existingItem?.edition_number || 'none'}`);

      return {
        order_id: shopifyOrder.id.toString(),
        order_name: shopifyOrder.name,
        line_item_id: item.id.toString(),
        product_id: item.product_id?.toString() || '',
        variant_id: item.variant_id?.toString() || null,
        name: item.title,
        description: item.title,
        price: parseFloat(item.price),
        quantity: item.quantity,
        sku: item.sku || null,
        vendor_name: item.vendor || null,
        fulfillment_status: item.fulfillment_status,
        status: existingItem?.status || 'active',
        edition_number: existingItem?.edition_number || null,
        edition_total: existingItem?.edition_total || null,
        created_at: new Date(shopifyOrder.created_at).toISOString(),
        updated_at: new Date().toISOString(),
        nfc_tag_id: existingItem?.nfc_tag_id || null,
        certificate_url: existingItem?.certificate_url || null,
        certificate_token: existingItem?.certificate_token || null,
        nfc_claimed_at: existingItem?.nfc_claimed_at || null,
        img_url: item.product_id ? productMap.get(item.product_id.toString()) || null : null
      };
    });

    // Upsert order
    const orderUpdate = {
      id: shopifyOrder.id.toString(),
      order_number: shopifyOrder.name.replace('#', ''),
      processed_at: shopifyOrder.processed_at,
      financial_status: shopifyOrder.financial_status,
      fulfillment_status: shopifyOrder.fulfillment_status || 'pending',
      total_price: parseFloat(shopifyOrder.total_price),
      currency_code: shopifyOrder.currency,
      customer_email: shopifyOrder.email,
      created_at: shopifyOrder.created_at,
      updated_at: new Date().toISOString(),
    };

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
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { syncShopifyOrder } from '@/lib/shopify/order-sync-utils';

export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (!shop || !token) {
    return NextResponse.json({ error: 'Shopify credentials not set' }, { status: 500 });
  }

  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Fetch the full order from Shopify
    const res = await fetch(`https://${shop}/admin/api/2023-10/orders/${orderId}.json?status=any`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Failed to fetch from Shopify: ${res.status}`, details: errorText }, { status: 500 });
    }

    const { order: shopifyOrder } = await res.json();

    if (!shopifyOrder) {
      return NextResponse.json({ error: 'Order not found on Shopify' }, { status: 404 });
    }

    // Use shared utility for a clean sync
    const syncRes = await syncShopifyOrder(supabase, shopifyOrder, { forceWarehouseSync: true });

    if (syncRes.success) {
      return NextResponse.json({ 
        success: true,
        message: 'Order refreshed successfully',
        details: syncRes.results
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: syncRes.error 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in order refresh:', error);
    return NextResponse.json({ error: 'Unexpected error', details: error.message }, { status: 500 });
  }
}

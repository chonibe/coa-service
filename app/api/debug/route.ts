import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    // Check orders table
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      return NextResponse.json({ 
        error: 'Error fetching order',
        details: orderError
      }, { status: 500 });
    }

    // Check order_line_items table
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('order_line_items')
      .select('*')
      .eq('order_id', orderId);

    if (lineItemsError) {
      return NextResponse.json({ 
        error: 'Error fetching line items',
        details: lineItemsError
      }, { status: 500 });
    }

    // Get table schemas
    const { data: ordersSchema, error: ordersSchemaError } = await supabase
      .from('orders')
      .select('*')
      .limit(0);

    const { data: lineItemsSchema, error: lineItemsSchemaError } = await supabase
      .from('order_line_items')
      .select('*')
      .limit(0);

    return NextResponse.json({
      order,
      lineItems,
      schemas: {
        orders: ordersSchemaError ? null : Object.keys(ordersSchema?.[0] || {}),
        lineItems: lineItemsSchemaError ? null : Object.keys(lineItemsSchema?.[0] || {})
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });
    // Get orders table schema
    const { data: ordersSchema, error: ordersSchemaError } = await supabase
      .from('orders')
      .select('*')
      .limit(0);
    if (ordersSchemaError) {
      return NextResponse.json({ 
        error: 'Error fetching orders schema',
        details: ordersSchemaError
      }, { status: 500 });
    }
    // Get order_line_items table schema
    const { data: lineItemsSchema, error: lineItemsSchemaError } = await supabase
      .from('order_line_items')
      .select('*')
      .limit(0);
    if (lineItemsSchemaError) {
      return NextResponse.json({ 
        error: 'Error fetching line items schema',
        details: lineItemsSchemaError
      }, { status: 500 });
    }
    // Get sample data
    const { data: sampleOrders, error: sampleOrdersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    if (sampleOrdersError) {
      return NextResponse.json({ 
        error: 'Error fetching sample orders',
        details: sampleOrdersError
      }, { status: 500 });
    }
    const { data: sampleLineItems, error: sampleLineItemsError } = await supabase
      .from('order_line_items')
      .select('*')
      .limit(5);
    if (sampleLineItemsError) {
      return NextResponse.json({ 
        error: 'Error fetching sample line items',
        details: sampleLineItemsError
      }, { status: 500 });
    }
    return NextResponse.json({
      schemas: {
        orders: ordersSchema ? Object.keys(ordersSchema[0] || {}) : [],
        lineItems: lineItemsSchema ? Object.keys(lineItemsSchema[0] || {}) : []
      },
      sampleData: {
        orders: sampleOrders,
        lineItems: sampleLineItems
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
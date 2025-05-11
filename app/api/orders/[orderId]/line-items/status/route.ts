import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { itemIds, status } = await request.json();
    console.log('Received request:', { itemIds, status, orderId: params.orderId });

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      console.error('Invalid itemIds:', itemIds);
      return NextResponse.json(
        { error: 'Invalid itemIds provided' },
        { status: 400 }
      );
    }

    if (!status || !['active', 'cancelled'].includes(status)) {
      console.error('Invalid status:', status);
      return NextResponse.json(
        { error: 'Invalid status provided' },
        { status: 400 }
      );
    }

    // First verify the items exist and belong to the order
    const { data: existingItems, error: fetchError } = await supabase
      .from('order_line_items_v2')
      .select('id')
      .in('id', itemIds)
      .eq('order_id', params.orderId);

    if (fetchError) {
      console.error('Error fetching items:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify items' },
        { status: 500 }
      );
    }

    if (!existingItems || existingItems.length !== itemIds.length) {
      console.error('Items not found or do not belong to order:', { 
        requested: itemIds, 
        found: existingItems 
      });
      return NextResponse.json(
        { error: 'One or more items not found or do not belong to this order' },
        { status: 404 }
      );
    }

    // Update the line items in Supabase
    const { error: updateError } = await supabase
      .from('order_line_items_v2')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .in('id', itemIds)
      .eq('order_id', params.orderId);

    if (updateError) {
      console.error('Error updating line items:', updateError);
      return NextResponse.json(
        { error: 'Failed to update line items' },
        { status: 500 }
      );
    }

    console.log('Successfully updated items:', { itemIds, status });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in line items status update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
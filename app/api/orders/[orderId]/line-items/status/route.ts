import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_STATUSES = ['active', 'inactive', 'removed'] as const;
type Status = typeof VALID_STATUSES[number];

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { itemIds, status } = await request.json();

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing itemIds' },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + VALID_STATUSES.join(', ') },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Update the status for all specified items
    const { error: updateError } = await supabase
      .from('order_line_items_v2')
      .update({ status })
      .in('id', itemIds)
      .eq('order_id', params.orderId);

    if (updateError) {
      console.error('Error updating line items:', updateError);
      return NextResponse.json(
        { error: 'Failed to update line items' },
        { status: 500 }
      );
    }

    // If status is 'removed', resequence edition numbers
    if (status === 'removed') {
      const { data: activeItems, error: fetchError } = await supabase
        .from('order_line_items_v2')
        .select('id, edition_number')
        .eq('order_id', params.orderId)
        .eq('status', 'active')
        .order('edition_number', { ascending: true });

      if (fetchError) {
        console.error('Error fetching active items:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch active items for resequencing' },
          { status: 500 }
        );
      }

      // Update edition numbers sequentially
      for (let i = 0; i < activeItems.length; i++) {
        const { error: resequenceError } = await supabase
          .from('order_line_items_v2')
          .update({ edition_number: i + 1 })
          .eq('id', activeItems[i].id);

        if (resequenceError) {
          console.error('Error resequencing edition numbers:', resequenceError);
          return NextResponse.json(
            { error: 'Failed to resequence edition numbers' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in line items status update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
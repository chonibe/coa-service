import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resequenceEditionNumbers } from "@/lib/resequence-edition-numbers";
import type { Database } from "@/types/supabase";

const VALID_STATUSES = ['active', 'inactive'] as const;
type Status = typeof VALID_STATUSES[number];

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { itemIds, status } = await request.json();

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'itemIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status as Status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Update the status for all specified items
    const { error: updateError } = await supabase
      .from('order_line_items_v2')
      .update({ 
        status,
        // Reset edition numbers and edition total if becoming inactive
        edition_number: status === 'inactive' ? null : undefined,
        edition_total: status === 'inactive' ? null : undefined,
        updated_at: new Date().toISOString()
      })
      .in('id', itemIds)
      .eq('order_id', params.orderId);

    if (updateError) {
      console.error('Error updating line items status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update line items status' },
        { status: 500 }
      );
    }

    // If items are becoming active, resequence edition numbers
    if (status === 'active') {
      const { error: resequenceError } = await resequenceEditionNumbers(supabase, params.orderId);
      if (resequenceError) {
        console.error('Error resequencing edition numbers:', resequenceError);
        return NextResponse.json(
          { error: 'Failed to resequence edition numbers' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in line-items/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
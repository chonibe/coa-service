import { NextResponse } from 'next/server';
import { supabase } from '/dev/null';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentOrderId = searchParams.get('orderId');

  if (!currentOrderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    // Get the current order's processed_at timestamp
    const { data: currentOrder, error: currentError } = await supabase
      .from('orders')
      .select('processed_at')
      .eq('id', currentOrderId)
      .single();

    if (currentError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get the previous order (processed before current order)
    const { data: prevOrder } = await supabase
      .from('orders')
      .select('id')
      .lt('processed_at', currentOrder.processed_at)
      .order('processed_at', { ascending: false })
      .limit(1)
      .single();

    // Get the next order (processed after current order)
    const { data: nextOrder } = await supabase
      .from('orders')
      .select('id')
      .gt('processed_at', currentOrder.processed_at)
      .order('processed_at', { ascending: true })
      .limit(1)
      .single();

    return NextResponse.json({
      prevOrderId: prevOrder?.id || null,
      nextOrderId: nextOrder?.id || null
    });
  } catch (error) {
    console.error('Error fetching order navigation:', error);
    return NextResponse.json({ error: 'Failed to fetch order navigation' }, { status: 500 });
  }
} 
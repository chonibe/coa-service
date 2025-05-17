import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function resequenceEditionNumbers(productId: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  if (!supabase) {
    throw new Error('Failed to initialize Supabase client');
  }

  // Get all active line items for this product
  const { data: lineItems, error: fetchError } = await supabase
    .from('order_line_items_v2')
    .select('id')
    .eq('product_id', productId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (fetchError) {
    throw fetchError;
  }

  if (!lineItems || lineItems.length === 0) {
    return;
  }

  // Update edition numbers sequentially
  for (let i = 0; i < lineItems.length; i++) {
    const { error: updateError } = await supabase
      .from('order_line_items_v2')
      .update({ edition_number: i + 1 })
      .eq('id', lineItems[i].id);

    if (updateError) {
      throw updateError;
    }
  }
} 
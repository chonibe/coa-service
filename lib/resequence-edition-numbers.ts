import { SupabaseClient } from '@supabase/supabase-js';

export async function resequenceEditionNumbers(
  supabase: SupabaseClient,
  orderId: string
) {
  try {
    // Get all active line items for the order
    const { data: lineItems, error: fetchError } = await supabase
      .from('order_line_items')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (fetchError) {
      return { error: fetchError };
    }

    if (!lineItems || lineItems.length === 0) {
      return { error: null };
    }

    // Get the total number of editions for each product
    const productIds = [...new Set(lineItems.map(item => item.product_id))];
    const { data: productEditions, error: editionsError } = await supabase
      .from('order_line_items')
      .select('product_id, count(*)')
      .in('product_id', productIds)
      .eq('status', 'active')
      .group_by('product_id');

    if (editionsError) {
      return { error: editionsError };
    }

    const editionTotals = new Map(
      productEditions?.map(p => [p.product_id, parseInt(p.count)]) || []
    );

    // Resequence edition numbers and update edition totals
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      const newEditionNumber = i + 1;
      const editionTotal = editionTotals.get(item.product_id) || null;

      if (item.edition_number !== newEditionNumber || item.edition_total !== editionTotal) {
        const { error: updateError } = await supabase
          .from('order_line_items')
          .update({
            edition_number: newEditionNumber,
            edition_total: editionTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (updateError) {
          return { error: updateError };
        }
      }
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
} 
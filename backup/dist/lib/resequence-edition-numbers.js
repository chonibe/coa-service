"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resequenceEditionNumbers = resequenceEditionNumbers;
async function resequenceEditionNumbers(supabase, orderId) {
    try {
        // Get all active line items for the order
        const { data: lineItems, error: fetchError } = await supabase
            .from('order_line_items_v2')
            .select('*')
            .eq('order_id', orderId)
            .eq('status', 'active')
            .order('edition_number', { ascending: true });
        if (fetchError) {
            return { error: fetchError };
        }
        // Resequence edition numbers
        for (let i = 0; i < lineItems.length; i++) {
            const newEditionNumber = i + 1;
            if (lineItems[i].edition_number !== newEditionNumber) {
                const { error: updateError } = await supabase
                    .from('order_line_items_v2')
                    .update({ edition_number: newEditionNumber })
                    .eq('id', lineItems[i].id);
                if (updateError) {
                    return { error: updateError };
                }
            }
        }
        return { error: null };
    }
    catch (error) {
        return { error };
    }
}

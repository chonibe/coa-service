/**
 * ============================================================================
 * CRITICAL MODULE - Line Item Status Determination
 * ============================================================================
 *
 * This module contains THE SINGLE SOURCE OF TRUTH for determining if a line
 * item should be active or inactive.
 *
 * KEY RULES:
 * 1. Line items must be 'inactive' if refunded, restocked, or never fulfilled
 * 2. Use STRING comparison for line_item_id (not number)
 * 3. Check fulfillable_quantity=0 AND fulfillment_status=null means REMOVED
 * 4. Always use this function - NEVER duplicate this logic elsewhere
 * ============================================================================
 */
/**
 * Determines the status of a line item based on order and line item data
 *
 * @param order - The Shopify order containing the line item
 * @param lineItem - The specific line item to evaluate
 * @returns LineItemStatusResult with status and all relevant flags
 */
export function determineLineItemStatus(order, lineItem) {
    const liIdStr = lineItem.id.toString();
    // Build set of refunded line item IDs using STRING comparison
    const removedLineItemIds = new Set();
    if (order.refunds && Array.isArray(order.refunds)) {
        order.refunds.forEach((refund) => {
            refund.refund_line_items?.forEach((ri) => {
                // CRITICAL: Store as string for consistent comparison
                removedLineItemIds.add(ri.line_item_id.toString());
            });
        });
    }
    // Find refund entry for this specific line item
    const refundEntry = order.refunds?.flatMap((r) => r.refund_line_items || [])
        .find((ri) => ri.line_item_id.toString() === liIdStr);
    // REFUND DETECTION
    const isRefunded = removedLineItemIds.has(liIdStr) ||
        lineItem.refund_status === 'refunded' ||
        refundEntry !== undefined ||
        (lineItem.refunded_quantity && lineItem.refunded_quantity > 0);
    // RESTOCK DETECTION
    const isRestocked = Boolean(lineItem.restocked === true ||
        (lineItem.restock_type && lineItem.restock_type !== null) ||
        lineItem.fulfillment_status === 'restocked' ||
        (refundEntry?.restock_type && refundEntry?.restock_type !== undefined));
    // REMOVED BY PROPERTY
    const removedProperty = lineItem.properties?.find((p) => (p.name === 'removed' || p.key === 'removed') &&
        (p.value === 'true' || p.value === true));
    const isRemovedByProperty = removedProperty !== undefined;
    // REMOVED BY QUANTITY
    // If fulfillable_quantity is 0 and it hasn't been fulfilled, it was removed
    const isRemovedByQty = (lineItem.fulfillable_quantity === 0 || lineItem.fulfillable_quantity === '0') &&
        lineItem.fulfillment_status !== 'fulfilled';
    // CANCELLED ORDER
    const isCancelled = order.financial_status === 'voided' ||
        order.cancelled_at !== null ||
        order.fulfillment_status === 'canceled';
    // FULFILLMENT STATUS
    const isFulfilled = lineItem.fulfillment_status === 'fulfilled';
    // PAYMENT STATUS
    const isPaid = ['paid', 'authorized', 'pending', 'partially_paid'].includes(order.financial_status);
    // FINAL STATUS DETERMINATION
    const isInactive = isRefunded || isRemovedByProperty || isRemovedByQty || isCancelled || isRestocked;
    const status = isInactive ? 'inactive' : (isPaid || isFulfilled ? 'active' : 'inactive');
    return {
        status,
        isRefunded: Boolean(isRefunded),
        isRestocked: Boolean(isRestocked),
        isRemovedByProperty: Boolean(isRemovedByProperty),
        isRemovedByQty: Boolean(isRemovedByQty),
        isCancelled: Boolean(isCancelled),
        isFulfilled: Boolean(isFulfilled),
        isPaid: Boolean(isPaid),
    };
}
/**
 * Builds a Set of refunded line item IDs from an order's refunds
 * CRITICAL: Returns Set<string> for consistent string comparison
 */
export function getRefundedLineItemIds(order) {
    const refundedIds = new Set();
    if (order.refunds && Array.isArray(order.refunds)) {
        order.refunds.forEach((refund) => {
            refund.refund_line_items?.forEach((ri) => {
                refundedIds.add(ri.line_item_id.toString());
            });
        });
    }
    return refundedIds;
}
/**
 * Checks if an order itself is cancelled/voided
 */
export function isOrderCancelled(order) {
    return (['restocked', 'canceled'].includes(order.fulfillment_status || '') ||
        ['refunded', 'voided'].includes(order.financial_status) ||
        order.cancelled_at !== null);
}

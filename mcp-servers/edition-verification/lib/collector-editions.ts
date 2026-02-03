import type { CollectorEdition } from './types.js';

/**
 * ============================================================================
 * CRITICAL MODULE - Collector Editions Filtering
 * ============================================================================
 * 
 * This module contains THE SINGLE SOURCE OF TRUTH for filtering line items
 * to determine which editions should be displayed to collectors.
 * 
 * KEY RULES:
 * 1. Only show items with status='active'
 * 2. Exclude restocked items (restocked=true)
 * 3. Exclude items with refund_status not 'none' or null
 * 4. Exclude items from canceled/voided orders
 * 5. Deduplicate by line_item_id AND product_id+edition_number
 * ============================================================================
 */

interface OrderWithLineItems {
  id: string;
  order_name?: string;
  order_number?: string;
  processed_at: string;
  fulfillment_status?: string;
  financial_status?: string;
  order_line_items_v2?: any[];
}

interface LineItemWithOrder extends Record<string, any> {
  line_item_id: string;
  product_id?: string;
  edition_number?: number | null;
  status: string;
  restocked?: boolean;
  refund_status?: string;
  fulfillment_status?: string | null;
  order_processed_at?: string;
  order_fulfillment_status?: string;
  order_financial_status?: string;
}

/**
 * Deduplicates orders by order name, prioritizing non-cancelled orders
 */
export function deduplicateOrders(orders: OrderWithLineItems[]): OrderWithLineItems[] {
  const orderMap = new Map<string, OrderWithLineItems>();
  
  orders.forEach(order => {
    // Extract numeric portion of order name for deduplication
    const match = order.order_name?.replace('#', '').match(/^\d+/);
    const cleanName = match ? match[0] : (order.order_name?.toLowerCase() || order.id);
    
    const existing = orderMap.get(cleanName);
    const isManual = order.id.startsWith('WH-');
    
    // Check if this order is canceled/voided
    const isCanceled = 
      ['restocked', 'canceled'].includes(order.fulfillment_status || '') || 
      ['refunded', 'voided'].includes(order.financial_status || '');
    
    const existingIsCanceled = existing ? 
      (['restocked', 'canceled'].includes(existing.fulfillment_status || '') || 
       ['refunded', 'voided'].includes(existing.financial_status || '')) : true;
    
    // Decision logic:
    // 1. If no existing order, take this one
    // 2. If this one is NOT canceled but existing IS, replace it
    // 3. If both have same cancellation status, prefer Shopify over Manual
    if (!existing) {
      orderMap.set(cleanName, order);
    } else if (!isCanceled && existingIsCanceled) {
      orderMap.set(cleanName, order);
    } else if (isCanceled === existingIsCanceled) {
      const existingIsManual = existing.id.startsWith('WH-');
      if (existingIsManual && !isManual) {
        orderMap.set(cleanName, order);
      }
    }
  });
  
  return Array.from(orderMap.values());
}

/**
 * Deduplicates line items by line_item_id AND product_id+edition_number
 */
export function deduplicateLineItems(
  orders: OrderWithLineItems[]
): LineItemWithOrder[] {
  const lineItemMap = new Map<string, LineItemWithOrder>();
  const productEditionMap = new Map<string, LineItemWithOrder>();
  
  orders.forEach((order) => {
    (order.order_line_items_v2 || []).forEach((li: any) => {
      const lineItemWithOrder: LineItemWithOrder = {
        ...li,
        order_processed_at: order.processed_at,
        order_fulfillment_status: order.fulfillment_status,
        order_financial_status: order.financial_status,
      };
      
      // Primary deduplication by line_item_id
      if (!lineItemMap.has(li.line_item_id)) {
        lineItemMap.set(li.line_item_id, lineItemWithOrder);
      } else {
        const existing = lineItemMap.get(li.line_item_id)!;
        if (new Date(order.processed_at) > new Date(existing.order_processed_at || 0)) {
          lineItemMap.set(li.line_item_id, lineItemWithOrder);
        }
      }
      
      // Secondary deduplication by product_id + edition_number
      if (li.product_id && li.edition_number) {
        const productEditionKey = `${li.product_id}-${li.edition_number}`;
        
        if (!productEditionMap.has(productEditionKey)) {
          productEditionMap.set(productEditionKey, lineItemWithOrder);
        } else {
          const existing = productEditionMap.get(productEditionKey)!;
          if (new Date(order.processed_at) > new Date(existing.order_processed_at || 0)) {
            // Remove old line_item_id from lineItemMap
            lineItemMap.delete(existing.line_item_id);
            productEditionMap.set(productEditionKey, lineItemWithOrder);
          } else {
            // Remove current line_item_id (it's a duplicate)
            lineItemMap.delete(li.line_item_id);
          }
        }
      }
    });
  });
  
  return Array.from(lineItemMap.values());
}

/**
 * Filters line items to only include active, valid editions
 * 
 * CRITICAL FILTER LOGIC:
 * - Must have status='active'
 * - Must NOT be restocked
 * - Must have refund_status='none' or null
 * - Must be from valid order (not canceled/voided)
 */
export function filterActiveEditions(lineItems: LineItemWithOrder[]): LineItemWithOrder[] {
  return lineItems.filter((li) => {
    // Check order validity
    const isValidOrder = 
      !['restocked', 'canceled'].includes(li.order_fulfillment_status || '') && 
      !['refunded', 'voided'].includes(li.order_financial_status || '');
    
    // Check line item is actually active
    const isActuallyActive = 
      li.status === 'active' && 
      li.restocked !== true && 
      (li.refund_status === 'none' || li.refund_status === null);
    
    // Check fulfillment validity
    // Allow fulfilled, partial, or null (for digital/accessory items)
    const isFulfillmentValid = 
      li.fulfillment_status === 'fulfilled' || 
      li.fulfillment_status === 'partial' ||
      li.fulfillment_status === null;
    
    return isActuallyActive && isValidOrder && isFulfillmentValid;
  });
}

/**
 * Complete pipeline to get filtered collector editions from orders
 */
export function getFilteredCollectorEditions(orders: OrderWithLineItems[]): LineItemWithOrder[] {
  // Step 1: Deduplicate orders
  const deduplicatedOrders = deduplicateOrders(orders);
  
  // Step 2: Deduplicate line items
  const deduplicatedLineItems = deduplicateLineItems(deduplicatedOrders);
  
  // Step 3: Filter to only active editions
  const activeEditions = filterActiveEditions(deduplicatedLineItems);
  
  return activeEditions;
}

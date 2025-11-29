import { createClient } from '@/lib/supabase/server';
import { depositCreditsFromPurchase } from './credit-deposit';
import { depositPayoutEarnings } from './payout-deposit';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Process credit deposits for fulfilled line items
 * Called when fulfillment_status changes to 'fulfilled'
 * 
 * @param lineItemId - Line item ID that was fulfilled
 * @param supabase - Supabase client (optional, will create if not provided)
 */
export async function processFulfillmentCredits(
  lineItemId: string,
  supabase?: SupabaseClient<any>
): Promise<void> {
  const client = supabase || createClient();

  try {
    // Get line item details
    const { data: lineItem, error: lineItemError } = await client
      .from('order_line_items_v2')
      .select('order_id, line_item_id, price, fulfillment_status, order_id')
      .eq('line_item_id', lineItemId)
      .single();

    if (lineItemError || !lineItem) {
      console.error(`Error fetching line item ${lineItemId}:`, lineItemError);
      return;
    }

    // Only process if fulfilled
    if (lineItem.fulfillment_status !== 'fulfilled') {
      return;
    }

    // Get order details to find customer
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id, customer_id, account_number, customer_email')
      .eq('id', lineItem.order_id)
      .single();

    if (orderError || !order) {
      console.error(`Error fetching order ${lineItem.order_id}:`, orderError);
      return;
    }

    // Determine collector identifier (account_number or customer_id)
    const collectorIdentifier = order.account_number || order.customer_id?.toString() || null;

    if (!collectorIdentifier) {
      console.log(`No collector identifier found for order ${lineItem.order_id}`);
      return;
    }

    // Check if vendor is also the collector (vendor purchasing artwork)
    let vendorId: number | undefined;
    let accountType: 'customer' | 'vendor' = 'customer';

    // Check if this customer is also a vendor by email
    if (order.customer_email) {
      const { data: vendor } = await client
        .from('vendors')
        .select('id, vendor_name')
        .eq('contact_email', order.customer_email)
        .maybeSingle();

      if (vendor) {
        vendorId = vendor.id;
        accountType = 'vendor';
      }
    }

    // Deposit credits for the collector (customer or vendor as collector)
    const result = await depositCreditsFromPurchase(
      collectorIdentifier,
      lineItem.order_id,
      lineItem.line_item_id,
      Number(lineItem.price) || 0,
      accountType,
      vendorId
    );

    if (result.success) {
      console.log(
        `Deposited ${result.creditsDeposited} credits for line item ${lineItemId} (collector: ${collectorIdentifier})`
      );
    } else {
      console.error(
        `Failed to deposit credits for line item ${lineItemId}:`,
        result.error
      );
    }

    // Also deposit USD payout earnings if this line item belongs to a vendor
    const { data: lineItemWithVendor } = await client
      .from('order_line_items_v2')
      .select('vendor_name, price')
      .eq('line_item_id', lineItemId)
      .single();

    if (lineItemWithVendor?.vendor_name) {
      const payoutResult = await depositPayoutEarnings(
        lineItemId,
        lineItem.order_id,
        lineItemWithVendor.vendor_name,
        Number(lineItemWithVendor.price) || 0,
        client
      );

      if (payoutResult.success) {
        console.log(
          `Deposited $${payoutResult.usdDeposited} payout earnings for line item ${lineItemId} (vendor: ${lineItemWithVendor.vendor_name})`
        );
      } else {
        console.error(
          `Failed to deposit payout earnings for line item ${lineItemId}:`,
          payoutResult.error
        );
      }
    }
  } catch (error: any) {
    console.error(`Error processing fulfillment credits for ${lineItemId}:`, error);
  }
}

/**
 * Process credit deposits for all newly fulfilled line items in an order
 * Called when order fulfillment status changes
 */
export async function processOrderFulfillmentCredits(
  orderId: string,
  supabase?: SupabaseClient<any>
): Promise<void> {
  const client = supabase || createClient();

  try {
    // Get all fulfilled line items for this order that haven't been credited yet
    const { data: lineItems, error } = await client
      .from('order_line_items_v2')
      .select('line_item_id, price, fulfillment_status')
      .eq('order_id', orderId)
      .eq('fulfillment_status', 'fulfilled');

    if (error) {
      console.error(`Error fetching fulfilled line items for order ${orderId}:`, error);
      return;
    }

    if (!lineItems || lineItems.length === 0) {
      return;
    }

    // Process each fulfilled line item
    for (const lineItem of lineItems) {
      await processFulfillmentCredits(lineItem.line_item_id, client);
    }
  } catch (error: any) {
    console.error(`Error processing order fulfillment credits for ${orderId}:`, error);
  }
}


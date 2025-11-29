import { createClient } from '@/lib/supabase/server';
import type { PayoutDepositResult } from './types';
import { ensureCollectorAccount } from './account-manager';
import { calculateLineItemPayout } from '@/lib/payout-calculator';
import { convertGBPToUSD } from '@/lib/utils';

const DEFAULT_PAYOUT_PERCENTAGE = 25;

/**
 * Deposit USD payout when a line item is fulfilled
 * This creates a ledger entry with transaction_type='payout_earned' and currency='USD'
 */
export async function depositPayoutEarnings(
  lineItemId: string,
  orderId: string,
  vendorName: string,
  lineItemPrice: number,
  supabase?: ReturnType<typeof createClient>
): Promise<PayoutDepositResult> {
  const client = supabase || createClient();

  try {
    // Get vendor info to find collector identifier
    const { data: vendor, error: vendorError } = await client
      .from('vendors')
      .select('id, auth_id, vendor_name')
      .eq('vendor_name', vendorName)
      .single();

    if (vendorError || !vendor) {
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: `Vendor not found: ${vendorName}`,
      };
    }

    // Use auth_id as collector identifier (as established in the banking system)
    const collectorIdentifier = vendor.auth_id || vendorName;
    if (!collectorIdentifier) {
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: 'Vendor does not have an auth_id',
      };
    }

    // Ensure collector account exists
    await ensureCollectorAccount(collectorIdentifier, 'vendor', vendor.id);

    // Check if payout already deposited for this line item (prevent duplicates)
    const { data: existingEntry, error: checkError } = await client
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('line_item_id', lineItemId)
      .eq('transaction_type', 'payout_earned')
      .eq('currency', 'USD')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing payout deposit:', checkError);
    }

    if (existingEntry) {
      // Already deposited, return existing balance
      const { data: balanceData } = await client.rpc('get_collector_usd_balance', {
        p_collector_identifier: collectorIdentifier,
      });
      return {
        success: true,
        ledgerEntryId: existingEntry.id,
        usdDeposited: 0,
        newUsdBalance: Math.max(0, Number(balanceData) || 0),
        error: 'Payout already deposited for this line item',
      };
    }

    // Get line item and order currency
    const { data: lineItem } = await client
      .from('order_line_items_v2')
      .select('product_id, price, order_id')
      .eq('line_item_id', lineItemId)
      .single();

    if (!lineItem) {
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: `Line item not found: ${lineItemId}`,
      };
    }

    // Get order with currency and raw Shopify data to extract original price
    const { data: order } = await client
      .from('orders')
      .select('currency_code, raw_shopify_order_data')
      .eq('id', lineItem.order_id || orderId)
      .single();

    const orderCurrency = order?.currency_code || 'USD';
    const isGBP = orderCurrency.toUpperCase() === 'GBP';

    // Get the original price (before discount) from Shopify order data
    // Vendors should be paid based on full price, not discounted price
    let originalPrice = Number(lineItemPrice) || Number(lineItem.price) || 0;
    
    // Try to extract original price from Shopify order data
    if (order?.raw_shopify_order_data?.line_items) {
      const shopifyLineItem = order.raw_shopify_order_data.line_items.find(
        (item: any) => item.id.toString() === lineItemId
      );
      
      if (shopifyLineItem) {
        // Use original_price if available (price before any discounts)
        if (shopifyLineItem.original_price) {
          originalPrice = parseFloat(shopifyLineItem.original_price);
        } else if (shopifyLineItem.discount_allocations && shopifyLineItem.discount_allocations.length > 0) {
          // Calculate original price by adding back discounts
          const totalDiscount = shopifyLineItem.discount_allocations.reduce(
            (sum: number, disc: any) => sum + parseFloat(disc.amount || '0'), 
            0
          );
          originalPrice = parseFloat(shopifyLineItem.price || '0') + totalDiscount;
        } else {
          // If no discounts, use the price as-is
          originalPrice = parseFloat(shopifyLineItem.price || '0');
        }
      }
    }

    // Get payout setting for this product
    const { data: payoutSetting } = await client
      .from('product_vendor_payouts')
      .select('payout_amount, is_percentage')
      .eq('product_id', lineItem.product_id)
      .eq('vendor_name', vendorName)
      .maybeSingle();

    // Convert to USD only if order currency is GBP
    let priceForCalculation = originalPrice;
    if (isGBP) {
      priceForCalculation = convertGBPToUSD(originalPrice);
    }
    
    // Calculate payout amount using the original price (before discount)
    const payoutAmount = calculateLineItemPayout({
      price: priceForCalculation,
      payout_amount: payoutSetting?.payout_amount ?? null,
      is_percentage: payoutSetting?.is_percentage ?? null,
    });

    if (payoutAmount <= 0) {
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: 'Payout amount is zero or negative',
      };
    }

    // Create ledger entry for payout deposit
    const { data: ledgerEntry, error: ledgerError } = await client
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: collectorIdentifier,
        transaction_type: 'payout_earned',
        amount: payoutAmount,
        currency: 'USD',
        order_id: orderId,
        line_item_id: lineItemId,
        description: `Payout earnings from fulfilled order ${orderId}`,
        metadata: {
          vendor_name: vendorName,
          product_id: lineItem.product_id,
          line_item_price: Number(lineItemPrice) || Number(lineItem.price) || 0,
          payout_setting: payoutSetting ? {
            payout_amount: payoutSetting.payout_amount,
            is_percentage: payoutSetting.is_percentage,
          } : null,
        },
        created_by: 'system',
      })
      .select('id')
      .single();

    if (ledgerError || !ledgerEntry) {
      console.error('Error creating payout deposit ledger entry:', ledgerError);
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: `Failed to create ledger entry: ${ledgerError?.message || 'Unknown error'}`,
      };
    }

    // Get new balance
    const { data: balanceData, error: balanceError } = await client.rpc('get_collector_usd_balance', {
      p_collector_identifier: collectorIdentifier,
    });

    if (balanceError) {
      console.error('Error getting USD balance:', balanceError);
    }

    return {
      success: true,
      ledgerEntryId: ledgerEntry.id,
      usdDeposited: payoutAmount,
      newUsdBalance: Math.max(0, Number(balanceData) || 0),
    };
  } catch (error: any) {
    console.error('Error in depositPayoutEarnings:', error);
    return {
      success: false,
      usdDeposited: 0,
      newUsdBalance: 0,
      error: error.message || 'Unknown error occurred',
    };
  }
}


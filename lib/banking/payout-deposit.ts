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

    // Get line item with order currency info
    const { data: lineItem } = await client
      .from('order_line_items_v2')
      .select(`
        product_id, 
        price,
        order_id,
        orders!inner(currency_code)
      `)
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

    // Get order currency
    const orderCurrency = (lineItem.orders as any)?.currency_code || 'USD';
    
    // Get the original price (before discount) from Shopify order data
    // For discounted items, we need to use the original price, not the discounted price
    // Check if we have access to the raw Shopify order data
    let originalPrice = Number(lineItemPrice) || Number(lineItem.price) || 0;
    
    // Try to get original price from raw Shopify order data if available
    try {
      const { data: orderData } = await client
        .from('orders')
        .select('raw_shopify_order_data')
        .eq('id', lineItem.order_id)
        .single();
      
      if (orderData?.raw_shopify_order_data?.line_items) {
        const shopifyLineItem = orderData.raw_shopify_order_data.line_items.find(
          (item: any) => item.id.toString() === lineItemId
        );
        
        // Shopify provides original_price or we can calculate from price + discount
        if (shopifyLineItem) {
          // Use original_price if available, otherwise use price (which might already be discounted)
          // If there are discounts, original_price should be higher than price
          originalPrice = shopifyLineItem.original_price 
            ? parseFloat(shopifyLineItem.original_price) 
            : parseFloat(shopifyLineItem.price || '0');
          
          // If there's a discount allocation, add it back to get original price
          if (shopifyLineItem.discount_allocations && shopifyLineItem.discount_allocations.length > 0) {
            const totalDiscount = shopifyLineItem.discount_allocations.reduce(
              (sum: number, disc: any) => sum + parseFloat(disc.amount || '0'), 
              0
            );
            originalPrice = parseFloat(shopifyLineItem.price || '0') + totalDiscount;
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch original price from Shopify order data, using stored price:', error);
      // Continue with stored price
    }

    // Get payout setting for this product
    const { data: payoutSetting } = await client
      .from('product_vendor_payouts')
      .select('payout_amount, is_percentage')
      .eq('product_id', lineItem.product_id)
      .eq('vendor_name', vendorName)
      .maybeSingle();

    // Convert to USD only if order currency is GBP
    let priceInUSD = originalPrice;
    if (orderCurrency === 'GBP') {
      priceInUSD = convertGBPToUSD(originalPrice);
    }
    
    const payoutAmount = calculateLineItemPayout({
      price: priceInUSD, // Use USD price for calculation (original price before discount)
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


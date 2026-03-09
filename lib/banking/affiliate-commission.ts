/**
 * Deposit affiliate commission when a lamp line item is fulfilled and the order
 * was referred by an artist's affiliate link.
 * Creates a ledger entry with transaction_type='affiliate_commission' and currency='USD'.
 */

import { createClient } from '@/lib/supabase/server'
import type { PayoutDepositResult } from './types'
import { ensureCollectorAccount } from './account-manager'
import { AFFILIATE_COMMISSION_RATE } from '@/lib/affiliate'
import { isLampLineItem } from '@/lib/affiliate'

/**
 * Deposit 10% affiliate commission for a fulfilled lamp line item when the order
 * has an affiliate_vendor_id and the purchaser is not the affiliate vendor.
 */
export async function depositAffiliateCommission(
  lineItemId: string,
  orderId: string,
  affiliateVendorId: number,
  lineItemPrice: number,
  supabase?: ReturnType<typeof createClient>
): Promise<PayoutDepositResult> {
  const client = supabase || createClient()

  try {
    // Get affiliate vendor info
    const { data: vendor, error: vendorError } = await client
      .from('vendors')
      .select('id, auth_id, vendor_name, contact_email')
      .eq('id', affiliateVendorId)
      .single()

    if (vendorError || !vendor) {
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: `Affiliate vendor not found: ${affiliateVendorId}`,
      }
    }

    const collectorIdentifier = vendor.auth_id || vendor.vendor_name
    if (!collectorIdentifier) {
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: 'Affiliate vendor does not have an auth_id',
      }
    }

    // Idempotency: one affiliate_commission per line item
    const { data: existingEntry, error: checkError } = await client
      .from('collector_ledger_entries')
      .select('id')
      .eq('collector_identifier', collectorIdentifier)
      .eq('line_item_id', lineItemId)
      .eq('transaction_type', 'affiliate_commission')
      .eq('currency', 'USD')
      .maybeSingle()

    if (checkError) {
      console.error('Error checking for existing affiliate commission:', checkError)
    }

    if (existingEntry) {
      const { data: balanceData } = await client.rpc('get_collector_usd_balance', {
        p_collector_identifier: collectorIdentifier,
      })
      return {
        success: true,
        ledgerEntryId: existingEntry.id,
        usdDeposited: 0,
        newUsdBalance: Math.max(0, Number(balanceData) || 0),
        error: 'Affiliate commission already deposited for this line item',
      }
    }

    // Get line item and order
    const { data: lineItem, error: lineItemError } = await client
      .from('order_line_items_v2')
      .select('product_id, price, order_id, sku, name')
      .eq('line_item_id', lineItemId)
      .single()

    if (lineItemError || !lineItem) {
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: `Line item not found: ${lineItemId}`,
      }
    }

    const { data: order, error: orderError } = await client
      .from('orders')
      .select('currency_code, customer_email, raw_shopify_order_data, affiliate_vendor_id')
      .eq('id', lineItem.order_id || orderId)
      .single()

    if (orderError || !order) {
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: `Order not found: ${orderId}`,
      }
    }

    // Skip if purchaser is the affiliate vendor (self-referral)
    const customerEmail = (order.customer_email || '').toLowerCase().trim()
    const vendorEmail = (vendor.contact_email || '').toLowerCase().trim()
    if (customerEmail && vendorEmail && customerEmail === vendorEmail) {
      return {
        success: true,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: 'Same vendor as buyer - no affiliate commission',
      }
    }

    // Confirm this is a lamp line item
    if (!isLampLineItem(lineItem, order.raw_shopify_order_data, lineItemId)) {
      return {
        success: true,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: 'Line item is not a lamp - no affiliate commission',
      }
    }

    await ensureCollectorAccount(collectorIdentifier, 'vendor', vendor.id)

    // Get original price in USD (same logic as payout-deposit)
    let originalPrice = Number(lineItemPrice) || Number(lineItem.price) || 0
    if (order.raw_shopify_order_data?.line_items) {
      const shopifyLine = order.raw_shopify_order_data.line_items.find(
        (item: { id?: string }) => item.id?.toString() === lineItemId
      )
      if (shopifyLine) {
        const sl = shopifyLine as { original_price?: string; price?: string; discount_allocations?: Array<{ amount?: string }> }
        if (sl.original_price) {
          originalPrice = parseFloat(sl.original_price)
        } else if (sl.discount_allocations?.length) {
          const totalDiscount = sl.discount_allocations.reduce(
            (sum: number, d: { amount?: string }) => sum + parseFloat(d.amount || '0'),
            0
          )
          originalPrice = parseFloat(sl.price || '0') + totalDiscount
        } else {
          originalPrice = parseFloat(sl.price || '0')
        }
      }
    }

    const orderCurrency = (order.currency_code || 'USD').toUpperCase()
    let priceInUSD = originalPrice
    if (orderCurrency !== 'USD') {
      const { data: rateData } = await client
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', orderCurrency === 'ILS' || orderCurrency === 'NIS' ? 'ILS' : orderCurrency)
        .eq('to_currency', 'USD')
        .maybeSingle()
      const rate = Number(rateData?.rate) || (orderCurrency === 'GBP' ? 1.27 : orderCurrency === 'ILS' || orderCurrency === 'NIS' ? 0.27 : 1.0)
      priceInUSD = originalPrice * rate
    }

    const commissionAmount = priceInUSD * AFFILIATE_COMMISSION_RATE

    if (commissionAmount <= 0) {
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: 'Commission amount is zero or negative',
      }
    }

    const currentYear = new Date().getFullYear()
    const { data: ledgerEntry, error: ledgerError } = await client
      .from('collector_ledger_entries')
      .insert({
        collector_identifier: collectorIdentifier,
        transaction_type: 'affiliate_commission',
        amount: commissionAmount,
        currency: 'USD',
        order_id: orderId,
        line_item_id: lineItemId,
        description: `Affiliate commission (10%) for lamp sale, order ${orderId}`,
        metadata: {
          affiliate_vendor_id: affiliateVendorId,
          vendor_name: vendor.vendor_name,
          line_item_price_usd: priceInUSD,
          product_id: lineItem.product_id,
        },
        tax_year: currentYear,
        created_by: 'system',
      })
      .select('id')
      .single()

    if (ledgerError || !ledgerEntry) {
      console.error('Error creating affiliate commission ledger entry:', ledgerError)
      return {
        success: false,
        usdDeposited: 0,
        newUsdBalance: 0,
        error: `Failed to create ledger entry: ${ledgerError?.message || 'Unknown error'}`,
      }
    }

    const { data: balanceData } = await client.rpc('get_collector_usd_balance', {
      p_collector_identifier: collectorIdentifier,
    })

    return {
      success: true,
      ledgerEntryId: ledgerEntry.id,
      usdDeposited: commissionAmount,
      newUsdBalance: Math.max(0, Number(balanceData) || 0),
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Error in depositAffiliateCommission:', err)
    return {
      success: false,
      usdDeposited: 0,
      newUsdBalance: 0,
      error: err?.message || 'Unknown error occurred',
    }
  }
}

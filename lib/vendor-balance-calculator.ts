/**
 * Vendor Balance Calculator
 * Real-time balance calculation with caching support
 */

import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export interface VendorBalance {
  vendor_name: string
  available_balance: number
  pending_balance: number
  held_balance: number
  total_balance: number
  last_updated: string
}

// Simple in-memory cache with TTL (5 minutes)
const balanceCache = new Map<string, { balance: VendorBalance; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Calculate real-time vendor balance
 */
export async function calculateVendorBalance(
  vendorName: string,
  supabase?: SupabaseClient<Database>
): Promise<VendorBalance> {
  const client = supabase || createClient()

  // Check cache first
  const cached = balanceCache.get(vendorName)
  if (cached && cached.expires > Date.now()) {
    return cached.balance
  }

  // Calculate available balance (completed payouts - refund deductions)
  const { data: completedPayouts, error: payoutError } = await client
    .from("vendor_payouts")
    .select("amount")
    .eq("vendor_name", vendorName)
    .eq("status", "completed")

  if (payoutError) {
    console.error(`Error fetching completed payouts for ${vendorName}:`, payoutError)
  }

  const availableBalance =
    completedPayouts?.reduce((sum, payout) => sum + Number(payout.amount || 0), 0) || 0

  // Calculate refund deductions from ledger
  const { data: refundDeductions, error: refundError } = await client
    .from("vendor_ledger_entries")
    .select("amount")
    .eq("vendor_name", vendorName)
    .eq("entry_type", "refund_deduction")

  if (refundError) {
    console.error(`Error fetching refund deductions for ${vendorName}:`, refundError)
  }

  const refundTotal =
    refundDeductions?.reduce((sum, entry) => sum + Math.abs(Number(entry.amount || 0)), 0) || 0

  const finalAvailableBalance = Math.max(0, availableBalance - refundTotal)

  // Calculate pending balance (fulfilled items not yet paid)
  const { data: pendingItems, error: pendingError } = await client.rpc("get_vendor_pending_line_items", {
    p_vendor_name: vendorName,
  })

  if (pendingError) {
    console.error(`Error fetching pending items for ${vendorName}:`, pendingError)
  }

  let pendingBalance = 0
  if (pendingItems && Array.isArray(pendingItems)) {
    // DISABLED: Custom payout settings - always use 25% of item price
    pendingBalance = pendingItems.reduce((sum: number, item: any) => {
      const payoutAmount = (Number(item.price || 0) * 25) / 100
      return sum + payoutAmount
    }, 0)
  }

  // Calculate held balance (items in processing or on hold)
  const { data: processingPayouts, error: processingError } = await client
    .from("vendor_payouts")
    .select("amount")
    .eq("vendor_name", vendorName)
    .in("status", ["processing", "pending"])

  if (processingError) {
    console.error(`Error fetching processing payouts for ${vendorName}:`, processingError)
  }

  const heldBalance = processingPayouts?.reduce((sum, payout) => sum + Number(payout.amount || 0), 0) || 0

  const balance: VendorBalance = {
    vendor_name: vendorName,
    available_balance: finalAvailableBalance,
    pending_balance: pendingBalance,
    held_balance: heldBalance,
    total_balance: finalAvailableBalance + pendingBalance,
    last_updated: new Date().toISOString(),
  }

  // Cache the result
  balanceCache.set(vendorName, {
    balance,
    expires: Date.now() + CACHE_TTL,
  })

  return balance
}

/**
 * Invalidate balance cache for a vendor
 */
export function invalidateVendorBalanceCache(vendorName: string): void {
  balanceCache.delete(vendorName)
}

/**
 * Clear all balance cache
 */
export function clearBalanceCache(): void {
  balanceCache.clear()
}

/**
 * Get balance for multiple vendors
 */
export async function calculateMultipleVendorBalances(
  vendorNames: string[],
  supabase?: SupabaseClient<Database>
): Promise<Map<string, VendorBalance>> {
  const balances = new Map<string, VendorBalance>()

  await Promise.all(
    vendorNames.map(async (vendorName) => {
      const balance = await calculateVendorBalance(vendorName, supabase)
      balances.set(vendorName, balance)
    })
  )

  return balances
}


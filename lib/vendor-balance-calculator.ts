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

  // Get vendor's collector identifier for ledger-based balance
  const { data: vendor, error: vendorError } = await client
    .from("vendors")
    .select("id, auth_id, vendor_name")
    .eq("vendor_name", vendorName)
    .single()

  let availableBalance = 0
  if (vendor && !vendorError) {
    const collectorIdentifier = vendor.auth_id || vendorName

    try {
      // Import the ledger-based balance calculator
      const { getUsdBalance } = await import("@/lib/banking/balance-calculator")
      availableBalance = await getUsdBalance(collectorIdentifier)
    } catch (error) {
      console.error(`Error getting ledger balance for ${vendorName}:`, error)
      // Fall back to calculating from completed payouts
      const { data: completedPayouts, error: payoutError } = await client
        .from("vendor_payouts")
        .select("amount")
        .eq("vendor_name", vendorName)
        .eq("status", "completed")

      if (payoutError) {
        console.error(`Error fetching completed payouts for ${vendorName}:`, payoutError)
      }

      availableBalance = completedPayouts?.reduce((sum, payout) => sum + Number(payout.amount || 0), 0) || 0
    }
  } else {
    console.error(`Error fetching vendor ${vendorName}:`, vendorError)
    // Fall back to direct calculation
    const { data: completedPayouts, error: payoutError } = await client
      .from("vendor_payouts")
      .select("amount")
      .eq("vendor_name", vendorName)
      .eq("status", "completed")

    if (payoutError) {
      console.error(`Error fetching completed payouts for ${vendorName}:`, payoutError)
    }

    availableBalance = completedPayouts?.reduce((sum, payout) => sum + Number(payout.amount || 0), 0) || 0
  }

  // Calculate refund deductions from ledger (if available)
  let refundTotal = 0
  try {
    const { data: refundDeductions, error: refundError } = await client
      .from("vendor_ledger_entries")
      .select("amount")
      .eq("vendor_name", vendorName)
      .eq("entry_type", "refund_deduction")

    if (refundError) {
      console.error(`Error fetching refund deductions for ${vendorName}:`, refundError)
    }

    refundTotal = refundDeductions?.reduce((sum, entry) => sum + Math.abs(Number(entry.amount || 0)), 0) || 0
  } catch (error) {
    console.error(`Error calculating refund deductions for ${vendorName}:`, error)
  }

  const finalAvailableBalance = Math.max(0, availableBalance - refundTotal)

  // LEGACY FIX: Check for completed payouts that don't have ledger withdrawal entries
  // This fixes the discrepancy where payouts were processed but ledger wasn't updated
  try {
    // Get completed payouts that might not have withdrawal entries
    const { data: completedPayouts, error: payoutError } = await client
      .from("vendor_payouts")
      .select("id, amount, payout_date")
      .eq("vendor_name", vendorName)
      .eq("status", "completed")

    if (!payoutError && completedPayouts && vendor) {
      const collectorIdentifier = vendor.auth_id || vendorName

      for (const payout of completedPayouts) {
        // Check if withdrawal entry exists
        const { data: withdrawalEntry, error: checkError } = await client
          .from("collector_ledger_entries")
          .select("id")
          .eq("collector_identifier", collectorIdentifier)
          .eq("payout_id", payout.id)
          .eq("transaction_type", "payout_withdrawal")
          .maybeSingle()

        if (!checkError && !withdrawalEntry) {
          // Missing withdrawal entry - create it
          console.log(`Creating missing withdrawal entry for payout ${payout.id} (${vendorName})`)

          const { recordPayoutWithdrawal } = await import("@/lib/banking/payout-withdrawal")
          await recordPayoutWithdrawal(vendorName, payout.id, payout.amount, client)
        }
      }
    }
  } catch (error) {
    console.error(`Error checking for missing withdrawal entries for ${vendorName}:`, error)
  }

  // Calculate pending balance (fulfilled items not yet paid)
  let pendingBalance = 0

  try {
    // First try to get pending amount from collector ledger (same as payout calculation)
    if (vendor) {
      const { ensureCollectorAccount } = await import("@/lib/banking/account-manager")
      const { getUsdBalance } = await import("@/lib/banking/balance-calculator")

      const collectorIdentifier = vendor.auth_id || vendorName
      await ensureCollectorAccount(collectorIdentifier, 'vendor', vendor.id)

      // Get current USD balance from ledger (this includes pending payouts)
      const ledgerBalance = await getUsdBalance(collectorIdentifier)
      // Pending balance is the difference between ledger balance and already available balance
      pendingBalance = Math.max(0, ledgerBalance - finalAvailableBalance)
    }
  } catch (error) {
    console.error(`Error getting ledger-based pending balance for ${vendorName}:`, error)
    // Fall back to calculating from pending payouts
    const { data: processingPayouts, error: processingError } = await client
      .from("vendor_payouts")
      .select("amount")
      .eq("vendor_name", vendorName)
      .in("status", ["processing", "pending", "requested"])

    if (processingError) {
      console.error(`Error fetching processing payouts for ${vendorName}:`, processingError)
    }

    pendingBalance = processingPayouts?.reduce((sum, payout) => sum + Number(payout.amount || 0), 0) || 0
  }

  // Calculate held balance (payouts in processing or pending status)
  const { data: heldPayouts, error: heldError } = await client
    .from("vendor_payouts")
    .select("amount")
    .eq("vendor_name", vendorName)
    .in("status", ["processing", "pending", "requested"])

  if (heldError) {
    console.error(`Error fetching held payouts for ${vendorName}:`, heldError)
  }

  const heldBalance = heldPayouts?.reduce((sum, payout) => sum + Number(payout.amount || 0), 0) || 0

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


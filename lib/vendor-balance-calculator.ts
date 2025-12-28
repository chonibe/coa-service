/**
 * Vendor Balance Calculator
 * Real-time balance calculation with caching support
 * Now fully ledger-based for single source of truth.
 */

import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { UnifiedBankingService } from "@/lib/banking/central-service"

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
  // Check cache first
  const cached = balanceCache.get(vendorName)
  if (cached && cached.expires > Date.now()) {
    return cached.balance
  }

  const client = supabase || createClient()
  const banking = new UnifiedBankingService(client);

  try {
    // Get vendor info
    const { data: vendor, error: vendorError } = await client
      .from("vendors")
      .select("id, auth_id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      console.error(`Vendor not found during balance calculation: ${vendorName}`);
      return {
        vendor_name: vendorName,
        available_balance: 0,
        pending_balance: 0,
        held_balance: 0,
        total_balance: 0,
        last_updated: new Date().toISOString(),
      };
    }

    const identifier = vendor.auth_id || vendorName;
    const unifiedBalance = await banking.getBalance(identifier);

    // Calculate held balance (payouts currently being processed)
    const { data: heldPayouts, error: heldError } = await client
      .from("vendor_payouts")
      .select("amount")
      .eq("vendor_name", vendorName)
      .in("status", ["processing", "pending", "requested"]);

    if (heldError) {
      console.error(`Error fetching held payouts for ${vendorName}:`, heldError);
    }

    const heldBalance = heldPayouts?.reduce((sum, payout) => sum + Number(payout.amount || 0), 0) || 0;

    const balance: VendorBalance = {
      vendor_name: vendorName,
      available_balance: unifiedBalance.usdBalance,
      pending_balance: 0, // In the new system, earned is immediately available in the ledger
      held_balance: heldBalance,
      total_balance: unifiedBalance.usdBalance + heldBalance,
      last_updated: new Date().toISOString(),
    }

    // Cache the result
    balanceCache.set(vendorName, {
      balance,
      expires: Date.now() + CACHE_TTL,
    })

    return balance;
  } catch (error) {
    console.error(`Fatal error calculating balance for ${vendorName}:`, error);
    throw error;
  }
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
      try {
        const balance = await calculateVendorBalance(vendorName, supabase)
        balances.set(vendorName, balance)
      } catch (e) {
        console.error(`Skipping balance for ${vendorName} due to error`);
      }
    })
  )

  return balances
}

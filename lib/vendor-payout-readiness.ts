import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { MINIMUM_PAYOUT_AMOUNT } from "@/lib/payout-calculator"
import { isValidPayPalEmail } from "@/lib/paypal/payouts"
import { calculateVendorBalance } from "@/lib/vendor-balance-calculator"

export interface PayoutPrerequisites {
  hasPayPalEmail: boolean
  hasValidPayPalEmail: boolean
  hasTaxId: boolean
  hasTaxCountry: boolean
  hasAcceptedTerms: boolean
  hasMinimumBalance: boolean
  currentBalance: number
  minimumRequired: number
}

export interface PayoutReadinessResult {
  isReady: boolean
  prerequisites: PayoutPrerequisites
  missingItems: string[]
}

/**
 * Check if a vendor has completed all prerequisites for requesting payouts
 */
export async function checkVendorPayoutReadiness(
  vendorName: string,
  supabase?: SupabaseClient<Database>
): Promise<PayoutReadinessResult> {
  const client = supabase || createClient()

  // Default prerequisites (all false)
  const prerequisites: PayoutPrerequisites = {
    hasPayPalEmail: false,
    hasValidPayPalEmail: false,
    hasTaxId: false,
    hasTaxCountry: false,
    hasAcceptedTerms: false,
    hasMinimumBalance: false,
    currentBalance: 0,
    minimumRequired: MINIMUM_PAYOUT_AMOUNT,
  }

  const missingItems: string[] = []

  try {
    // Get vendor details
    const { data: vendor, error: vendorError } = await client
      .from("vendors")
      .select("paypal_email, tax_id, tax_country, terms_accepted")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      missingItems.push("Vendor profile not found")
      return { isReady: false, prerequisites, missingItems }
    }

    // Check PayPal email
    if (vendor.paypal_email) {
      prerequisites.hasPayPalEmail = true
      prerequisites.hasValidPayPalEmail = isValidPayPalEmail(vendor.paypal_email)
      if (!prerequisites.hasValidPayPalEmail) {
        missingItems.push("Valid PayPal email")
      }
    } else {
      missingItems.push("PayPal email")
    }

    // Check tax info
    if (vendor.tax_id) {
      prerequisites.hasTaxId = true
    } else {
      missingItems.push("Tax ID")
    }

    if (vendor.tax_country) {
      prerequisites.hasTaxCountry = true
    } else {
      missingItems.push("Tax country")
    }

    // Check terms accepted
    if (vendor.terms_accepted) {
      prerequisites.hasAcceptedTerms = true
    } else {
      missingItems.push("Terms acceptance")
    }

    // Get balance from the ledger (single source of truth)
    const balance = await calculateVendorBalance(vendorName, client)
    prerequisites.currentBalance = balance.available_balance
    prerequisites.hasMinimumBalance = balance.available_balance >= MINIMUM_PAYOUT_AMOUNT

    if (!prerequisites.hasMinimumBalance) {
      missingItems.push(`Minimum balance of $${MINIMUM_PAYOUT_AMOUNT}`)
    }

    // Determine overall readiness
    const isReady =
      prerequisites.hasPayPalEmail &&
      prerequisites.hasValidPayPalEmail &&
      prerequisites.hasTaxId &&
      prerequisites.hasTaxCountry &&
      prerequisites.hasAcceptedTerms &&
      prerequisites.hasMinimumBalance

    return { isReady, prerequisites, missingItems }
  } catch (error: any) {
    console.error("Error checking vendor payout readiness:", error)
    missingItems.push("Error checking prerequisites")
    return { isReady: false, prerequisites, missingItems }
  }
}

/**
 * Check only profile prerequisites (not balance) - for showing notification bar
 */
export async function checkVendorProfileComplete(
  vendorName: string,
  supabase?: SupabaseClient<Database>
): Promise<{ isComplete: boolean; missingItems: string[] }> {
  const client = supabase || createClient()
  const missingItems: string[] = []

  try {
    const { data: vendor, error } = await client
      .from("vendors")
      .select("paypal_email, tax_id, tax_country, terms_accepted")
      .eq("vendor_name", vendorName)
      .single()

    if (error || !vendor) {
      return { isComplete: false, missingItems: ["Profile not found"] }
    }

    if (!vendor.paypal_email || !isValidPayPalEmail(vendor.paypal_email)) {
      missingItems.push("PayPal email")
    }

    if (!vendor.tax_id) {
      missingItems.push("Tax ID")
    }

    if (!vendor.tax_country) {
      missingItems.push("Tax country")
    }

    if (!vendor.terms_accepted) {
      missingItems.push("Terms acceptance")
    }

    return { isComplete: missingItems.length === 0, missingItems }
  } catch (error) {
    console.error("Error checking vendor profile:", error)
    return { isComplete: false, missingItems: ["Error checking profile"] }
  }
}

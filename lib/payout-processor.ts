/**
 * Unified Payout Processor
 * Abstracts payment processing logic for PayPal, Stripe, and Bank Transfer
 */

import { createClient } from "@/lib/supabase/server"
import { createPayPalPayout, isValidPayPalEmail } from "@/lib/paypal/payouts"
import { createPayout as createStripePayout } from "@/lib/stripe"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export type PaymentMethod = "paypal" | "stripe" | "bank_transfer" | "manual"

export interface PayoutItem {
  vendor_name: string
  amount: number
  product_count?: number
  payout_id?: number
  reference?: string
}

export interface ProcessedPayoutResult {
  vendor_name: string
  success: boolean
  payout_id?: number
  reference?: string
  status?: string
  error?: string
  transfer_id?: string
  batch_id?: string
}

export interface PayoutProcessorOptions {
  payment_method: PaymentMethod
  generate_invoices?: boolean
  notes?: string
  supabase?: SupabaseClient<Database>
}

/**
 * Validate vendor payment method setup
 */
export async function validateVendorPaymentMethod(
  vendorName: string,
  paymentMethod: PaymentMethod,
  supabase?: SupabaseClient<Database>
): Promise<{ valid: boolean; error?: string; accountId?: string; email?: string }> {
  const client = supabase || createClient()

  const { data: vendor, error } = await client
    .from("vendors")
    .select("paypal_email, stripe_account_id, stripe_onboarding_complete")
    .eq("vendor_name", vendorName)
    .single()

  if (error || !vendor) {
    return { valid: false, error: "Vendor not found" }
  }

  switch (paymentMethod) {
    case "paypal":
      if (!vendor.paypal_email) {
        return { valid: false, error: "PayPal email not configured for vendor" }
      }
      if (!isValidPayPalEmail(vendor.paypal_email)) {
        return { valid: false, error: "Invalid PayPal email format" }
      }
      return { valid: true, email: vendor.paypal_email }

    case "stripe":
      if (!vendor.stripe_account_id) {
        return { valid: false, error: "Stripe account not configured for vendor" }
      }
      if (!vendor.stripe_onboarding_complete) {
        return { valid: false, error: "Stripe onboarding not complete for vendor" }
      }
      return { valid: true, accountId: vendor.stripe_account_id }

    case "bank_transfer":
    case "manual":
      // No specific validation needed for bank transfer or manual
      return { valid: true }

    default:
      return { valid: false, error: `Unknown payment method: ${paymentMethod}` }
  }
}

/**
 * Process PayPal payout
 */
async function processPayPalPayout(
  items: PayoutItem[],
  validatedVendors: Map<string, { email: string }>,
  options: PayoutProcessorOptions,
  supabase: SupabaseClient<Database>
): Promise<ProcessedPayoutResult[]> {
  const results: ProcessedPayoutResult[] = []
  const paypalPayoutItems: Array<{
    email: string
    amount: number
    currency: string
    note?: string
    senderItemId?: string
    vendorName: string
    payoutId: number
  }> = []

  // Prepare PayPal batch items
  for (const item of items) {
    const vendor = validatedVendors.get(item.vendor_name)
    if (!vendor) {
      results.push({
        vendor_name: item.vendor_name,
        success: false,
        error: "Vendor validation failed",
      })
      continue
    }

    paypalPayoutItems.push({
      email: vendor.email,
      amount: item.amount,
      currency: "USD",
      note: `Payout for ${item.product_count || 0} products - ${item.reference || ""}`,
      senderItemId: item.payout_id ? `PAYOUT-${item.payout_id}` : undefined,
      vendorName: item.vendor_name,
      payoutId: item.payout_id!,
    })
  }

  if (paypalPayoutItems.length === 0) {
    return results
  }

  try {
    // Create PayPal batch payout
    const paypalResponse = await createPayPalPayout(
      paypalPayoutItems.map((item) => ({
        email: item.email,
        amount: item.amount,
        currency: item.currency,
        note: item.note,
        senderItemId: item.senderItemId,
      }))
    )

    const batchId = paypalResponse.batch_header.payout_batch_id
    const batchStatus = paypalResponse.batch_header.batch_status

    // Update all payouts with batch ID
    for (const item of paypalPayoutItems) {
      const { data: updatedPayout } = await supabase
        .from("vendor_payouts")
        .update({
          payout_batch_id: batchId,
          status: batchStatus === "PENDING" ? "processing" : batchStatus.toLowerCase(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.payoutId)
        .select()
        .single()

      results.push({
        vendor_name: item.vendorName,
        success: true,
        payout_id: item.payoutId,
        status: batchStatus.toLowerCase(),
        batch_id: batchId,
      })
    }

    return results
  } catch (error: any) {
    console.error("PayPal batch payout error:", error)

    // Mark all payouts as failed
    for (const item of paypalPayoutItems) {
      await supabase
        .from("vendor_payouts")
        .update({
          status: "failed",
          notes: `PayPal payout failed: ${error.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.payoutId)

      results.push({
        vendor_name: item.vendorName,
        success: false,
        error: `PayPal error: ${error.message}`,
      })
    }

    return results
  }
}

/**
 * Process Stripe payout
 */
async function processStripePayout(
  items: PayoutItem[],
  validatedVendors: Map<string, { accountId: string }>,
  options: PayoutProcessorOptions,
  supabase: SupabaseClient<Database>
): Promise<ProcessedPayoutResult[]> {
  const results: ProcessedPayoutResult[] = []

  // Process each Stripe payout individually (Stripe doesn't have batch transfers)
  for (const item of items) {
    const vendor = validatedVendors.get(item.vendor_name)
    if (!vendor) {
      results.push({
        vendor_name: item.vendor_name,
        success: false,
        error: "Vendor validation failed",
      })
      continue
    }

    try {
      const stripeResult = await createStripePayout(
        vendor.accountId,
        item.amount,
        "usd",
        {
          payout_id: item.payout_id,
          vendor_name: item.vendor_name,
          reference: item.reference || `payout-${item.payout_id}`,
        }
      )

      if (!stripeResult.success) {
        // Update payout status to failed
        if (item.payout_id) {
          await supabase
            .from("vendor_payouts")
            .update({
              status: "failed",
              notes: `Stripe payout failed: ${stripeResult.error}`,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.payout_id)
        }

        results.push({
          vendor_name: item.vendor_name,
          success: false,
          error: stripeResult.error || "Stripe payout failed",
        })
        continue
      }

      // Update payout with Stripe transfer ID
      if (item.payout_id) {
        await supabase
          .from("vendor_payouts")
          .update({
            stripe_transfer_id: stripeResult.transferId,
            status: "processing",
            payment_method: "stripe",
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.payout_id)
      }

      results.push({
        vendor_name: item.vendor_name,
        success: true,
        payout_id: item.payout_id,
        transfer_id: stripeResult.transferId,
        status: "processing",
      })
    } catch (error: any) {
      console.error(`Stripe payout error for ${item.vendor_name}:`, error)

      if (item.payout_id) {
        await supabase
          .from("vendor_payouts")
          .update({
            status: "failed",
            notes: `Stripe payout failed: ${error.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.payout_id)
      }

      results.push({
        vendor_name: item.vendor_name,
        success: false,
        error: error.message || "Stripe payout failed",
      })
    }
  }

  return results
}

/**
 * Process bank transfer payout (manual processing)
 */
async function processBankTransferPayout(
  items: PayoutItem[],
  options: PayoutProcessorOptions,
  supabase: SupabaseClient<Database>
): Promise<ProcessedPayoutResult[]> {
  const results: ProcessedPayoutResult[] = []

  // Bank transfers are marked as processing and require manual completion
  for (const item of items) {
    if (item.payout_id) {
      await supabase
        .from("vendor_payouts")
        .update({
          status: "processing",
          payment_method: "bank_transfer",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.payout_id)

      results.push({
        vendor_name: item.vendor_name,
        success: true,
        payout_id: item.payout_id,
        status: "processing",
      })
    }
  }

  return results
}

/**
 * Unified payout processor
 */
export async function processPayouts(
  items: PayoutItem[],
  options: PayoutProcessorOptions
): Promise<ProcessedPayoutResult[]> {
  const supabase = options.supabase || createClient()
  const results: ProcessedPayoutResult[] = []

  // Validate all vendors first
  const validatedVendors = new Map<
    string,
    { email?: string; accountId?: string }
  >()

  for (const item of items) {
    const validation = await validateVendorPaymentMethod(
      item.vendor_name,
      options.payment_method,
      supabase
    )

    if (!validation.valid) {
      results.push({
        vendor_name: item.vendor_name,
        success: false,
        error: validation.error || "Validation failed",
      })
      continue
    }

    if (options.payment_method === "paypal" && validation.email) {
      validatedVendors.set(item.vendor_name, { email: validation.email })
    } else if (options.payment_method === "stripe" && validation.accountId) {
      validatedVendors.set(item.vendor_name, { accountId: validation.accountId })
    } else {
      validatedVendors.set(item.vendor_name, {})
    }
  }

  // Process based on payment method
  switch (options.payment_method) {
    case "paypal":
      return await processPayPalPayout(items, validatedVendors as Map<string, { email: string }>, options, supabase)

    case "stripe":
      return await processStripePayout(items, validatedVendors as Map<string, { accountId: string }>, options, supabase)

    case "bank_transfer":
    case "manual":
      return await processBankTransferPayout(items, options, supabase)

    default:
      return results.map((item) => ({
        ...item,
        success: false,
        error: `Unsupported payment method: ${options.payment_method}`,
      }))
  }
}


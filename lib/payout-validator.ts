import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface PayoutValidationOptions {
  lineItemIds?: string[]
  orderIds?: string[]
  vendorName?: string
  checkDuplicates?: boolean
  checkFulfillmentStatus?: boolean
}

/**
 * Validate that line items are fulfilled before payout
 */
export async function validateFulfillmentStatus(
  lineItemIds: string[],
  supabase?: SupabaseClient<Database>
): Promise<ValidationResult> {
  const client = supabase || createClient()
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const { data, error } = await client
      .from("order_line_items")
      .select("line_item_id, fulfillment_status, order_id, order_name")
      .in("line_item_id", lineItemIds)

    if (error) {
      return {
        valid: false,
        errors: [`Failed to fetch line items: ${error.message}`],
        warnings: [],
      }
    }

    if (!data || data.length === 0) {
      return {
        valid: false,
        errors: ["No line items found"],
        warnings: [],
      }
    }

    // Check for unfulfilled items
    const unfulfilledItems = data.filter(
      (item) => item.fulfillment_status !== "fulfilled"
    )

    if (unfulfilledItems.length > 0) {
      const unfulfilledIds = unfulfilledItems.map((item) => item.line_item_id)
      errors.push(
        `The following line items are not fulfilled: ${unfulfilledIds.join(", ")}`
      )
    }

    // Check for missing items
    const foundIds = data.map((item) => item.line_item_id)
    const missingIds = lineItemIds.filter((id) => !foundIds.includes(id))

    if (missingIds.length > 0) {
      errors.push(`The following line items were not found: ${missingIds.join(", ")}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Validation error: ${error.message}`],
      warnings: [],
    }
  }
}

/**
 * Check for duplicate payments (items already paid)
 */
export async function checkDuplicatePayments(
  lineItemIds: string[],
  supabase?: SupabaseClient<Database>
): Promise<ValidationResult> {
  const client = supabase || createClient()
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const { data, error } = await client
      .from("vendor_payout_items")
      .select("line_item_id, payout_id, manually_marked_paid")
      .in("line_item_id", lineItemIds)
      .not("payout_id", "is", null)

    if (error) {
      return {
        valid: false,
        errors: [`Failed to check for duplicates: ${error.message}`],
        warnings: [],
      }
    }

    if (data && data.length > 0) {
      const paidIds = data.map((item) => item.line_item_id)
      const manuallyMarked = data.filter((item) => item.manually_marked_paid).length

      if (manuallyMarked > 0) {
        warnings.push(
          `${manuallyMarked} of these items were manually marked as paid previously`
        )
      }

      errors.push(
        `The following line items have already been paid: ${paidIds.join(", ")}`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Duplicate check error: ${error.message}`],
      warnings: [],
    }
  }
}

/**
 * Validate payout amounts are reasonable
 */
export function validatePayoutAmounts(
  lineItems: Array<{ price: number; payout_amount: number }>
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const item of lineItems) {
    // Check for negative amounts
    if (item.payout_amount < 0) {
      errors.push(`Line item has negative payout amount: ${item.payout_amount}`)
    }

    // Check if payout exceeds price (warning, not error, as fixed amounts might be higher)
    if (item.payout_amount > item.price) {
      warnings.push(
        `Line item payout (${item.payout_amount}) exceeds price (${item.price})`
      )
    }

    // Check for zero price
    if (item.price === 0) {
      warnings.push(`Line item has zero price`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Comprehensive validation for payout operations
 */
export async function validatePayout(
  options: PayoutValidationOptions,
  supabase?: SupabaseClient<Database>
): Promise<ValidationResult> {
  const client = supabase || createClient()
  const allErrors: string[] = []
  const allWarnings: string[] = []

  // If line item IDs provided, validate them
  if (options.lineItemIds && options.lineItemIds.length > 0) {
    if (options.checkFulfillmentStatus !== false) {
      const fulfillmentResult = await validateFulfillmentStatus(
        options.lineItemIds,
        client
      )
      allErrors.push(...fulfillmentResult.errors)
      allWarnings.push(...fulfillmentResult.warnings)
    }

    if (options.checkDuplicates !== false) {
      const duplicateResult = await checkDuplicatePayments(
        options.lineItemIds,
        client
      )
      allErrors.push(...duplicateResult.errors)
      allWarnings.push(...duplicateResult.warnings)
    }
  }

  // If order IDs provided, fetch line items and validate
  if (options.orderIds && options.orderIds.length > 0 && options.vendorName) {
    try {
      const { data, error } = await client
        .from("order_line_items")
        .select("line_item_id, fulfillment_status")
        .in("order_id", options.orderIds)
        .eq("vendor_name", options.vendorName)
        .eq("status", "active")

      if (error) {
        allErrors.push(`Failed to fetch line items for orders: ${error.message}`)
      } else if (data) {
        const lineItemIds = data.map((item) => item.line_item_id)

        if (options.checkFulfillmentStatus !== false) {
          const fulfillmentResult = await validateFulfillmentStatus(
            lineItemIds,
            client
          )
          allErrors.push(...fulfillmentResult.errors)
          allWarnings.push(...fulfillmentResult.warnings)
        }

        if (options.checkDuplicates !== false) {
          const duplicateResult = await checkDuplicatePayments(
            lineItemIds,
            client
          )
          allErrors.push(...duplicateResult.errors)
          allWarnings.push(...duplicateResult.warnings)
        }
      }
    } catch (error: any) {
      allErrors.push(`Error validating orders: ${error.message}`)
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}

/**
 * Ensure data integrity before payout operations
 */
export async function ensureDataIntegrity(
  lineItemIds: string[],
  supabase?: SupabaseClient<Database>
): Promise<ValidationResult> {
  const client = supabase || createClient()
  const errors: string[] = []

  try {
    // Check that all line items exist and are active
    const { data, error } = await client
      .from("order_line_items")
      .select("line_item_id, status, vendor_name")
      .in("line_item_id", lineItemIds)

    if (error) {
      return {
        valid: false,
        errors: [`Failed to verify line items: ${error.message}`],
        warnings: [],
      }
    }

    if (!data || data.length !== lineItemIds.length) {
      const foundIds = data?.map((item) => item.line_item_id) || []
      const missingIds = lineItemIds.filter((id) => !foundIds.includes(id))
      errors.push(`Missing line items: ${missingIds.join(", ")}`)
    }

    // Check for inactive items
    if (data) {
      const inactiveItems = data.filter((item) => item.status !== "active")
      if (inactiveItems.length > 0) {
        errors.push(
          `Inactive line items found: ${inactiveItems.map((item) => item.line_item_id).join(", ")}`
        )
      }

      // Check that all items belong to the same vendor (if multiple items)
      if (data.length > 1) {
        const vendors = new Set(data.map((item) => item.vendor_name).filter(Boolean))
        if (vendors.size > 1) {
          errors.push(
            `Line items belong to different vendors: ${Array.from(vendors).join(", ")}`
          )
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    }
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Data integrity check failed: ${error.message}`],
      warnings: [],
    }
  }
}


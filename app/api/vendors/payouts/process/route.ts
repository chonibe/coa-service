import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { createPayPalPayout, isValidPayPalEmail } from "@/lib/paypal/payouts"
import { notifyPayoutProcessed, notifyPayoutFailed } from "@/lib/notifications/payout-notifications"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  const supabase = createClient()
  
  try {
    // Get the request body
    const body = await request.json()
    const { payouts, payment_method, generate_invoices, notes } = body

    if (!payouts || !Array.isArray(payouts) || payouts.length === 0) {
      return NextResponse.json({ error: "No payouts provided" }, { status: 400 })
    }

    // Validate PayPal email for all vendors before processing
    const vendorEmails = new Map<string, string>()
    for (const payout of payouts) {
      const { vendor_name } = payout
      if (!vendor_name) continue

      const { data: vendor } = await supabase
        .from("vendors")
        .select("paypal_email")
        .eq("vendor_name", vendor_name)
        .single()

      if (!vendor?.paypal_email) {
        results.push({
          vendor_name,
          success: false,
          error: "PayPal email not configured for vendor",
        })
        continue
      }

      if (!isValidPayPalEmail(vendor.paypal_email)) {
        results.push({
          vendor_name,
          success: false,
          error: "Invalid PayPal email format",
        })
        continue
      }

      vendorEmails.set(vendor_name, vendor.paypal_email)
    }

    // Process each payout
    const results = []
    let processedCount = 0
    const paypalPayoutItems: Array<{
      email: string
      amount: number
      currency?: string
      note?: string
      senderItemId?: string
      vendorName: string
      payoutId?: number
    }> = []

    for (const payout of payouts) {
      try {
        const { vendor_name, amount, product_count } = payout

        if (!vendor_name || !amount) {
          results.push({
            vendor_name,
            success: false,
            error: "Missing required fields",
          })
          continue
        }

        // Skip if vendor email validation failed
        if (!vendorEmails.has(vendor_name)) {
          continue
        }

        // Generate a unique reference number
        const reference = `PAY-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`

        // Generate invoice number if requested
        const invoiceNumber = generate_invoices
          ? `INV-${Date.now()}-${vendor_name.substring(0, 3).toUpperCase()}`
          : null

        // Calculate tax amount (0% for now, would be based on vendor's country and status)
        const taxRate = 0
        const taxAmount = 0

        // Insert the payout record
        const { data, error } = await supabase
          .from("vendor_payouts")
          .insert({
            vendor_name,
            amount,
            status: "pending", // Start as pending
            reference,
            product_count: product_count || 0,
            payment_method: payment_method || "paypal",
            currency: "USD",
            invoice_number: invoiceNumber,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()

        if (error) {
          console.error(`Error creating payout for ${vendor_name}:`, error)
          results.push({
            vendor_name,
            success: false,
            error: error.message,
          })
          continue
        }

        const payoutId = data[0].id

        // Get all pending fulfilled line items for this vendor
        // The RPC function now filters by fulfillment_status = 'fulfilled'
        const { data: lineItems, error: lineItemsError } = await supabase.rpc("get_vendor_pending_line_items", {
          p_vendor_name: vendor_name,
        })

        if (lineItemsError) {
          console.error(`Error fetching line items for ${vendor_name}:`, lineItemsError)
          results.push({
            vendor_name,
            success: false,
            error: `Failed to fetch line items: ${lineItemsError.message}`,
          })
          continue
        }

        if (!lineItems || lineItems.length === 0) {
          results.push({
            vendor_name,
            success: false,
            error: "No fulfilled line items found for payout",
          })
          continue
        }

        // Group line items by order for better tracking
        const orderGroups = new Map<string, typeof lineItems>()
        lineItems.forEach((item: any) => {
          const orderId = item.order_id
          if (!orderGroups.has(orderId)) {
            orderGroups.set(orderId, [])
          }
          orderGroups.get(orderId)!.push(item)
        })

        // Associate line items with this payout, grouped by order
        const payoutItems = lineItems.map((item: any) => ({
          payout_id: payoutId,
          line_item_id: item.line_item_id,
          order_id: item.order_id,
          product_id: item.product_id,
          amount: item.is_percentage ? (item.price * item.payout_amount) / 100 : item.payout_amount,
          created_at: new Date().toISOString(),
        }))

        const { error: insertError } = await supabase.from("vendor_payout_items").insert(payoutItems)

        if (insertError) {
          console.error(`Error associating line items with payout for ${vendor_name}:`, insertError)
          // Continue with the payout even if we can't associate line items
        }

        // If using PayPal, prepare for batch payout
        if (payment_method === "paypal") {
          // Add to PayPal batch payout items
          paypalPayoutItems.push({
            email: vendorEmails.get(vendor_name)!,
            amount: parseFloat(amount.toString()),
            currency: "USD",
            note: `Payout for ${product_count || 0} products - ${reference}`,
            senderItemId: `PAYOUT-${payoutId}`,
            vendorName: vendor_name,
            payoutId: payoutId,
          })

          // Mark as processing (will be updated after PayPal batch is created)
          await supabase
            .from("vendor_payouts")
            .update({
              status: "processing",
              updated_at: new Date().toISOString(),
            })
            .eq("id", payoutId)

          results.push({
            vendor_name,
            success: true,
            payout_id: payoutId,
            reference,
            status: "processing",
          })

          processedCount++
        } else {
          // For other payment methods, mark as processing
          await supabase
            .from("vendor_payouts")
            .update({
              status: "processing",
              updated_at: new Date().toISOString(),
            })
            .eq("id", payoutId)

          results.push({
            vendor_name,
            success: true,
            payout_id: payoutId,
            reference,
            status: "processing",
          })

          processedCount++
        }
      } catch (err: any) {
        console.error(`Error processing payout for ${payout.vendor_name}:`, err)
        results.push({
          vendor_name: payout.vendor_name,
          success: false,
          error: err.message || "Unknown error",
        })
      }
    }

    // Process PayPal batch payout if there are any PayPal payouts
    if (payment_method === "paypal" && paypalPayoutItems.length > 0) {
      try {
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
          if (item.payoutId) {
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

            // Update result for this vendor
            const resultIndex = results.findIndex((r) => r.payout_id === item.payoutId)
            if (resultIndex >= 0) {
              results[resultIndex] = {
                ...results[resultIndex],
                payout_batch_id: batchId,
                status: batchStatus.toLowerCase(),
              }
            }

            // If status is SUCCESS, send notification (webhook will handle this, but we can also do it here for immediate feedback)
            if (batchStatus === "SUCCESS" && updatedPayout) {
              await notifyPayoutProcessed(item.vendorName, {
                vendorName: item.vendorName,
                amount: item.amount,
                currency: item.currency || "USD",
                payoutDate: updatedPayout.payout_date || updatedPayout.created_at,
                reference: updatedPayout.reference || `PAY-${item.payoutId}`,
                invoiceNumber: updatedPayout.invoice_number || undefined,
                productCount: updatedPayout.product_count || 0,
                payoutBatchId: batchId,
                invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/vendors/payouts/${item.payoutId}/invoice`,
              })
            }
          }
        }
      } catch (paypalError: any) {
        console.error("PayPal batch payout error:", paypalError)
        
        // Mark all PayPal payouts as failed
        for (const item of paypalPayoutItems) {
          if (item.payoutId) {
            const { data: failedPayout } = await supabase
              .from("vendor_payouts")
              .update({
                status: "failed",
                notes: `PayPal payout failed: ${paypalError.message}`,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.payoutId)
              .select()
              .single()

            // Update result for this vendor
            const resultIndex = results.findIndex((r) => r.payout_id === item.payoutId)
            if (resultIndex >= 0) {
              results[resultIndex] = {
                ...results[resultIndex],
                success: false,
                error: `PayPal error: ${paypalError.message}`,
              }
            }

            // Send failure notification
            if (failedPayout) {
              await notifyPayoutFailed(item.vendorName, {
                vendorName: item.vendorName,
                amount: item.amount,
                currency: item.currency || "USD",
                reference: failedPayout.reference || `PAY-${item.payoutId}`,
                errorMessage: paypalError.message || "PayPal payout failed",
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      total: payouts.length,
      results,
    })
  } catch (error: any) {
    console.error("Error in process payouts API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

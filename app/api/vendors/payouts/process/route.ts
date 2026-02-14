import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { processPayouts, type PaymentMethod } from "@/lib/payout-processor"
import { notifyPayoutProcessed, notifyPayoutFailed } from "@/lib/notifications/payout-notifications"
import { DEFAULT_PAYOUT_PERCENTAGE } from "@/lib/payout-calculator"
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

    if (!payment_method) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 })
    }

    // Step 1: Create payout records and associate line items
    const payoutRecords: Array<{
      vendor_name: string
      amount: number
      product_count: number
      payout_id: number
      reference: string
    }> = []

    for (const payout of payouts) {
      try {
        const { vendor_name, amount, product_count } = payout

        if (!vendor_name || !amount) {
          console.warn(`[payouts/process] Skipping payout record: missing vendor_name or amount`, payout)
          continue
        }

        console.log(`[payouts/process] Creating payout record for ${vendor_name} ($${amount})`)

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
            status: "pending",
            reference,
            product_count: product_count || 0,
            payment_method: payment_method as PaymentMethod,
            currency: "USD",
            invoice_number: invoiceNumber,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()

        if (error || !data || data.length === 0) {
          console.error(`Error creating payout for ${vendor_name}:`, error)
          continue
        }

        const payoutId = data[0].id

        // LEGACY: Get pending line items via RPC for audit/display only, NOT for money calculations.
        // @deprecated — The authoritative balance comes from the ledger (collector_ledger_entries).
        console.log(`[payouts/process] Fetching pending line items for ${vendor_name}`)
        const { data: lineItems, error: lineItemsError } = await supabase.rpc("get_vendor_pending_line_items", {
          p_vendor_name: vendor_name,
        })

        if (lineItemsError) {
          console.error(`Error fetching line items for ${vendor_name}:`, lineItemsError)
          continue
        }

        if (!lineItems || lineItems.length === 0) {
          console.warn(`[payouts/process] No pending line items found for ${vendor_name}. Payout record created but no items associated.`)
          // We still keep the payout record as the admin manually initiated it with a specific amount
          // but we won't have individual line items linked to it.
        } else {
          // Associate line items with this payout
          // Use payout settings from the RPC (which pulls from product_vendor_payouts)
          const payoutItems = lineItems.map((item: any) => {
            const price = Number(item.price)
            const orderDate = new Date(item.created_at)
            const october2025 = new Date('2025-10-01')
            
            // Calculate amount for this item based on its settings
            let payoutAmount = item.is_percentage 
              ? (price * (item.payout_amount || DEFAULT_PAYOUT_PERCENTAGE)) / 100 
              : (item.payout_amount || (price * DEFAULT_PAYOUT_PERCENTAGE) / 100)
            
            // Maintain $10 minimum for historical orders (pre-October 2025)
            if (orderDate < october2025 && payoutAmount < 10) {
              payoutAmount = 10
            }

            return {
              payout_id: payoutId,
              line_item_id: item.line_item_id,
              order_id: item.order_id,
              product_id: item.product_id,
              amount: payoutAmount,
              created_at: new Date().toISOString(),
            }
          })

          await supabase.from("vendor_payout_items").insert(payoutItems)
        }

        payoutRecords.push({
          vendor_name,
          amount: parseFloat(amount.toString()),
          product_count: product_count || 0,
          payout_id: payoutId,
          reference,
        })
      } catch (err: any) {
        console.error(`Error creating payout record for ${payout.vendor_name}:`, err)
      }
    }

    if (payoutRecords.length === 0) {
      return NextResponse.json({ error: "No valid payouts to process" }, { status: 400 })
    }

    // Step 2: Process payouts using unified processor
    const processorResults = await processPayouts(
      payoutRecords.map((record) => ({
        vendor_name: record.vendor_name,
        amount: record.amount,
        product_count: record.product_count,
        payout_id: record.payout_id,
        reference: record.reference,
      })),
      {
        payment_method: payment_method as PaymentMethod,
        generate_invoices,
        notes,
        supabase,
      }
    )

    // Step 3: Send notifications for successful/failed payouts
    for (const result of processorResults) {
      if (result.success && (result.status === "completed" || result.status === "processing")) {
        const record = payoutRecords.find((r) => r.vendor_name === result.vendor_name)
        if (record) {
          const { data: payout } = await supabase
            .from("vendor_payouts")
            .select("*")
            .eq("id", record.payout_id)
            .single()

          if (payout) {
            await notifyPayoutProcessed(result.vendor_name, {
              vendorName: result.vendor_name,
              amount: record.amount,
              currency: "USD",
              payoutDate: payout.payout_date || payout.created_at,
              reference: record.reference,
              invoiceNumber: payout.invoice_number || undefined,
              productCount: record.product_count,
              payoutBatchId: result.batch_id,
              invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/vendors/payouts/${record.payout_id}/invoice`,
            })
          }
        }
      } else if (!result.success) {
        const record = payoutRecords.find((r) => r.vendor_name === result.vendor_name)
        if (record) {
          await notifyPayoutFailed(result.vendor_name, {
            vendorName: result.vendor_name,
            amount: record.amount,
            currency: "USD",
            reference: record.reference,
            errorMessage: result.error || "Payout processing failed",
          })
        }
      }
    }

    const processedCount = processorResults.filter((r) => r.success).length
    const results = processorResults.map((result) => ({
      vendor_name: result.vendor_name,
      success: result.success,
      payout_id: result.payout_id,
      reference: result.reference,
      status: result.status,
      error: result.error,
      transfer_id: result.transfer_id,
      batch_id: result.batch_id,
    }))

    return NextResponse.json({
      success: true,
      processed: processedCount,
      total: payoutRecords.length,
      results,
    })
  } catch (error: any) {
    console.error("Error in process payouts API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

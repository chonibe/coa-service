import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    // This would normally check for admin authentication, but we're skipping it for brevity

    // Get the request body
    const body = await request.json()
    const { payouts, payment_method, generate_invoices, notes } = body

    if (!payouts || !Array.isArray(payouts) || payouts.length === 0) {
      return NextResponse.json({ error: "No payouts provided" }, { status: 400 })
    }

    // Process each payout
    const results = []
    let processedCount = 0

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
        const { data, error } = await supabaseAdmin
          .from("vendor_payouts")
          .insert({
            vendor_name,
            amount,
            status: "pending", // Start as pending
            reference,
            product_count: product_count || 0,
            payment_method: payment_method || "paypal",
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

        // Get all pending line items for this vendor
        const { data: lineItems, error: lineItemsError } = await supabaseAdmin.rpc("get_vendor_pending_line_items", {
          p_vendor_name: vendor_name,
        })

        if (lineItemsError) {
          console.error(`Error fetching line items for ${vendor_name}:`, lineItemsError)
          // Continue with the payout even if we can't fetch line items
        } else if (lineItems && lineItems.length > 0) {
          // Associate line items with this payout
          const payoutItems = lineItems.map((item) => ({
            payout_id: payoutId,
            line_item_id: item.line_item_id,
            order_id: item.order_id,
            product_id: item.product_id,
            amount: item.is_percentage ? (item.price * item.payout_amount) / 100 : item.payout_amount,
            created_at: new Date().toISOString(),
          }))

          const { error: insertError } = await supabaseAdmin.from("vendor_payout_items").insert(payoutItems)

          if (insertError) {
            console.error(`Error associating line items with payout for ${vendor_name}:`, insertError)
            // Continue with the payout even if we can't associate line items
          }
        }

        // If using PayPal, we would initiate the PayPal payout here
        // For now, we'll just simulate it
        if (payment_method === "paypal") {
          // Simulate PayPal payout
          const paypalSuccess = Math.random() > 0.1 // 90% success rate for simulation

          if (paypalSuccess) {
            // Update the payout status to completed
            await supabaseAdmin
              .from("vendor_payouts")
              .update({
                status: "completed",
                payout_date: new Date().toISOString(),
                payment_id: `PAYPAL-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
                updated_at: new Date().toISOString(),
              })
              .eq("id", payoutId)

            results.push({
              vendor_name,
              success: true,
              payout_id: payoutId,
              reference,
            })

            processedCount++
          } else {
            // Update the payout status to failed
            await supabaseAdmin
              .from("vendor_payouts")
              .update({
                status: "failed",
                notes: (notes ? notes + " | " : "") + "PayPal payout failed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", payoutId)

            results.push({
              vendor_name,
              success: false,
              error: "PayPal payout failed",
            })
          }
        } else {
          // For other payment methods, mark as processing
          await supabaseAdmin
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

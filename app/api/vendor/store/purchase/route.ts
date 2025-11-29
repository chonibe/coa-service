import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

// Proof print price constant
const PROOF_PRINT_PRICE = 8.00

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { purchaseType, productSku, artworkSubmissionId, paymentMethod, externalPaymentId } = body

    if (!purchaseType || (purchaseType !== "lamp" && purchaseType !== "proof_print")) {
      return NextResponse.json(
        { error: "Invalid purchase type. Must be 'lamp' or 'proof_print'" },
        { status: 400 }
      )
    }

    // SKU will be determined automatically based on vendor location if not provided

    if (purchaseType === "proof_print" && !artworkSubmissionId) {
      return NextResponse.json(
        { error: "Artwork submission ID is required for proof print purchases" },
        { status: 400 }
      )
    }

    if (!paymentMethod || (paymentMethod !== "payout_balance" && paymentMethod !== "external")) {
      return NextResponse.json(
        { error: "Invalid payment method. Must be 'payout_balance' or 'external'" },
        { status: 400 }
      )
    }

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name, has_used_lamp_discount, tax_country, address")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    let unitPrice = 0
    let discountPercentage: number | null = null
    let totalAmount = 0
    const quantity = 1
    let finalProductSku = productSku

    // Calculate pricing based on purchase type
    if (purchaseType === "lamp") {
      // Determine correct SKU based on vendor location if not provided
      if (!finalProductSku) {
        const isUS = vendor.tax_country?.toUpperCase() === "US" || 
                     vendor.tax_country?.toUpperCase() === "USA" ||
                     (vendor.address && /united states|usa|us\b/i.test(vendor.address))
        finalProductSku = isUS ? "streetlamp002" : "streetlamp001"
      }

      // Validate SKU matches vendor location
      const isUS = vendor.tax_country?.toUpperCase() === "US" || 
                   vendor.tax_country?.toUpperCase() === "USA" ||
                   (vendor.address && /united states|usa|us\b/i.test(vendor.address))
      const expectedSku = isUS ? "streetlamp002" : "streetlamp001"
      
      if (finalProductSku !== expectedSku) {
        return NextResponse.json(
          { 
            error: "Invalid SKU for your location", 
            message: `Based on your address, you should purchase ${expectedSku} (${isUS ? "US" : "EU"} version)` 
          },
          { status: 400 }
        )
      }

      // For Lamp purchases, we need to get the regular price
      // For now, we'll use a placeholder - this should be fetched from Shopify or configured
      const regularPrice = 100 // TODO: Fetch from Shopify or configuration
      const isDiscountEligible = !vendor.has_used_lamp_discount

      if (isDiscountEligible) {
        discountPercentage = 50
        unitPrice = regularPrice * 0.5 // 50% discount
      } else {
        unitPrice = regularPrice
      }
      totalAmount = unitPrice * quantity
    } else if (purchaseType === "proof_print") {
      // Proof prints are always $8
      unitPrice = PROOF_PRINT_PRICE
      totalAmount = unitPrice * quantity

      // Check proof print limit (max 2 per artwork)
      const { data: existingProofPrint, error: proofPrintError } = await supabase
        .from("vendor_proof_prints")
        .select("quantity_ordered")
        .eq("vendor_id", vendor.id)
        .eq("submission_id", artworkSubmissionId)
        .single()

      if (proofPrintError && proofPrintError.code !== "PGRST116") {
        // PGRST116 is "not found" which is OK for first purchase
        console.error("Error checking proof print:", proofPrintError)
        return NextResponse.json(
          { error: "Failed to check proof print eligibility", message: proofPrintError.message },
          { status: 500 }
        )
      }

      const quantityOrdered = existingProofPrint?.quantity_ordered || 0
      if (quantityOrdered >= 2) {
        return NextResponse.json(
          { error: "Maximum of 2 proof prints allowed per artwork" },
          { status: 400 }
        )
      }
    }

    // Check balance if using payout_balance
    let payoutBalanceUsed: number | null = null
    if (paymentMethod === "payout_balance") {
      // Calculate available balance
      const { data: ledgerEntries, error: ledgerError } = await supabase
        .from("vendor_ledger_entries")
        .select("amount, entry_type")
        .eq("vendor_name", vendorName)

      if (ledgerError) {
        console.error("Error fetching ledger entries:", ledgerError)
        return NextResponse.json(
          { error: "Failed to calculate balance", message: ledgerError.message },
          { status: 500 }
        )
      }

      let balance = 0
      ledgerEntries?.forEach((entry) => {
        if (entry.entry_type === "payout" || entry.entry_type === "adjustment") {
          balance += Number(entry.amount) || 0
        } else if (entry.entry_type === "refund_deduction" || entry.entry_type === "store_purchase") {
          balance -= Math.abs(Number(entry.amount)) || 0
        }
      })

      const availableBalance = Math.max(0, balance)

      if (availableBalance < totalAmount) {
        return NextResponse.json(
          {
            error: "Insufficient balance",
            availableBalance,
            requiredAmount: totalAmount,
          },
          { status: 400 }
        )
      }

      payoutBalanceUsed = totalAmount
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("vendor_store_purchases")
      .insert({
        vendor_id: vendor.id,
        vendor_name: vendor.vendor_name,
        purchase_type: purchaseType,
        product_sku: purchaseType === "lamp" ? finalProductSku : null,
        artwork_submission_id: purchaseType === "proof_print" ? artworkSubmissionId : null,
        quantity,
        unit_price: unitPrice,
        discount_percentage: discountPercentage,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payout_balance_used: payoutBalanceUsed,
        external_payment_id: paymentMethod === "external" ? externalPaymentId : null,
        status: "pending",
      })
      .select()
      .single()

    if (purchaseError) {
      console.error("Error creating purchase:", purchaseError)
      return NextResponse.json(
        { error: "Failed to create purchase", message: purchaseError.message },
        { status: 500 }
      )
    }

    // Create ledger entry if using payout balance
    if (paymentMethod === "payout_balance" && payoutBalanceUsed) {
      const { error: ledgerEntryError } = await supabase.from("vendor_ledger_entries").insert({
        vendor_name: vendorName,
        amount: -Math.abs(payoutBalanceUsed), // Negative amount for deduction
        entry_type: "store_purchase",
        description: `Store purchase: ${purchaseType === "lamp" ? `Lamp ${productSku}` : "Proof print"}`,
        created_by: "system",
        metadata: {
          purchase_id: purchase.id,
          purchase_type: purchaseType,
        },
      })

      if (ledgerEntryError) {
        console.error("Error creating ledger entry:", ledgerEntryError)
        // Don't fail the purchase, but log the error
      }
    }

    // Update vendor records based on purchase type
    if (purchaseType === "lamp") {
      // Update has_used_lamp_discount if discount was applied
      if (discountPercentage && discountPercentage > 0) {
        const { error: updateVendorError } = await supabase
          .from("vendors")
          .update({ has_used_lamp_discount: true })
          .eq("id", vendor.id)

        if (updateVendorError) {
          console.error("Error updating vendor discount flag:", updateVendorError)
        }

        // Create lamp purchase record
        await supabase.from("vendor_lamp_purchases").insert({
          vendor_id: vendor.id,
          vendor_name: vendor.vendor_name,
          product_sku: finalProductSku!,
          purchase_price: totalAmount,
          discount_applied: true,
        })
      }
    } else if (purchaseType === "proof_print") {
      // Update or create proof print record
      const { data: existingProofPrint } = await supabase
        .from("vendor_proof_prints")
        .select("id, quantity_ordered")
        .eq("vendor_id", vendor.id)
        .eq("submission_id", artworkSubmissionId)
        .single()

      // Get artwork details from submission
      const { data: submission } = await supabase
        .from("vendor_product_submissions")
        .select("product_data")
        .eq("id", artworkSubmissionId)
        .single()

      const productData = (submission?.product_data as any) || {}
      const artworkTitle = productData.title || "Untitled Artwork"
      let imageUrl = null
      if (productData.images && productData.images.length > 0) {
        imageUrl = productData.images[0].src || productData.images[0]
      }

      if (existingProofPrint) {
        // Update existing record
        await supabase
          .from("vendor_proof_prints")
          .update({
            quantity_ordered: existingProofPrint.quantity_ordered + 1,
            last_ordered_at: new Date().toISOString(),
          })
          .eq("id", existingProofPrint.id)
      } else {
        // Create new record
        await supabase.from("vendor_proof_prints").insert({
          vendor_id: vendor.id,
          submission_id: artworkSubmissionId,
          artwork_title: artworkTitle,
          artwork_image_url: imageUrl,
          quantity_ordered: 1,
          last_ordered_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      purchase,
      message: "Purchase created successfully",
    })
  } catch (error: any) {
    console.error("Error processing purchase:", error)
    return NextResponse.json(
      { error: "Failed to process purchase", message: error.message },
      { status: 500 }
    )
  }
}


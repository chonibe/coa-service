import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateInvoiceBuffer } from "@/lib/invoices/generator"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const payoutId = params.id

    // Get payout details
    const { data: payout, error: payoutError } = await supabase
      .from("vendor_payouts")
      .select("*")
      .eq("id", payoutId)
      .single()

    if (payoutError || !payout) {
      return NextResponse.json(
        { error: "Payout not found" },
        { status: 404 }
      )
    }

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_name", payout.vendor_name)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    // Get line items for this payout
    const { data: payoutItems, error: itemsError } = await supabase
      .from("vendor_payout_items")
      .select(`
        *,
        order_line_items_v2 (
          order_id,
          order_name,
          product_id,
          price,
          quantity
        )
      `)
      .eq("payout_id", payoutId)

    if (itemsError) {
      console.error("Error fetching payout items:", itemsError)
    }

    // Get product details for line items
    const lineItems = await Promise.all(
      (payoutItems || []).map(async (item: any) => {
        const lineItem = item.order_line_items_v2
        if (!lineItem) return null

        // Get product title
        const { data: product } = await supabase
          .from("products")
          .select("name, product_id")
          .or(`product_id.eq.${lineItem.product_id},id.eq.${lineItem.product_id}`)
          .single()

        return {
          productTitle: product?.name || `Product ${lineItem.product_id}`,
          orderId: lineItem.order_id,
          orderName: lineItem.order_name,
          quantity: lineItem.quantity || 1,
          unitPrice: lineItem.price || 0,
          payoutAmount: item.amount || 0,
        }
      })
    )

    // Filter out null items
    const validLineItems = lineItems.filter((item) => item !== null) as Array<{
      productTitle: string
      orderId: string
      orderName?: string
      quantity: number
      unitPrice: number
      payoutAmount: number
    }>

    // Generate invoice
    const invoiceData = {
      invoiceNumber: payout.invoice_number || `INV-${payout.id}`,
      payoutId: payout.id,
      vendorName: payout.vendor_name,
      vendorEmail: vendor.paypal_email || undefined,
      vendorTaxId: vendor.tax_id || undefined,
      vendorTaxCountry: vendor.tax_country || undefined,
      vendorIsCompany: vendor.is_company || false,
      payoutDate: payout.payout_date || payout.created_at,
      payoutAmount: parseFloat(payout.amount.toString()),
      currency: payout.currency || "USD",
      taxRate: parseFloat((payout.tax_rate || 0).toString()),
      taxAmount: parseFloat((payout.tax_amount || 0).toString()),
      lineItems: validLineItems,
      reference: payout.reference || undefined,
      payoutBatchId: payout.payout_batch_id || undefined,
      paymentMethod: payout.payment_method || "paypal",
      notes: payout.notes || undefined,
    }

    const pdfBuffer = generateInvoiceBuffer(invoiceData)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Error generating invoice:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate invoice" },
      { status: 500 }
    )
  }
}


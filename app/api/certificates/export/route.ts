import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import { generateCertificate } from "@/lib/certificate-generator"

type LineItemWithRelations = {
  line_item_id: string
  order_id: string
  product_id: string
  title: string
  quantity: number
  status: string
  edition_number: number | null
  edition_total: number | null
  certificate_url: string | null
  certificate_token: string | null
  certificate_generated_at: string | null
  nfc_tag_id: string | null
  nfc_claimed_at: string | null
  created_at: string
  orders: {
    name: string
    created_at: string
  } | null
  products: {
    title: string
    vendor_name: string
    collection_name: string
  } | null
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client using the server-side method
    const supabase = createClient()

    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get("product_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    // Build the base query
    let query = supabase
      .from("order_line_items_v2")
      .select(`
        line_item_id,
        order_id,
        product_id,
        title,
        quantity,
        status,
        edition_number,
        edition_total,
        certificate_url,
        certificate_token,
        certificate_generated_at,
        nfc_tag_id,
        nfc_claimed_at,
        created_at,
        orders (name, created_at),
        products (title, vendor_name, collection_name)
      `)
      .eq("status", "active")

    // Add product filter if provided
    if (productId) {
      query = query.eq("product_id", productId)
    }

    // Add date range filter if provided
    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    // Execute the query
    const { data: lineItems, error } = await query as { data: LineItemWithRelations[] | null, error: any }

    if (error) {
      console.error("Error fetching line items:", error)
      return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 })
    }

    // Prepare certificates data
    const certificates = await Promise.all((lineItems || []).map(async (item) => {
      const certificateData = {
        lineItem: {
          id: item.line_item_id,
          title: item.title,
          quantity: item.quantity,
          editionNumber: item.edition_number,
          editionTotal: item.edition_total,
          nfcTagId: item.nfc_tag_id,
          nfcClaimedAt: item.nfc_claimed_at,
        },
        product: {
          id: item.product_id,
          title: item.products?.title || "Unknown Product",
          vendorName: item.products?.vendor_name || "Unknown Vendor",
          collectionName: item.products?.collection_name || "Unknown Collection",
        },
        order: {
          name: item.orders?.name || "Unknown Order",
          createdAt: item.orders?.created_at || item.created_at,
        },
        additionalInfo: null,
      }

      // Generate or retrieve certificate URL
      const certificateUrl = await generateCertificate(certificateData)

      return {
        lineItemId: item.line_item_id,
        productTitle: certificateData.product.title,
        vendorName: certificateData.product.vendorName,
        collectionName: certificateData.product.collectionName,
        orderName: certificateData.order.name,
        orderDate: formatDate(certificateData.order.createdAt),
        editionNumber: item.edition_number,
        editionTotal: item.edition_total,
        certificateUrl,
        certificateToken: item.certificate_token,
        nfcTagId: item.nfc_tag_id,
        nfcClaimedAt: item.nfc_claimed_at ? formatDate(item.nfc_claimed_at) : null,
      }
    }))

    // Prepare CSV content
    const csvHeaders = [
      "Line Item ID", 
      "Product Title", 
      "Vendor Name", 
      "Collection Name", 
      "Order Name", 
      "Order Date", 
      "Edition Number", 
      "Edition Total", 
      "Certificate URL", 
      "Certificate Token", 
      "NFC Tag ID", 
      "NFC Claimed At"
    ]

    const csvContent = [
      csvHeaders.join(","),
      ...certificates.map(cert => [
        cert.lineItemId,
        `"${cert.productTitle}"`,
        `"${cert.vendorName}"`,
        `"${cert.collectionName}"`,
        `"${cert.orderName}"`,
        cert.orderDate,
        cert.editionNumber,
        cert.editionTotal,
        cert.certificateUrl,
        cert.certificateToken,
        cert.nfcTagId || "",
        cert.nfcClaimedAt || ""
      ].join(","))
    ].join("\n")

    // Set headers for CSV download
    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set("Content-Disposition", `attachment; filename="certificates_export_${new Date().toISOString().split('T')[0]}.csv"`)

    return new NextResponse(csvContent, { 
      status: 200, 
      headers 
    })
  } catch (error: any) {
    console.error("Unexpected error in certificates export:", error)
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred" 
    }, { status: 500 })
  }
}

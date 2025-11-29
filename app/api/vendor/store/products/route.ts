import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

// Proof print price constant
const PROOF_PRINT_PRICE = 8.00

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const cookieStore = cookies()
  const vendorName = getVendorFromCookieStore(cookieStore)

  if (!vendorName) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Get vendor info to check discount eligibility
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name, has_used_lamp_discount")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Lamp products - these are the core products available
    // Using streetlamp001 and streetlamp002 as the SKUs
    const lampProducts = [
      {
        sku: "streetlamp001",
        name: "Street Lamp 001",
        type: "lamp" as const,
        regularPrice: 0, // Will need to be configured or fetched from Shopify
        discountEligible: !vendor.has_used_lamp_discount,
        discountPercentage: vendor.has_used_lamp_discount ? 0 : 50,
      },
      {
        sku: "streetlamp002",
        name: "Street Lamp 002",
        type: "lamp" as const,
        regularPrice: 0, // Will need to be configured or fetched from Shopify
        discountEligible: !vendor.has_used_lamp_discount,
        discountPercentage: vendor.has_used_lamp_discount ? 0 : 50,
      },
    ]

    // Proof print product
    const proofPrintProduct = {
      type: "proof_print" as const,
      name: "Proof Print",
      price: PROOF_PRINT_PRICE,
      description: "Purchase a proof print of your artwork (up to 2 per artwork)",
    }

    return NextResponse.json({
      success: true,
      products: {
        lamps: lampProducts,
        proofPrints: proofPrintProduct,
      },
    })
  } catch (error: any) {
    console.error("Error fetching store products:", error)
    return NextResponse.json(
      { error: "Failed to fetch store products", message: error.message },
      { status: 500 }
    )
  }
}


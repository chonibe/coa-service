/**
 * API: Get vendor products (RBAC v2 - Example Migration)
 * 
 * This demonstrates using the new withVendor middleware which automatically
 * provides the vendor_id from JWT claims.
 * 
 * Old way:
 * ```typescript
 * const auth = await guardVendorRequest(request)
 * if (auth.kind !== "ok") return auth.response
 * const vendorName = auth.vendorName
 * ```
 * 
 * New way:
 * ```typescript
 * export const GET = withVendor(async (request, { user }) => {
 *   const vendorId = user.vendorId // Available from JWT
 * })
 * ```
 */

import { NextRequest, NextResponse } from "next/server"
import { withVendor } from "@/lib/rbac/middleware"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export const GET = withVendor(async (request: NextRequest, { user }) => {
  try {
    if (!user.vendorId) {
      return NextResponse.json(
        { error: "Vendor ID not found in user context" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get vendor info first
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("vendor_name")
      .eq("id", user.vendorId)
      .single()

    if (vendorError || !vendor) {
      console.error("[vendor/products-new] Error fetching vendor:", vendorError)
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }

    // Get products for this vendor
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_name", vendor.vendor_name)
      .order("created_at", { ascending: false })

    if (productsError) {
      console.error("[vendor/products-new] Error fetching products:", productsError)
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      products,
      vendor: {
        id: user.vendorId,
        name: vendor.vendor_name,
      },
      _debug: {
        requestedBy: user.email,
        vendorId: user.vendorId,
        roles: user.roles,
      },
    })
  } catch (error: any) {
    console.error("[vendor/products-new] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
})

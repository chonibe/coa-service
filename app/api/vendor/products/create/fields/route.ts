import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { fetchMetafieldDefinitions } from "@/lib/shopify/metafields"
import { createClient } from "@/lib/supabase/server"
import type { ProductCreationFields } from "@/types/product-submission"

// Cache metafield definitions for 24 hours
let metafieldCache: { definitions: any[]; timestamp: number } | null = null
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get vendor info
    const supabase = createClient()
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Fetch metafield definitions (with caching)
    let metafieldDefinitions
    const now = Date.now()
    
    if (metafieldCache && now - metafieldCache.timestamp < CACHE_DURATION) {
      metafieldDefinitions = metafieldCache.definitions
    } else {
      metafieldDefinitions = await fetchMetafieldDefinitions()
      metafieldCache = {
        definitions: metafieldDefinitions,
        timestamp: now,
      }
    }

    // Standard Shopify product fields
    const fields = [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Product title",
      },
      {
        name: "description",
        type: "html",
        required: false,
        description: "Product description (HTML supported)",
      },
      {
        name: "product_type",
        type: "string",
        required: false,
        description: "Product type or category",
      },
      {
        name: "handle",
        type: "string",
        required: false,
        description: "URL-friendly product handle (auto-generated if not provided)",
      },
      {
        name: "vendor",
        type: "string",
        required: true,
        description: "Vendor name",
      },
      {
        name: "tags",
        type: "array",
        required: false,
        description: "Product tags (comma-separated)",
      },
    ]

    // Get vendor collection info if it exists
    const { data: vendorCollection } = await supabase
      .from("vendor_collections")
      .select("*")
      .eq("vendor_id", vendor.id)
      .maybeSingle()

    const response: ProductCreationFields = {
      fields,
      metafields: metafieldDefinitions,
      vendor_collections: vendorCollection ? [vendorCollection] : undefined,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Error fetching product creation fields:", error)
    return NextResponse.json(
      { error: "Failed to fetch fields", message: error.message },
      { status: 500 },
    )
  }
}


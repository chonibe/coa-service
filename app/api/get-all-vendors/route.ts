import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET(request: NextRequest) {
  try {
    // Fetch all distinct vendor names from order_line_items table
    const { data: supabaseVendors, error: supabaseError } = await supabase
      .from("order_line_items")
      .select("vendor")
      .distinct()

    if (supabaseError) {
      console.error("Error fetching vendors from database:", supabaseError)
      throw new Error("Failed to fetch vendors from database")
    }

    // Extract only the vendor names from the query result
    const vendors = supabaseVendors.map((item) => item.vendor)

    // Fetch all products from Shopify to extract vendors
    const shopifyVendors = await fetchAllShopifyVendors()

    // Combine vendors from Supabase and Shopify, removing duplicates
    const allVendors = [...new Set([...vendors, ...shopifyVendors])]

    return NextResponse.json({
      vendors: allVendors,
    })
  } catch (error: any) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json(
      {
        message: "Error fetching vendors",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Function to fetch all vendors from Shopify
async function fetchAllShopifyVendors() {
  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2024-04/products.json?limit=250`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch products: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const products = data.products || []

    // Extract unique vendor names from products
    const vendorSet = new Set<string>()
    products.forEach((product: any) => {
      vendorSet.add(product.vendor)
    })

    return Array.from(vendorSet)
  } catch (error) {
    console.error("Error fetching Shopify vendors:", error)
    return []
  }
}

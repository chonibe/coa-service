import { type NextRequest, NextResponse } from "next/server"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"
import { supabase } from "/dev/null"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "100", 10)
    const cursor = searchParams.get("cursor") || null

    // Fetch vendors from Shopify products
    const { vendors, nextCursor, totalCount } = await fetchVendorsFromProducts(query, limit, cursor)

    // Fetch custom data for these vendors
    if (vendors.length > 0) {
      const vendorNames = vendors.map((v) => v.name)

      console.log("Fetching custom data for vendors:", vendorNames)

      // Fetch all vendor data from the database
      const { data: customData, error } = await supabase.from("vendors").select("*").in("vendor_name", vendorNames)

      if (error) {
        console.error("Error fetching vendor custom data:", error)
      } else if (customData && customData.length > 0) {
        console.log("Found custom data for vendors:", customData.length)

        // Create a map of vendor name to custom data
        const customDataMap = new Map(customData.map((item) => [item.vendor_name, item]))

        // Merge custom data with vendor data
        vendors.forEach((vendor) => {
          const custom = customDataMap.get(vendor.name)
          if (custom) {
            vendor.instagram_url = custom.instagram_url
            vendor.notes = custom.notes
            console.log("Merged custom data for vendor:", vendor.name, vendor.instagram_url)
          }
        })
      } else {
        console.log("No custom data found for vendors")
      }
    }

    return NextResponse.json({
      vendors,
      pagination: {
        total: totalCount,
        limit,
        cursor: nextCursor,
        hasMore: !!nextCursor,
      },
    })
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}

async function fetchVendorsFromProducts(query = "", limit = 100, cursor = null) {
  try {
    // Build the GraphQL query to fetch products and extract vendor information
    const graphqlQuery = `
      {
        products(
          first: 250
          ${cursor ? `after: "${cursor}"` : ""}
          ${query ? `query: "vendor:*${query}*"` : ""}
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              vendor
              productType
              totalInventory
              createdAt
              updatedAt
            }
          }
        }
      }
    `

    // Make the request to Shopify
    const response = await shopifyFetch("graphql.json", {
      method: "POST",
      body: JSON.stringify({ query: graphqlQuery }),
    })

    const data = await safeJsonParse(response)

    if (!data || !data.data || !data.data.products) {
      console.error("Invalid response from Shopify GraphQL API:", data)
      throw new Error("Invalid response from Shopify GraphQL API")
    }

    // Extract products
    const products = data.data.products.edges.map((edge: any) => edge.node)

    // Extract and count unique vendors
    const vendorMap = new Map()

    for (const product of products) {
      if (product.vendor) {
        // If we already have this vendor, update the product count
        if (vendorMap.has(product.vendor)) {
          const vendorData = vendorMap.get(product.vendor)
          vendorData.productCount++
        } else {
          // Otherwise, add a new vendor
          vendorMap.set(product.vendor, {
            name: product.vendor,
            productCount: 1,
            lastUpdated: product.updatedAt,
          })
        }
      }
    }

    // Convert the map to an array and sort by vendor name
    const vendors = Array.from(vendorMap.entries()).map(([name, data]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name,
      product_count: data.productCount,
      last_updated: data.lastUpdated,
      instagram_url: null, // Will be populated later if available
      notes: null, // Will be populated later if available
    }))

    // Sort vendors by name (case-insensitive)
    vendors.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

    // Return the vendors, pagination info, and total count
    return {
      vendors,
      nextCursor: data.data.products.pageInfo.hasNextPage ? data.data.products.pageInfo.endCursor : null,
      totalCount: vendors.length, // This is just the count of vendors on this page
    }
  } catch (error) {
    console.error("Error fetching vendors from Shopify products:", error)
    throw error
  }
}

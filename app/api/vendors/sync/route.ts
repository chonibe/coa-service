import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Check if this is a full sync or incremental
    const { searchParams } = new URL(request.url)
    const fullSync = searchParams.get("full") === "true"

    console.log(`Starting ${fullSync ? "full" : "incremental"} vendor sync`)

    // Get the last sync timestamp if doing an incremental sync
    let lastSyncedAt = null
    if (!fullSync) {
      const { data: syncData } = await supabase
        .from("vendors")
        .select("last_synced_at")
        .order("last_synced_at", { ascending: false })
        .limit(1)

      if (syncData && syncData.length > 0) {
        lastSyncedAt = syncData[0].last_synced_at
      }
    }

    // Fetch vendors from Shopify
    const vendors = await fetchVendorsFromShopify(lastSyncedAt)
    console.log(`Fetched ${vendors.length} vendors from Shopify`)

    // Process and store vendors
    const results = await processVendors(vendors)

    // Update the last synced timestamp
    const now = new Date().toISOString()

    // Log the sync operation
    await supabase.from("sync_logs").insert({
      created_at: now,
      type: "vendors_sync",
      details: {
        vendorsProcessed: vendors.length,
        vendorsAdded: results.added,
        vendorsUpdated: results.updated,
        fullSync: fullSync,
      },
    })

    return NextResponse.json({
      success: true,
      vendorsProcessed: vendors.length,
      vendorsAdded: results.added,
      vendorsUpdated: results.updated,
      timestamp: now,
    })
  } catch (error: any) {
    console.error("Error syncing vendors:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to sync vendors",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

/**
 * Fetch vendors from Shopify
 */
async function fetchVendorsFromShopify(lastSyncedAt: string | null = null) {
  let allVendors: any[] = []
  let pageInfo = null
  let hasNextPage = true

  try {
    // First, we need to get all products to extract vendor information
    while (hasNextPage) {
      // Build the GraphQL query
      const query = `
        {
          products(first: 250${pageInfo ? `, after: "${pageInfo}"` : ""}) {
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
                createdAt
                updatedAt
                totalInventory
              }
            }
          }
        }
      `

      // Make the request to Shopify
      const response = await shopifyFetch("graphql.json", {
        method: "POST",
        body: JSON.stringify({ query }),
      })

      const data = await safeJsonParse(response)

      if (!data || !data.data || !data.data.products) {
        console.error("Invalid response from Shopify GraphQL API:", data)
        throw new Error("Invalid response from Shopify GraphQL API")
      }

      // Extract products
      const products = data.data.products.edges.map((edge: any) => edge.node)

      // Extract unique vendors
      const vendorMap = new Map()

      for (const product of products) {
        if (product.vendor) {
          // If we already have this vendor, update the product count
          if (vendorMap.has(product.vendor)) {
            const vendorData = vendorMap.get(product.vendor)
            vendorData.productCount++

            // Update the vendor data if this product is newer
            const productUpdatedAt = new Date(product.updatedAt)
            if (productUpdatedAt > new Date(vendorData.updatedAt)) {
              vendorData.updatedAt = product.updatedAt
            }
          } else {
            // Otherwise, add a new vendor
            vendorMap.set(product.vendor, {
              name: product.vendor,
              productCount: 1,
              createdAt: product.createdAt,
              updatedAt: product.updatedAt,
            })
          }
        }
      }

      // Convert the map to an array and add to our results
      const vendorsFromPage = Array.from(vendorMap.values())
      allVendors = [...allVendors, ...vendorsFromPage]

      // Check if there are more pages
      pageInfo = data.data.products.pageInfo.hasNextPage ? data.data.products.pageInfo.endCursor : null
      hasNextPage = data.data.products.pageInfo.hasNextPage
    }

    // Deduplicate vendors (in case the same vendor appears on multiple pages)
    const uniqueVendors = new Map()
    for (const vendor of allVendors) {
      if (uniqueVendors.has(vendor.name)) {
        const existingVendor = uniqueVendors.get(vendor.name)
        existingVendor.productCount += vendor.productCount

        // Keep the most recent updated date
        if (new Date(vendor.updatedAt) > new Date(existingVendor.updatedAt)) {
          existingVendor.updatedAt = vendor.updatedAt
        }
      } else {
        uniqueVendors.set(vendor.name, vendor)
      }
    }

    return Array.from(uniqueVendors.values())
  } catch (error) {
    console.error("Error fetching vendors from Shopify:", error)
    throw error
  }
}

/**
 * Process vendors and store them in the database
 */
async function processVendors(vendors: any[]) {
  let added = 0
  let updated = 0
  const now = new Date().toISOString()

  try {
    for (const vendor of vendors) {
      // Generate a consistent vendor_id based on the name
      const vendorId = vendor.name.toLowerCase().replace(/[^a-z0-9]/g, "-")

      // Check if this vendor already exists
      const { data: existingVendors, error: queryError } = await supabase
        .from("vendors")
        .select("id")
        .eq("name", vendor.name)
        .limit(1)

      if (queryError) {
        console.error(`Error checking existing vendor ${vendor.name}:`, queryError)
        continue
      }

      if (existingVendors && existingVendors.length > 0) {
        // Update existing vendor
        const { error: updateError } = await supabase
          .from("vendors")
          .update({
            product_count: vendor.productCount,
            updated_at: now,
            last_synced_at: now,
          })
          .eq("id", existingVendors[0].id)

        if (updateError) {
          console.error(`Error updating vendor ${vendor.name}:`, updateError)
        } else {
          updated++
        }
      } else {
        // Insert new vendor
        const { error: insertError } = await supabase.from("vendors").insert({
          vendor_id: vendorId,
          name: vendor.name,
          product_count: vendor.productCount,
          created_at: now,
          updated_at: now,
          last_synced_at: now,
        })

        if (insertError) {
          console.error(`Error inserting vendor ${vendor.name}:`, insertError)
        } else {
          added++
        }
      }
    }

    return { added, updated }
  } catch (error) {
    console.error("Error processing vendors:", error)
    throw error
  }
}

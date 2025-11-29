import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    console.log('🔍 Finding "Featured Artists Kickstarter" collection in Shopify...\n')

    const supabase = createClient()

    // Find the collection by name
    let collection: any = null
    
    // Try REST API first
    const collectionsUrl = `collections.json?limit=250`
    const collectionsResponse = await shopifyFetch(collectionsUrl, { method: "GET" })
    
    if (collectionsResponse.ok) {
      const collectionsData = await safeJsonParse(collectionsResponse)
      if (collectionsData.collections) {
        collection = collectionsData.collections.find((c: any) => 
          c.title === "Featured Artists Kickstarter" || 
          c.handle === "featured-artists-kickstarter"
        )
      }
    }

    // If not found, try custom_collections and smart_collections
    if (!collection) {
      const customResponse = await shopifyFetch("custom_collections.json?limit=250", { method: "GET" })
      if (customResponse.ok) {
        const customData = await safeJsonParse(customResponse)
        if (customData.custom_collections) {
          collection = customData.custom_collections.find((c: any) => 
            c.title === "Featured Artists Kickstarter" || 
            c.handle === "featured-artists-kickstarter"
          )
        }
      }
    }

    if (!collection) {
      const smartResponse = await shopifyFetch("smart_collections.json?limit=250", { method: "GET" })
      if (smartResponse.ok) {
        const smartData = await safeJsonParse(smartResponse)
        if (smartData.smart_collections) {
          collection = smartData.smart_collections.find((c: any) => 
            c.title === "Featured Artists Kickstarter" || 
            c.handle === "featured-artists-kickstarter"
          )
        }
      }
    }

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection "Featured Artists Kickstarter" not found in Shopify' },
        { status: 404 }
      )
    }

    // Get products from collection
    const collectionId = collection.id.toString()
    const products: any[] = []
    let pageInfo: string | null = null
    let pageCount = 0

    do {
      pageCount++
      let productsUrl = `collections/${collectionId}/products.json?limit=250`
      if (pageInfo) {
        productsUrl += `&page_info=${pageInfo}`
      }

      const productsResponse = await shopifyFetch(productsUrl, { method: "GET" })
      
      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch products: ${productsResponse.status}`)
      }

      const productsData = await safeJsonParse(productsResponse)
      
      if (productsData.products && productsData.products.length > 0) {
        products.push(...productsData.products)
      }

      // Check for next page
      pageInfo = null
      const linkHeader = productsResponse.headers.get("Link")
      if (linkHeader) {
        const links = linkHeader.split(",")
        for (const link of links) {
          const [url, rel] = link.split(";")
          if (rel.includes('rel="next"')) {
            const match = url.match(/page_info=([^&>]+)/)
            if (match && match[1]) {
              pageInfo = match[1]
            }
          }
        }
      }

      if (pageCount > 10) break // Safety limit
    } while (pageInfo)

    if (products.length === 0) {
      return NextResponse.json(
        { error: "No products found in collection" },
        { status: 404 }
      )
    }

    // Group products by vendor
    const productsByVendor = new Map<string, typeof products>()
    for (const product of products) {
      const vendor = product.vendor || "Unknown"
      if (!productsByVendor.has(vendor)) {
        productsByVendor.set(vendor, [])
      }
      productsByVendor.get(vendor)!.push(product)
    }

    const results: any[] = []
    let totalAdded = 0
    let totalSkipped = 0
    let totalNotFound = 0

    // Process each vendor
    for (const [vendorName, vendorProducts] of productsByVendor.entries()) {
      // Get vendor from database
      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, vendor_name")
        .eq("vendor_name", vendorName)
        .maybeSingle()

      if (!vendor) {
        totalNotFound += vendorProducts.length
        results.push({
          vendorName,
          success: false,
          error: "Vendor not found in database",
          productsSkipped: vendorProducts.length
        })
        continue
      }

      // Find the "2024 Edition" series
      const { data: series } = await supabase
        .from("artwork_series")
        .select("id, name, vendor_id")
        .eq("vendor_id", vendor.id)
        .eq("name", "2024 Edition")
        .eq("is_active", true)
        .maybeSingle()

      if (!series) {
        totalNotFound += vendorProducts.length
        results.push({
          vendorName,
          vendorId: vendor.id,
          success: false,
          error: '"2024 Edition" series not found',
          productsSkipped: vendorProducts.length
        })
        continue
      }

      // Get existing members
      const { data: existingMembers } = await supabase
        .from("artwork_series_members")
        .select("submission_id, shopify_product_id")
        .eq("series_id", series.id)

      const existingShopifyIds = new Set(
        (existingMembers || [])
          .map(m => m.shopify_product_id)
          .filter(id => id !== null)
      )

      // Extract Shopify product IDs
      const shopifyProductIds = vendorProducts.map(p => {
        const id = p.id.toString()
        return id.includes("/") ? id.split("/").pop() : id
      })

      // Find matching submissions
      const { data: submissions } = await supabase
        .from("vendor_product_submissions")
        .select("id, vendor_id, shopify_product_id")
        .eq("vendor_id", vendor.id)
        .in("shopify_product_id", shopifyProductIds)

      const submissionMap = new Map(
        (submissions || []).map(s => [s.shopify_product_id, s])
      )

      // Add products to series
      let addedCount = 0
      let skippedCount = 0

      for (const product of vendorProducts) {
        const shopifyId = product.id.toString().includes("/")
          ? product.id.toString().split("/").pop()
          : product.id.toString()

        if (existingShopifyIds.has(shopifyId)) {
          skippedCount++
          continue
        }

        // Get next display order
        const { data: maxOrderData } = await supabase
          .from("artwork_series_members")
          .select("display_order")
          .eq("series_id", series.id)
          .order("display_order", { ascending: false })
          .limit(1)

        const nextDisplayOrder = maxOrderData && maxOrderData.length > 0
          ? (maxOrderData[0].display_order || 0) + 1
          : 0

        // Insert member
        const { error: insertError } = await supabase
          .from("artwork_series_members")
          .insert({
            series_id: series.id,
            submission_id: submissionMap.get(shopifyId)?.id || null,
            shopify_product_id: shopifyId,
            is_locked: false,
            display_order: nextDisplayOrder,
          })

        if (insertError) {
          console.error(`Error adding product ${product.title}:`, insertError)
        } else {
          addedCount++
        }
      }

      totalAdded += addedCount
      totalSkipped += skippedCount

      results.push({
        vendorName,
        vendorId: vendor.id,
        seriesId: series.id,
        seriesName: series.name,
        success: true,
        productsAdded: addedCount,
        productsSkipped: skippedCount,
        totalProducts: vendorProducts.length
      })
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts: products.length,
        vendorsProcessed: productsByVendor.size,
        productsAdded: totalAdded,
        productsSkipped: totalSkipped,
        productsNotFound: totalNotFound,
      },
      results
    })

  } catch (error: any) {
    console.error("Error adding Kickstarter collection to 2024 Edition:", error)
    return NextResponse.json(
      { error: "Failed to process request", message: error.message },
      { status: 500 }
    )
  }
}


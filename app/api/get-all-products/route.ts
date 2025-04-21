import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "10"
    const cursor = searchParams.get("cursor") || ""
    const query = searchParams.get("query") || ""
    const field = searchParams.get("field") || "title" // Default to title search
    const fetchAll = searchParams.get("fetchAll") === "true"

    // If fetchAll is true, we'll fetch all products (for "Select All" functionality)
    if (fetchAll) {
      return await fetchAllProducts(query, field)
    }

    // Construct the URL with pagination and search
    let url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products.json?limit=${limit}`

    // Add search query if provided
    if (query) {
      // Different fields to search by
      switch (field) {
        case "sku":
          url += `&query=sku:${encodeURIComponent(query)}`
          break
        case "vendor":
          url += `&vendor=${encodeURIComponent(query)}`
          break
        case "tag":
          url += `&tag=${encodeURIComponent(query)}`
          break
        case "title":
        default:
          url += `&title=${encodeURIComponent(query)}`
          break
      }
    }

    // Add cursor for pagination if provided
    if (cursor) {
      url += `&page_info=${cursor}`
    }

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

    // Get pagination info from Link header
    const linkHeader = response.headers.get("Link")
    let nextCursor = null
    let prevCursor = null

    if (linkHeader) {
      const links = linkHeader.split(",")
      for (const link of links) {
        const [url, rel] = link.split(";")
        if (rel.includes('rel="next"')) {
          // Extract the page_info parameter from the URL
          const match = url.match(/page_info=([^&>]+)/)
          if (match && match[1]) {
            nextCursor = match[1]
          }
        } else if (rel.includes('rel="previous"')) {
          const match = url.match(/page_info=([^&>]+)/)
          if (match && match[1]) {
            prevCursor = match[1]
          }
        }
      }
    }

    return NextResponse.json({
      products: data.products,
      pagination: {
        nextCursor,
        prevCursor,
        hasNext: !!nextCursor,
        hasPrev: !!prevCursor,
      },
    })
  } catch (error: any) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      {
        message: "Error fetching products",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Function to fetch all products (for "Select All" functionality)
async function fetchAllProducts(query = "", field = "title") {
  let allProducts = []
  let nextCursor = null

  try {
    do {
      // Construct the URL with search parameters
      let url = `https://${SHOPIFY_SHOP}/admin/api/2023-10/products.json?limit=250`

      // Add search query if provided
      if (query) {
        // Different fields to search by
        switch (field) {
          case "sku":
            url += `&query=sku:${encodeURIComponent(query)}`
            break
          case "vendor":
            url += `&vendor=${encodeURIComponent(query)}`
            break
          case "tag":
            url += `&tag=${encodeURIComponent(query)}`
            break
          case "title":
          default:
            url += `&title=${encodeURIComponent(query)}`
            break
        }
      }

      // Add cursor for pagination if we have one
      if (nextCursor) {
        url += `&page_info=${nextCursor}`
      }

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
      allProducts = [...allProducts, ...data.products]

      // Check for next page
      nextCursor = null
      const linkHeader = response.headers.get("Link")

      if (linkHeader) {
        const links = linkHeader.split(",")
        for (const link of links) {
          const [url, rel] = link.split(";")
          if (rel.includes('rel="next"')) {
            const match = url.match(/page_info=([^&>]+)/)
            if (match && match[1]) {
              nextCursor = match[1]
            }
          }
        }
      }

      // Limit to 1000 products to prevent excessive API calls
      if (allProducts.length >= 1000) {
        break
      }
    } while (nextCursor)

    return NextResponse.json({
      products: allProducts,
      totalCount: allProducts.length,
      isComplete: !nextCursor || allProducts.length >= 1000,
    })
  } catch (error) {
    console.error("Error fetching all products:", error)
    throw error
  }
}

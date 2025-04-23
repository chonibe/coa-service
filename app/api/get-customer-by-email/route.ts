import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from "@/lib/env"

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://www.thestreetlamp.com",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json(
      { message: "Email parameter is required" },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "https://www.thestreetlamp.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      },
    )
  }

  try {
    // Fetch customer from Shopify API using GraphQL
    const shopifyResponse = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: `
          query getCustomerByEmail($email: String!) {
            customers(first: 1, query: $email) {
              edges {
                node {
                  id
                  email
                }
              }
            }
          }
        `,
        variables: {
          email,
        },
      }),
    })

    const shopifyData = await shopifyResponse.json()

    if (!shopifyResponse.ok || shopifyData.errors) {
      console.error("Shopify API error:", shopifyData.errors)
      throw new Error("Error fetching customer from Shopify")
    }

    // Check if customer exists
    if (!shopifyData.data.customers.edges.length) {
      return NextResponse.json(
        { message: "No customer found with this email" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "https://www.thestreetlamp.com",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
          },
        },
      )
    }

    // Extract customer ID from the GraphQL response
    // The ID format is "gid://shopify/Customer/1234567890"
    const fullCustomerId = shopifyData.data.customers.edges[0].node.id
    const customerId = fullCustomerId.split("/").pop()

    return NextResponse.json(
      { customerId },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "https://www.thestreetlamp.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      },
    )
  } catch (error: any) {
    console.error("Error fetching customer:", error)
    return NextResponse.json(
      { message: "Error fetching customer" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://www.thestreetlamp.com",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      },
    )
  }
}

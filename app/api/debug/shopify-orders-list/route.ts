import { NextResponse } from "next/server"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"

export async function GET() {
  try {
    const graphqlQuery = `
      {
        orders(first: 20, reverse: true) {
          edges {
            node {
              id
              name
              displayFulfillmentStatus
              createdAt
            }
          }
        }
      }
    `
    
    const response = await shopifyFetch("graphql.json", {
      method: "POST",
      body: JSON.stringify({ query: graphqlQuery }),
    })
    
    const shopifyData = await safeJsonParse(response)
    const orders = shopifyData?.data?.orders?.edges || []
    
    return NextResponse.json({
      recentOrders: orders.map((o: any) => ({
        id: o.node.id,
        name: o.node.name,
        status: o.node.displayFulfillmentStatus,
        createdAt: o.node.createdAt
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

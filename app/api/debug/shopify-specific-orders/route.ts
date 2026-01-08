import { NextResponse } from "next/server"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"

export async function GET() {
  const orderNames = ["#1183", "#1180", "#1178", "#1165", "#1146"]
  const results = []

  for (const name of orderNames) {
    try {
      const graphqlQuery = `
        {
          orders(first: 1, query: "name:${name}") {
            edges {
              node {
                id
                name
                displayFulfillmentStatus
                fulfillmentStatus
                lineItems(first: 50) {
                  edges {
                    node {
                      id
                      title
                      fulfillmentStatus
                    }
                  }
                }
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
      const order = shopifyData?.data?.orders?.edges[0]?.node
      
      results.push({
        orderName: name,
        shopifyStatus: order?.displayFulfillmentStatus || "NOT_FOUND",
        lineItems: order?.lineItems?.edges?.map((e: any) => ({
          title: e.node.title,
          status: e.node.fulfillmentStatus
        }))
      })
    } catch (e: any) {
      results.push({ orderName: name, error: e.message })
    }
  }

  return NextResponse.json(results)
}







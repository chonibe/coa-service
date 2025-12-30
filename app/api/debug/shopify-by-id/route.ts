import { NextResponse } from "next/server"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"

export async function GET() {
  const orderIds = ["6074879115491", "6073184190691", "6072809292003"]
  const results = []

  for (const id of orderIds) {
    try {
      const graphqlQuery = `
        {
          order(id: "gid://shopify/Order/${id}") {
            id
            name
            displayFulfillmentStatus
            fulfillmentStatus
          }
        }
      `
      
      const response = await shopifyFetch("graphql.json", {
        method: "POST",
        body: JSON.stringify({ query: graphqlQuery }),
      })
      
      const shopifyData = await safeJsonParse(response)
      results.push(shopifyData?.data?.order || { id, error: "Not found" })
    } catch (e: any) {
      results.push({ id, error: e.message })
    }
  }

  return NextResponse.json(results)
}




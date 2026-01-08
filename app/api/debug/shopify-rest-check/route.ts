import { NextResponse } from "next/server"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"

export async function GET() {
  const orderIds = ["6074879115491", "6073184190691", "6072809292003"]
  const results = []

  for (const id of orderIds) {
    try {
      // Use REST API
      const response = await shopifyFetch(`orders/${id}.json`)
      const shopifyData = await safeJsonParse(response)
      results.push(shopifyData?.order || { id, error: "Not found in REST" })
    } catch (e: any) {
      results.push({ id, error: e.message })
    }
  }

  return NextResponse.json(results)
}








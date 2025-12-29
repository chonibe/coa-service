import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { shopifyFetch, safeJsonParse } from "@/lib/shopify-api"

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test Shopify connection
    let shopInfo
    try {
      const shopResponse = await shopifyFetch("shop.json")
      shopInfo = await safeJsonParse(shopResponse)
    } catch (e: any) {
      return NextResponse.json({ error: "Shopify connection failed", details: e.message }, { status: 500 })
    }

    const vendorName = 'Carsten Gueth'
    
    // 1. Get all line items for Carsten Gueth from the database
    const { data: dbLineItems, error: dbError } = await supabase
      .from("order_line_items_v2")
      .select("line_item_id, order_id, order_name, product_id, price, fulfillment_status, created_at")
      .eq("vendor_name", vendorName)
      .order("created_at", { ascending: false })

    if (dbError) throw dbError

    // 2. Get unique order names
    const orderNames = Array.from(new Set(dbLineItems.map(item => item.order_name).filter(Boolean)))
    
    // 3. Check each order in Shopify by name
    const results = []
    
    // To avoid hitting rate limits or taking too long, we'll check the first 10 orders
    const namesToCheck = orderNames.slice(0, 10)
    
    for (const name of namesToCheck) {
      try {
        // Try searching by name without the '#'
        const searchName = name.startsWith('#') ? name.substring(1) : name
        
        // Shopify GraphQL query to search order by name
        const graphqlQuery = `
          {
            orders(first: 5, query: "name:${name} OR name:${searchName}") {
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
        const orders = shopifyData?.data?.orders?.edges || []
        const shopifyOrder = orders.find((o: any) => o.node.name === name || o.node.name === `#${name}`)?.node
        
        if (!shopifyOrder) {
          results.push({
            orderName: name,
            error: "Order not found in Shopify",
            searchResults: orders.map((o: any) => o.node.name)
          })
          continue
        }
        
        // Compare with DB items
        const dbItemsForThisOrder = dbLineItems.filter(item => item.order_name === name)
        
        const orderComparison = {
          orderName: name,
          shopifyId: shopifyOrder.id,
          shopifyFulfillmentStatus: shopifyOrder.displayFulfillmentStatus,
          dbItems: dbItemsForThisOrder.map(dbItem => {
            const shopifyLineItems = shopifyOrder.lineItems.edges.map((e: any) => e.node)
            const shopifyLineItem = shopifyLineItems.find((item: any) => 
              item.id.includes(dbItem.line_item_id) || item.title.includes(dbItem.product_id)
            )
            
            const shopifyStatusNormalized = shopifyLineItem?.fulfillmentStatus?.toLowerCase() || "unfulfilled"
            const dbStatusNormalized = dbItem.fulfillment_status?.toLowerCase() || "unfulfilled"
            
            return {
              lineItemId: dbItem.line_item_id,
              dbStatus: dbItem.fulfillment_status,
              shopifyStatus: shopifyLineItem?.fulfillmentStatus || "unfulfilled",
              isDiscrepancy: dbStatusNormalized !== shopifyStatusNormalized,
              shopifyLineItemTitle: shopifyLineItem?.title
            }
          })
        }
        
        results.push(orderComparison)
      } catch (err: any) {
        results.push({
          orderName: name,
          error: err.message
        })
      }
    }

    return NextResponse.json({
      shopName: shopInfo?.shop?.name,
      vendorName,
      totalDbItems: dbLineItems.length,
      ordersChecked: results.length,
      discrepancies: results.filter(r => r.dbItems && r.dbItems.some((i: any) => i.isDiscrepancy)),
      allResults: results
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

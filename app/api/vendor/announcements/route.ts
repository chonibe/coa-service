import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

// GET: Fetch past announcements
export async function GET() {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // For now, return mock data
    // In production, this would query a vendor_announcements table
    const mockAnnouncements = []

    return NextResponse.json({
      success: true,
      announcements: mockAnnouncements,
    })
  } catch (error: any) {
    console.error("Error fetching announcements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST: Send a new announcement
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, audience, targetId } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Determine recipient list based on audience
    let recipientCount = 0
    let targetName = null

    switch (audience) {
      case "all": {
        // Get all collectors who purchased from this vendor
        const { count } = await supabase
          .from("order_line_items")
          .select("id", { count: "exact", head: true })
          .eq("products.vendor_name", vendorName)
        
        recipientCount = count || 0
        break
      }
      
      case "artwork": {
        if (!targetId) {
          return NextResponse.json(
            { error: "Target artwork ID is required" },
            { status: 400 }
          )
        }
        
        // Get collectors who own this specific artwork
        const { data: product } = await supabase
          .from("products")
          .select("name")
          .eq("id", targetId)
          .single()
        
        if (product) {
          targetName = product.name
          
          const { count } = await supabase
            .from("order_line_items")
            .select("id", { count: "exact", head: true })
            .eq("product_id", targetId)
          
          recipientCount = count || 0
        }
        break
      }
      
      case "series": {
        if (!targetId) {
          return NextResponse.json(
            { error: "Target series ID is required" },
            { status: 400 }
          )
        }
        
        // Get collectors who own artworks in this series
        const { data: series } = await supabase
          .from("artwork_series")
          .select("name")
          .eq("id", targetId)
          .single()
        
        if (series) {
          targetName = series.name
          
          // Get all product IDs in this series
          const { data: seriesMembers } = await supabase
            .from("artwork_series_members")
            .select("shopify_product_id")
            .eq("series_id", targetId)
          
          if (seriesMembers && seriesMembers.length > 0) {
            const productIds = seriesMembers.map(m => m.shopify_product_id)
            
            // Get products with these Shopify IDs
            const { data: products } = await supabase
              .from("products")
              .select("id")
              .in("product_id", productIds)
            
            if (products && products.length > 0) {
              const internalProductIds = products.map(p => p.id)
              
              const { count } = await supabase
                .from("order_line_items")
                .select("id", { count: "exact", head: true })
                .in("product_id", internalProductIds)
              
              recipientCount = count || 0
            }
          }
        }
        break
      }
      
      case "vip": {
        // Mock VIP count - would need a separate VIP tracking system
        recipientCount = 0
        break
      }
    }

    // In a production system, this would:
    // 1. Store the announcement in vendor_announcements table
    // 2. Create notification records for each recipient
    // 3. Send emails/push notifications
    
    // For now, just return success with recipient count
    return NextResponse.json({
      success: true,
      recipientCount,
      announcement: {
        id: Date.now().toString(),
        title,
        message,
        audience,
        targetId,
        targetName,
        sentAt: new Date().toISOString(),
        recipientCount,
        status: "sent",
      },
    })
  } catch (error: any) {
    console.error("Error sending announcement:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

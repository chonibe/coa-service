import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  })
}

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Create demo vendor
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .insert({
        vendor_name: "Demo Artist",
        instagram_url: "https://instagram.com/demoartist",
        notes: "Demo account for showcasing the vendor portal",
        paypal_email: "demo@example.com",
        payout_method: "paypal",
        tax_id: "GB123456789",
        tax_country: "United Kingdom",
        is_company: false,
        status: "active",
        contact_name: "John Demo",
        contact_email: "contact@demoartist.com",
        phone: "+44 123 456 7890",
        address: "123 Demo Street, London, UK",
        website: "https://demoartist.com"
      })
      .select()
      .single()

    if (vendorError) {
      console.error("Error creating demo vendor:", vendorError)
      return NextResponse.json({ error: "Failed to create demo vendor" }, { status: 500 })
    }

    // Create demo products
    const demoProducts = [
      {
        vendor_name: "Demo Artist",
        name: "Urban Dreams Print",
        description: "Limited edition art print",
        price: 150.00,
        handle: "urban-dreams-print",
        sku: "UD-001",
        edition_size: "50",
        image_url: "https://picsum.photos/400/400"
      },
      {
        vendor_name: "Demo Artist",
        name: "City Lights Canvas",
        description: "Original canvas artwork",
        price: 450.00,
        handle: "city-lights-canvas",
        sku: "CL-001",
        edition_size: "1",
        image_url: "https://picsum.photos/400/400"
      },
      {
        vendor_name: "Demo Artist",
        name: "Street Stories Book",
        description: "Photography book",
        price: 35.00,
        handle: "street-stories-book",
        sku: "SS-001",
        edition_size: "100",
        image_url: "https://picsum.photos/400/400"
      }
    ]

    const { data: products, error: productsError } = await supabase
      .from("products")
      .insert(demoProducts)
      .select()

    if (productsError) {
      console.error("Error creating demo products:", productsError)
      return NextResponse.json({ error: "Failed to create demo products" }, { status: 500 })
    }

    // Set up payout settings
    const payoutSettings = products.map(product => ({
      product_id: product.id,
      vendor_name: "Demo Artist",
      payout_amount: product.price * 0.8, // 80% of product price
      is_percentage: false
    }))

    const { error: payoutsError } = await supabase
      .from("product_vendor_payouts")
      .insert(payoutSettings)

    if (payoutsError) {
      console.error("Error creating payout settings:", payoutsError)
      return NextResponse.json({ error: "Failed to create payout settings" }, { status: 500 })
    }

    // Create demo orders
    const demoOrders = [
      {
        order_id: "order_1",
        product_id: products[0].id,
        vendor_name: "Demo Artist",
        price: 150.00,
        quantity: 1,
        status: "completed",
        created_at: new Date().toISOString()
      },
      {
        order_id: "order_2",
        product_id: products[1].id,
        vendor_name: "Demo Artist",
        price: 450.00,
        quantity: 1,
        status: "completed",
        created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        order_id: "order_3",
        product_id: products[2].id,
        vendor_name: "Demo Artist",
        price: 35.00,
        quantity: 2,
        status: "completed",
        created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      }
    ]

    const { error: ordersError } = await supabase
      .from("order_line_items_v2")
      .insert(demoOrders)

    if (ordersError) {
      console.error("Error creating demo orders:", ordersError)
      return NextResponse.json({ error: "Failed to create demo orders" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      vendor,
      products,
      message: "Demo data created successfully"
    })
  } catch (error) {
    console.error("Error setting up demo data:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
} 
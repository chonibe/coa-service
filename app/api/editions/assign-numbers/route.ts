import { getSupabaseUrl, getSupabaseKey } from '@/lib/supabase/client-utils'
import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
            getSupabaseUrl(),
            getSupabaseKey('anon')
          )

export async function POST(request: Request) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      )
    }

    // Call the assign_edition_numbers function
    const { data, error } = await supabase
      .rpc('assign_edition_numbers', { product_id: productId })

    if (error) {
      console.error("Error assigning edition numbers:", error)
      return NextResponse.json(
        { success: false, message: "Failed to assign edition numbers" },
        { status: 500 }
      )
    }

    // Get the updated line items
    const { data: lineItems, error: fetchError } = await supabase
      .from("order_line_items_v2")
      .select("*")
      .eq("product_id", productId)
      .order("edition_number", { ascending: true })

    if (fetchError) {
      console.error("Error fetching updated line items:", fetchError)
      return NextResponse.json(
        { success: false, message: "Failed to fetch updated line items" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Assigned ${data} edition numbers`,
      lineItems
    })
  } catch (error: any) {
    console.error("Error in assign edition numbers:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
} 
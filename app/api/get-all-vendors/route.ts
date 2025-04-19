import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Fetch all distinct vendor names from order_line_items table
    const { data, error } = await supabase.from("order_line_items").select("vendor").distinct()

    if (error) {
      console.error("Error fetching vendors from database:", error)
      throw new Error("Failed to fetch vendors from database")
    }

    // Extract only the vendor names from the query result
    const vendors = data.map((item) => item.vendor)

    return NextResponse.json({
      vendors: vendors,
    })
  } catch (error: any) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json(
      {
        message: "Error fetching vendors",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

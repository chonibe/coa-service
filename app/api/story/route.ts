import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get("product_id")

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get the story for this product
    const { data: story, error: storyError } = await supabase
      .from("artwork_stories")
      .select("*")
      .eq("product_id", productId)
      .single()

    if (storyError) {
      throw storyError
    }

    return NextResponse.json({ story })
  } catch (error: any) {
    console.error("Error fetching artwork story:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
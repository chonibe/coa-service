import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import type { Slide, CreateSlideInput, SlideBackground } from "@/lib/slides/types"
import { DEFAULT_BACKGROUND } from "@/lib/slides/types"

/**
 * GET: Fetch all slides for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { productId } = params

    // Verify vendor owns this product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, vendor_name")
      .eq("id", productId)
      .eq("vendor_name", vendorName)
      .maybeSingle()

    if (productError) {
      console.error("[Slides API] Database error:", productError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Fetch slides ordered by display_order
    const { data: slides, error: slidesError } = await supabase
      .from("artwork_slides")
      .select("*")
      .eq("product_id", productId)
      .order("display_order", { ascending: true })

    if (slidesError) {
      console.error("[Slides API] Error fetching slides:", slidesError)
      return NextResponse.json({ error: "Failed to fetch slides" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
      },
      slides: slides || [],
    })
  } catch (error: any) {
    console.error("[Slides API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST: Create a new slide
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { productId } = params
    const body: CreateSlideInput = await request.json()

    // Verify vendor owns this product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, vendor_name")
      .eq("id", productId)
      .eq("vendor_name", vendorName)
      .maybeSingle()

    if (productError) {
      console.error("[Slides API] Database error:", productError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Get next display_order
    const { data: lastSlide } = await supabase
      .from("artwork_slides")
      .select("display_order")
      .eq("product_id", productId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = body.display_order ?? ((lastSlide?.display_order ?? -1) + 1)

    // Merge background with defaults
    const background: SlideBackground = {
      ...DEFAULT_BACKGROUND,
      ...(body.background || {}),
    }

    // Create slide
    const { data: newSlide, error: insertError } = await supabase
      .from("artwork_slides")
      .insert({
        product_id: productId,
        display_order: nextOrder,
        background,
        elements: body.elements || [],
        title: body.title || null,
        caption: body.caption || null,
        audio: body.audio || null,
        is_locked: body.is_locked || false,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[Slides API] Error creating slide:", insertError)
      return NextResponse.json(
        { error: "Failed to create slide", message: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      slide: newSlide,
    })
  } catch (error: any) {
    console.error("[Slides API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT: Reorder slides
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { productId } = params
    const body = await request.json()

    // Verify vendor owns this product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, vendor_name")
      .eq("id", productId)
      .eq("vendor_name", vendorName)
      .maybeSingle()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Expect body.slideOrder to be an array of slide IDs in new order
    const { slideOrder } = body as { slideOrder: string[] }

    if (!Array.isArray(slideOrder)) {
      return NextResponse.json({ error: "slideOrder must be an array" }, { status: 400 })
    }

    // Update each slide's display_order
    const updates = slideOrder.map((slideId, index) =>
      supabase
        .from("artwork_slides")
        .update({ display_order: index })
        .eq("id", slideId)
        .eq("product_id", productId)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Slides API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

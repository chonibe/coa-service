import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import type { UpdateSlideInput } from "@/lib/slides/types"

/**
 * GET: Fetch a single slide
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string; slideId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { productId, slideId } = params

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

    // Fetch slide
    const { data: slide, error: slideError } = await supabase
      .from("artwork_slides")
      .select("*")
      .eq("id", slideId)
      .eq("product_id", productId)
      .single()

    if (slideError || !slide) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      slide,
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
 * PUT: Update a slide
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string; slideId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { productId, slideId } = params
    const body: UpdateSlideInput = await request.json()

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

    // Build update object (only include defined fields)
    const updateData: Record<string, any> = {}
    
    if (body.background !== undefined) updateData.background = body.background
    if (body.elements !== undefined) updateData.elements = body.elements
    if (body.title !== undefined) updateData.title = body.title
    if (body.caption !== undefined) updateData.caption = body.caption
    if (body.audio !== undefined) updateData.audio = body.audio
    if (body.is_locked !== undefined) updateData.is_locked = body.is_locked
    if (body.is_published !== undefined) updateData.is_published = body.is_published

    // Update slide
    const { data: updatedSlide, error: updateError } = await supabase
      .from("artwork_slides")
      .update(updateData)
      .eq("id", slideId)
      .eq("product_id", productId)
      .select()
      .single()

    if (updateError) {
      console.error("[Slides API] Error updating slide:", updateError)
      return NextResponse.json(
        { error: "Failed to update slide", message: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      slide: updatedSlide,
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
 * DELETE: Remove a slide
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string; slideId: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { productId, slideId } = params

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

    // Delete slide
    const { error: deleteError } = await supabase
      .from("artwork_slides")
      .delete()
      .eq("id", slideId)
      .eq("product_id", productId)

    if (deleteError) {
      console.error("[Slides API] Error deleting slide:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete slide", message: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Slides API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

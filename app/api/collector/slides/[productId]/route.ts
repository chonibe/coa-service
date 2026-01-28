import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET: Fetch published slides for a product (collector view)
 * 
 * Public endpoint - no auth required for published slides.
 * Locked slides require authentication to verify collector ownership.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = createClient()
    const { productId } = params

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, vendor_name")
      .eq("id", productId)
      .maybeSingle()

    if (productError) {
      console.error("[Collector Slides API] Product error:", productError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Fetch published slides
    const { data: slides, error: slidesError } = await supabase
      .from("artwork_slides")
      .select("*")
      .eq("product_id", productId)
      .eq("is_published", true)
      .order("display_order", { ascending: true })

    if (slidesError) {
      console.error("[Collector Slides API] Slides error:", slidesError)
      return NextResponse.json({ error: "Failed to fetch slides" }, { status: 500 })
    }

    // For locked slides, check if collector owns the artwork
    // This would require NFC authentication - for now, just mark locked slides
    const processedSlides = (slides || []).map(slide => {
      if (slide.is_locked) {
        // Return limited data for locked slides
        return {
          id: slide.id,
          display_order: slide.display_order,
          is_locked: true,
          // Only show background, hide elements and audio
          background: slide.background,
          elements: [],
          title: slide.title,
          caption: null,
          audio: null,
        }
      }
      return slide
    })

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        vendor_name: product.vendor_name,
      },
      slides: processedSlides,
    })
  } catch (error: any) {
    console.error("[Collector Slides API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

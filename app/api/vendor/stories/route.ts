import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch all stories for the vendor
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current vendor's ID
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get vendor ID from vendors table
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("auth_id", session.user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get all stories for this vendor's products
    const { data: stories, error: storiesError } = await supabase
      .from("artwork_stories")
      .select("*, products!inner(*)")
      .eq("products.vendor_id", vendor.id)
      .order("created_at", { ascending: false })

    if (storiesError) {
      throw storiesError
    }

    return NextResponse.json({ stories })
  } catch (error: any) {
    console.error("Error in stories API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

// POST - Create a new story
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    const { product_id, title, content } = body
    if (!product_id || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the current vendor's ID
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the vendor owns this product
    const { data: product } = await supabase
      .from("products")
      .select("vendor_id")
      .eq("id", product_id)
      .single()

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Create the story
    const { data: story, error: storyError } = await supabase
      .from("artwork_stories")
      .insert({
        product_id,
        title,
        content,
        media_urls: body.media_urls || [],
        requires_nfc: body.requires_nfc ?? true
      })
      .select()
      .single()

    if (storyError) {
      throw storyError
    }

    return NextResponse.json({ story })
  } catch (error: any) {
    console.error("Error in create story API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

// PUT - Update a story
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const storyId = request.url.split("/").pop()

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
    }

    // Validate required fields
    const { product_id, title, content } = body
    if (!product_id || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the current vendor's ID
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the vendor owns this product
    const { data: product } = await supabase
      .from("products")
      .select("vendor_id")
      .eq("id", product_id)
      .single()

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Update the story
    const { data: story, error: storyError } = await supabase
      .from("artwork_stories")
      .update({
        product_id,
        title,
        content,
        media_urls: body.media_urls || [],
        requires_nfc: body.requires_nfc ?? true
      })
      .eq("id", storyId)
      .select()
      .single()

    if (storyError) {
      throw storyError
    }

    return NextResponse.json({ story })
  } catch (error: any) {
    console.error("Error in update story API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

// DELETE - Delete a story
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const storyId = request.url.split("/").pop()

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 })
    }

    // Get the current vendor's ID
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the story
    const { error: deleteError } = await supabase
      .from("artwork_stories")
      .delete()
      .eq("id", storyId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in delete story API:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
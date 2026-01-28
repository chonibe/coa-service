import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromRequest } from "@/lib/vendor-auth"
import type { UpdateStoryPostInput } from "@/lib/story/types"

/**
 * PUT: Update a story post (moderate or edit)
 * 
 * Artists can:
 * - Edit their own posts (text_content)
 * - Moderate any post on their products (is_visible, is_pinned)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string; postId: string } }
) {
  try {
    const supabase = createClient()
    const { productId, postId } = params
    
    const vendor = await getVendorFromRequest()
    if (!vendor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify vendor owns this product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, vendor_name")
      .eq("id", productId)
      .eq("vendor_name", vendor.vendor_name)
      .maybeSingle()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Get the post
    const { data: post, error: postError } = await supabase
      .from("artwork_story_posts")
      .select("*")
      .eq("id", postId)
      .eq("product_id", productId)
      .maybeSingle()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Parse input
    const body: UpdateStoryPostInput = await request.json()

    // Build update object
    const updateData: Record<string, any> = {}

    // Artists can only edit text_content on their own posts
    if (body.text_content !== undefined) {
      if (post.author_type !== "artist" || post.author_id !== vendor.id) {
        return NextResponse.json(
          { error: "You can only edit your own posts" },
          { status: 403 }
        )
      }
      updateData.text_content = body.text_content
    }

    // Artists can moderate any post (visibility, pinning)
    if (body.is_visible !== undefined) {
      updateData.is_visible = body.is_visible
    }
    if (body.is_pinned !== undefined) {
      updateData.is_pinned = body.is_pinned
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 })
    }

    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from("artwork_story_posts")
      .update(updateData)
      .eq("id", postId)
      .select()
      .single()

    if (updateError) {
      console.error("[Vendor Story API] Update error:", updateError)
      return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
    })
  } catch (error: any) {
    console.error("[Vendor Story API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Delete a story post
 * 
 * Artists can delete their own posts.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string; postId: string } }
) {
  try {
    const supabase = createClient()
    const { productId, postId } = params
    
    const vendor = await getVendorFromRequest()
    if (!vendor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify vendor owns this product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, vendor_name")
      .eq("id", productId)
      .eq("vendor_name", vendor.vendor_name)
      .maybeSingle()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Get the post to verify ownership
    const { data: post, error: postError } = await supabase
      .from("artwork_story_posts")
      .select("author_type, author_id")
      .eq("id", postId)
      .eq("product_id", productId)
      .maybeSingle()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Only allow artists to delete their own posts
    if (post.author_type !== "artist" || post.author_id !== vendor.id) {
      return NextResponse.json(
        { error: "You can only delete your own posts" },
        { status: 403 }
      )
    }

    // Delete post (and any replies via CASCADE)
    const { error: deleteError } = await supabase
      .from("artwork_story_posts")
      .delete()
      .eq("id", postId)

    if (deleteError) {
      console.error("[Vendor Story API] Delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Vendor Story API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

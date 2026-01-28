import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromRequest } from "@/lib/vendor-auth"
import type { CreateStoryPostInput } from "@/lib/story/types"

/**
 * GET: Fetch story posts for a product (vendor view - includes hidden posts)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = createClient()
    const { productId } = params
    
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

    // Fetch ALL posts (including hidden) for moderation
    const { data: posts, error } = await supabase
      .from("artwork_story_posts")
      .select("*")
      .eq("product_id", productId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Vendor Story API] Error:", error)
      return NextResponse.json({ error: "Failed to fetch story" }, { status: 500 })
    }

    // Organize into parent posts with nested replies
    const parentPosts = (posts || []).filter(p => !p.parent_post_id)
    const replies = (posts || []).filter(p => p.parent_post_id)

    const postsWithReplies = parentPosts.map(post => ({
      ...post,
      replies: replies
        .filter(r => r.parent_post_id === post.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }))

    return NextResponse.json({
      success: true,
      posts: postsWithReplies,
      total: parentPosts.length,
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
 * POST: Create a new story post (artist)
 * 
 * Artists can post to their own products' stories.
 * Can also reply to collector posts (is_artist_reply = true, PUBLIC).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = createClient()
    const { productId } = params
    
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

    // Parse input
    const body: CreateStoryPostInput = await request.json()

    // Validate content
    if (!body.content_type) {
      return NextResponse.json({ error: "Content type is required" }, { status: 400 })
    }

    if (body.content_type === "text" && !body.text_content?.trim()) {
      return NextResponse.json({ error: "Text content is required" }, { status: 400 })
    }

    if ((body.content_type === "photo" || body.content_type === "voice_note") && !body.media_url) {
      return NextResponse.json({ error: "Media URL is required" }, { status: 400 })
    }

    // Determine if this is a reply
    const isReply = !!body.parent_post_id

    // If replying, verify parent post exists
    if (isReply) {
      const { data: parentPost, error: parentError } = await supabase
        .from("artwork_story_posts")
        .select("id, product_id")
        .eq("id", body.parent_post_id)
        .eq("product_id", productId)
        .maybeSingle()

      if (parentError || !parentPost) {
        return NextResponse.json({ error: "Parent post not found" }, { status: 404 })
      }
    }

    // Create post
    const { data: post, error: createError } = await supabase
      .from("artwork_story_posts")
      .insert({
        product_id: productId,
        author_type: "artist",
        author_id: vendor.id,
        author_name: vendor.display_name || vendor.vendor_name,
        author_avatar_url: vendor.profile_image_url,
        content_type: body.content_type,
        text_content: body.text_content,
        media_url: body.media_url,
        media_thumbnail_url: body.media_thumbnail_url,
        voice_duration_seconds: body.voice_duration_seconds,
        city: body.city,
        country: body.country,
        country_code: body.country_code,
        parent_post_id: body.parent_post_id,
        is_artist_reply: isReply,
      })
      .select()
      .single()

    if (createError) {
      console.error("[Vendor Story API] Create error:", createError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error: any) {
    console.error("[Vendor Story API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

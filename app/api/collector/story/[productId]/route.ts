import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { CreateStoryPostInput } from "@/lib/story/types"

/**
 * GET: Fetch story posts for a product
 * 
 * Returns all visible posts with replies nested under parent posts.
 * Artist replies are always visible (PUBLIC).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = createClient()
    const { productId } = params

    // Fetch all visible posts for this product
    const { data: posts, error } = await supabase
      .from("artwork_story_posts")
      .select("*")
      .eq("product_id", productId)
      .eq("is_visible", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Story API] Error fetching posts:", error)
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
    console.error("[Story API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST: Create a new story post (collector)
 * 
 * Collectors must own the artwork to post to its story.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = createClient()
    const { productId } = params
    
    // Get collector from session
    const cookieStore = cookies()
    const collectorEmail = cookieStore.get("collector_email")?.value
    const collectorName = cookieStore.get("collector_name")?.value || "Anonymous"

    if (!collectorEmail) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify collector owns this artwork
    const { data: ownership, error: ownershipError } = await supabase
      .from("order_line_items")
      .select(`
        id,
        orders!inner(customer_email)
      `)
      .eq("product_id", productId)
      .eq("orders.customer_email", collectorEmail)
      .limit(1)
      .maybeSingle()

    if (ownershipError) {
      console.error("[Story API] Ownership check error:", ownershipError)
      return NextResponse.json({ error: "Failed to verify ownership" }, { status: 500 })
    }

    if (!ownership) {
      return NextResponse.json(
        { error: "You must own this artwork to post to its story" },
        { status: 403 }
      )
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

    // Get collector avatar
    const { data: profile } = await supabase
      .from("collector_profiles")
      .select("avatar_url")
      .eq("email", collectorEmail)
      .maybeSingle()

    // Create post
    const { data: post, error: createError } = await supabase
      .from("artwork_story_posts")
      .insert({
        product_id: productId,
        author_type: "collector",
        author_id: collectorEmail,
        author_name: collectorName,
        author_avatar_url: profile?.avatar_url,
        content_type: body.content_type,
        text_content: body.text_content,
        media_url: body.media_url,
        media_thumbnail_url: body.media_thumbnail_url,
        voice_duration_seconds: body.voice_duration_seconds,
        city: body.city,
        country: body.country,
        country_code: body.country_code,
        is_artist_reply: false,
      })
      .select()
      .single()

    if (createError) {
      console.error("[Story API] Create error:", createError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error: any) {
    console.error("[Story API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}

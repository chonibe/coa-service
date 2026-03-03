/**
 * API: Collector Wishlist
 * 
 * Server-synced wishlist for authenticated collectors.
 * 
 * GET    /api/collector/wishlist          — List active wishlist items
 * POST   /api/collector/wishlist          — Add item to wishlist
 * DELETE /api/collector/wishlist          — Remove item (soft delete via removed_at)
 * PATCH  /api/collector/wishlist          — Update notification preferences
 * 
 * @see lib/shop/WishlistContext.tsx - Client-side context that syncs with this API
 * @see supabase/migrations/20260214100000_collector_wishlist_items.sql
 */

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

// ============================================
// GET — List active wishlist items
// ============================================

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore as any)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ items: [] })
    }

    const { data: items, error } = await supabase
      .from("collector_wishlist_items")
      .select("*")
      .eq("user_id", user.id)
      .is("removed_at", null)
      .order("added_at", { ascending: false })

    if (error) {
      console.error("[wishlist/GET] Error:", error)
      return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
    }

    return NextResponse.json({ items: items || [] })
  } catch (error) {
    console.error("[wishlist/GET] Exception:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// ============================================
// POST — Add item to wishlist
// ============================================

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore as any)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, variantId, handle, title, price, image, artistName } = body

    if (!productId || !handle || !title) {
      return NextResponse.json({ error: "productId, handle, and title are required" }, { status: 400 })
    }

    // Check for existing active item (dedup)
    const { data: existing } = await supabase
      .from("collector_wishlist_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .is("removed_at", null)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ item: existing, message: "Already in wishlist" })
    }

    const { data: item, error } = await supabase
      .from("collector_wishlist_items")
      .insert({
        user_id: user.id,
        collector_identifier: user.email || user.id,
        product_id: productId,
        variant_id: variantId || null,
        handle,
        title,
        price: price || 0,
        image: image || null,
        artist_name: artistName || null,
        added_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[wishlist/POST] Error:", error)
      return NextResponse.json({ error: "Failed to add item" }, { status: 500 })
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("[wishlist/POST] Exception:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// ============================================
// DELETE — Remove item from wishlist (soft delete)
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore as any)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("collector_wishlist_items")
      .update({ removed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .is("removed_at", null)

    if (error) {
      console.error("[wishlist/DELETE] Error:", error)
      return NextResponse.json({ error: "Failed to remove item" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[wishlist/DELETE] Exception:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// ============================================
// PATCH — Update notification preferences
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore as any)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, notifyRestock, notifyPriceDrop } = body

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (typeof notifyRestock === "boolean") updateData.notify_restock = notifyRestock
    if (typeof notifyPriceDrop === "boolean") updateData.notify_price_drop = notifyPriceDrop

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data: item, error } = await supabase
      .from("collector_wishlist_items")
      .update(updateData)
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .is("removed_at", null)
      .select()
      .single()

    if (error) {
      console.error("[wishlist/PATCH] Error:", error)
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("[wishlist/PATCH] Exception:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

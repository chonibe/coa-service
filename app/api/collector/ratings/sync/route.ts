/**
 * API: Sync collector ratings from localStorage to backend
 *
 * POST /api/collector/ratings/sync
 * Body: { ratings: { [productId]: number } }
 * Returns: { synced: number }
 */

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore as any)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { ratings } = body

    if (!ratings || typeof ratings !== "object") {
      return NextResponse.json(
        { error: "ratings object is required" },
        { status: 400 }
      )
    }

    const entries = Object.entries(ratings).filter(
      ([, v]) => typeof v === "number" && v >= 1 && v <= 5
    ) as [string, number][]

    if (entries.length === 0) {
      return NextResponse.json({ synced: 0 })
    }

    const rows = entries.map(([productId, rating]) => ({
      collector_id: user.id,
      product_id: productId,
      rating: Math.round(rating),
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from("collector_ratings").upsert(rows, {
      onConflict: "collector_id,product_id",
    })

    if (error) {
      console.error("[ratings/sync] Upsert error:", error)
      return NextResponse.json(
        { error: "Failed to sync ratings" },
        { status: 500 }
      )
    }

    return NextResponse.json({ synced: rows.length })
  } catch (error) {
    console.error("[ratings/sync] Error:", error)
    return NextResponse.json(
      { error: "Failed to sync ratings" },
      { status: 500 }
    )
  }
}

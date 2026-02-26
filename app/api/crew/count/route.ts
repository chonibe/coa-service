/**
 * API: Crew count per product
 *
 * GET /api/crew/count?productIds=id1,id2,...
 * Returns: { [productId]: number } — count of crew members (taste-similar collectors) who responded to each product
 *
 * Requires auth. User must have rated at least MIN_RATINGS_FOR_CREW products.
 */

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const MIN_RATINGS_FOR_CREW = 15
const MIN_OVERLAP_FOR_CREW = 3
const MAX_RATING_DIFF = 1.5

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore as any)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const productIdsParam = searchParams.get("productIds")
    const productIds = productIdsParam
      ? productIdsParam.split(",").filter(Boolean)
      : []

    if (productIds.length === 0) {
      return NextResponse.json({})
    }

    const { data: userRatings, error: userErr } = await supabase
      .from("collector_ratings")
      .select("product_id, rating")
      .eq("collector_id", user.id)

    if (userErr || !userRatings || userRatings.length < MIN_RATINGS_FOR_CREW) {
      const empty: Record<string, number> = {}
      for (const id of productIds) empty[id] = 0
      return NextResponse.json(empty)
    }

    const userMap = new Map<string, number>()
    for (const r of userRatings) {
      userMap.set(r.product_id, r.rating)
    }

    const allRelevantProductIds = [
      ...new Set([...userMap.keys(), ...productIds]),
    ]

    const { data: allRatings, error: allErr } = await supabase
      .from("collector_ratings")
      .select("collector_id, product_id, rating")
      .in("product_id", allRelevantProductIds)
      .neq("collector_id", user.id)

    if (allErr) {
      console.error("[crew/count] Error fetching ratings:", allErr)
      const empty: Record<string, number> = {}
      for (const id of productIds) empty[id] = 0
      return NextResponse.json(empty)
    }

    const otherByCollector = new Map<
      string,
      Map<string, number>
    >()
    for (const r of allRatings || []) {
      let m = otherByCollector.get(r.collector_id)
      if (!m) {
        m = new Map()
        otherByCollector.set(r.collector_id, m)
      }
      m.set(r.product_id, r.rating)
    }

    const result: Record<string, number> = {}
    for (const productId of productIds) {
      let count = 0
      for (const [collectorId, otherMap] of otherByCollector) {
        const otherRating = otherMap.get(productId)
        if (otherRating == null) continue

        const overlapProducts: string[] = []
        for (const pid of userMap.keys()) {
          if (otherMap.has(pid)) overlapProducts.push(pid)
        }

        if (overlapProducts.length < MIN_OVERLAP_FOR_CREW) continue

        let sumDiff = 0
        for (const pid of overlapProducts) {
          const u = userMap.get(pid)!
          const o = otherMap.get(pid)!
          sumDiff += Math.abs(u - o)
        }
        const avgDiff = sumDiff / overlapProducts.length
        if (avgDiff <= MAX_RATING_DIFF) count++
      }
      result[productId] = count
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[crew/count] Exception:", error)
    return NextResponse.json(
      { error: "Failed to get crew counts" },
      { status: 500 }
    )
  }
}

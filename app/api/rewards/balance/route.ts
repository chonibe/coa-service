import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get("customer_id")

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Get customer's rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from("customer_rewards")
      .select("*")
      .eq("customer_id", customerId)
      .single()

    if (rewardsError) {
      // If no rewards found, create initial rewards record
      if (rewardsError.code === "PGRST116") {
        const { data: newRewards, error: createError } = await supabase
          .from("customer_rewards")
          .insert([{ customer_id: customerId }])
          .select()
          .single()

        if (createError) {
          throw createError
        }

        return NextResponse.json({
          points: 0,
          level: "bronze",
          created_at: newRewards.created_at
        })
      }
      throw rewardsError
    }

    // Get current tier info
    const { data: currentTier, error: tierError } = await supabase
      .from("reward_tiers")
      .select("*")
      .eq("name", rewards.level)
      .single()

    if (tierError) {
      throw tierError
    }

    // Get next tier info
    const { data: nextTier, error: nextTierError } = await supabase
      .from("reward_tiers")
      .select("*")
      .gt("required_points", rewards.points)
      .order("required_points")
      .limit(1)
      .single()

    // No error handling for nextTier as it's optional (might be at max tier)

    return NextResponse.json({
      points: rewards.points,
      level: rewards.level,
      current_tier: currentTier,
      next_tier: nextTier || null,
      points_to_next_tier: nextTier ? nextTier.required_points - rewards.points : 0,
      created_at: rewards.created_at
    })
  } catch (error: any) {
    console.error("Error fetching rewards balance:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 
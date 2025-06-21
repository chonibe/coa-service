import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id, event_type, points, description } = body

    if (!customer_id || !event_type || !points) {
      return NextResponse.json(
        { error: "Customer ID, event type, and points are required" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Start a transaction
    const { data: transaction, error: transactionError } = await supabase
      .rpc('begin_transaction')

    if (transactionError) {
      throw transactionError
    }

    try {
      // Create reward event
      const { error: eventError } = await supabase
        .from("reward_events")
        .insert([{
          customer_id,
          event_type,
          points_earned: points,
          description
        }])

      if (eventError) {
        throw eventError
      }

      // Update customer rewards
      const { data: existingRewards, error: rewardsError } = await supabase
        .from("customer_rewards")
        .select("*")
        .eq("customer_id", customer_id)
        .single()

      if (rewardsError) {
        if (rewardsError.code === "PGRST116") {
          // Create new rewards record if doesn't exist
          const { error: createError } = await supabase
            .from("customer_rewards")
            .insert([{
              customer_id,
              points
            }])

          if (createError) {
            throw createError
          }
        } else {
          throw rewardsError
        }
      } else {
        // Update existing rewards
        const { error: updateError } = await supabase
          .from("customer_rewards")
          .update({
            points: existingRewards.points + points,
            updated_at: new Date().toISOString()
          })
          .eq("customer_id", customer_id)

        if (updateError) {
          throw updateError
        }
      }

      // Commit transaction
      const { error: commitError } = await supabase
        .rpc('commit_transaction')

      if (commitError) {
        throw commitError
      }

      // Get updated rewards data
      const { data: updatedRewards, error: fetchError } = await supabase
        .from("customer_rewards")
        .select("*")
        .eq("customer_id", customer_id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return NextResponse.json({
        success: true,
        points_earned: points,
        total_points: updatedRewards.points,
        level: updatedRewards.level
      })
    } catch (error) {
      // Rollback transaction on error
      await supabase.rpc('rollback_transaction')
      throw error
    }
  } catch (error: any) {
    console.error("Error awarding points:", error)
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 
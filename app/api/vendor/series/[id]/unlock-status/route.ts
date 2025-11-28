import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { checkTimeBasedUnlock, getUnlockCountdown } from "@/lib/unlocks/time-based"
import type { UnlockConfig } from "@/types/artwork-series"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const seriesId = params.id

    // Get series with unlock config
    const { data: series, error: seriesError } = await supabase
      .from("artwork_series")
      .select("id, unlock_type, unlock_config, unlock_schedule")
      .eq("id", seriesId)
      .eq("vendor_name", vendorName)
      .single()

    if (seriesError || !series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 })
    }

    // Get series members
    const { data: members, error: membersError } = await supabase
      .from("artwork_series_members")
      .select("id, unlock_at, is_locked")
      .eq("series_id", seriesId)

    if (membersError) {
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
    }

    const now = new Date()
    const unlockStatus: Record<string, any> = {}

    // Check time-based unlocks
    if (series.unlock_type === "time_based") {
      const config = series.unlock_config as UnlockConfig
      
      members?.forEach((member) => {
        if (member.unlock_at) {
          // Member-specific unlock time
          const isUnlocked = new Date(member.unlock_at) <= now
          unlockStatus[member.id] = {
            isUnlocked,
            unlockAt: member.unlock_at,
            countdown: getUnlockCountdown({ unlock_at: member.unlock_at }, now),
          }
        } else if (series.unlock_schedule) {
          // Series-level schedule
          const isUnlocked = checkTimeBasedUnlock(
            {
              unlock_schedule: series.unlock_schedule as any,
            },
            now
          )
          unlockStatus[member.id] = {
            isUnlocked,
            countdown: getUnlockCountdown(
              { unlock_schedule: series.unlock_schedule as any },
              now
            ),
          }
        }
      })
    }

    return NextResponse.json({
      seriesId,
      unlockType: series.unlock_type,
      members: unlockStatus,
    })
  } catch (error: any) {
    console.error("Error in GET /api/vendor/series/[id]/unlock-status:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


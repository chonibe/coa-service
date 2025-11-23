import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const vendorName = searchParams.get("vendorName")

  // Auth check
  if (vendorName) {
    const cookieStore = cookies()
    const sessionVendorName = getVendorFromCookieStore(cookieStore)
    if (sessionVendorName !== vendorName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  } else {
    const auth = guardAdminRequest(request)
    if (auth.kind !== "ok") {
      return auth.response
    }
  }

  try {
    const supabase = createClient()

    let query = supabase.from("payout_disputes").select("*").order("created_at", { ascending: false })

    if (vendorName) {
      query = query.eq("vendor_name", vendorName)
    }

    const { data: disputes, error } = await query

    if (error) {
      console.error("Error fetching disputes:", error)
      return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 })
    }

    // Get comments for each dispute
    const disputesWithComments = await Promise.all(
      (disputes || []).map(async (dispute) => {
        const { data: comments } = await supabase
          .from("payout_dispute_comments")
          .select("*")
          .eq("dispute_id", dispute.id)
          .order("created_at", { ascending: true })

        return {
          ...dispute,
          comments: comments || [],
        }
      })
    )

    return NextResponse.json({ disputes: disputesWithComments })
  } catch (error) {
    console.error("Error in disputes route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payoutId, reason, priority, vendorName } = body

    // Auth check
    if (vendorName) {
      const cookieStore = cookies()
      const sessionVendorName = getVendorFromCookieStore(cookieStore)
      if (sessionVendorName !== vendorName) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } else {
      const auth = guardAdminRequest(request)
      if (auth.kind !== "ok") {
        return auth.response
      }
    }

    const supabase = createClient()

    // Get payout amount
    const { data: payout } = await supabase
      .from("vendor_payouts")
      .select("amount")
      .eq("id", payoutId)
      .single()

    const { data: dispute, error } = await supabase
      .from("payout_disputes")
      .insert({
        payout_id: payoutId,
        vendor_name: vendorName,
        amount: payout?.amount || 0,
        reason,
        priority,
        status: "open",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating dispute:", error)
      return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 })
    }

    return NextResponse.json({ dispute })
  } catch (error) {
    console.error("Error in disputes POST route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== "ok") {
    return auth.response
  }

  try {
    const body = await request.json()
    const supabase = createClient()

    const { data: dispute, error } = await supabase
      .from("payout_disputes")
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating dispute:", error)
      return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 })
    }

    return NextResponse.json({ dispute })
  } catch (error) {
    console.error("Error in dispute PUT route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



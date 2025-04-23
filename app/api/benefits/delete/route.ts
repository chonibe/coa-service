import { NextResponse } from "next/server"
import type { NextRequest } from "next/request"
import { supabase } from "@/lib/supabase"

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Benefit ID is required" }, { status: 400 })
    }

    // Check if there are any claims for this benefit
    const { data: claims, error: claimsError } = await supabase
      .from("collector_benefit_claims")
      .select("id")
      .eq("product_benefit_id", id)
      .limit(1)

    if (claimsError) {
      throw claimsError
    }

    if (claims && claims.length > 0) {
      // If claims exist, just mark as inactive instead of deleting
      const { error: updateError } = await supabase
        .from("product_benefits")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        message: "Benefit has been deactivated because it has been claimed by collectors",
      })
    } else {
      // If no claims, delete the benefit
      const { error: deleteError } = await supabase.from("product_benefits").delete().eq("id", id)

      if (deleteError) {
        throw deleteError
      }

      return NextResponse.json({ success: true, message: "Benefit deleted successfully" })
    }
  } catch (error: any) {
    console.error("Error deleting benefit:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

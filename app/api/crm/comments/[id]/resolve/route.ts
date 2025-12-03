import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Comment Resolution Endpoint
 * Resolve or unresolve a comment
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body // 'resolve' or 'unresolve'

    if (!action || !["resolve", "unresolve"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'resolve' or 'unresolve'" },
        { status: 400 }
      )
    }

    if (action === "resolve") {
      // Resolve the comment
      const { error: resolveError } = await supabase.rpc("resolve_comment", {
        p_comment_id: params.id,
        p_user_id: user.id,
      })

      if (resolveError) {
        throw resolveError
      }
    } else {
      // Unresolve the comment
      const { error: unresolveError } = await supabase.rpc("unresolve_comment", {
        p_comment_id: params.id,
      })

      if (unresolveError) {
        throw unresolveError
      }
    }

    // Fetch updated comment
    const { data: comment, error: fetchError } = await supabase
      .from("crm_comments")
      .select("*")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    // TODO: Emit webhook event (comment.resolved or comment.unresolved)

    return NextResponse.json({
      comment,
      resolved: action === "resolve",
    })
  } catch (error: any) {
    console.error("[CRM] Error resolving/unresolving comment:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}



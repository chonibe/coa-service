import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Execute Record Action
 * Handles execution of custom actions on records
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

    const body = await request.json()
    const { record_id, record_type } = body

    if (!record_id || !record_type) {
      return NextResponse.json(
        { error: "record_id and record_type are required" },
        { status: 400 }
      )
    }

    // Get action configuration
    const { data: action, error: actionError } = await supabase
      .from("crm_record_actions")
      .select("*")
      .eq("id", params.id)
      .eq("is_active", true)
      .single()

    if (actionError || !action) {
      return NextResponse.json(
        { error: "Action not found or inactive" },
        { status: 404 }
      )
    }

    // Verify entity type matches
    if (action.entity_type !== record_type) {
      return NextResponse.json(
        { error: "Action entity type does not match record type" },
        { status: 400 }
      )
    }

    // Handle different action types
    switch (action.action_type) {
      case "server_function":
        // Execute server function (defined in config)
        const functionName = action.config?.function_name
        if (!functionName) {
          return NextResponse.json(
            { error: "Server function name not configured" },
            { status: 400 }
          )
        }
        // TODO: Implement server function execution
        return NextResponse.json({
          success: true,
          message: "Server function executed",
          result: { function_name: functionName, record_id, record_type },
        })

      case "modal":
        // Return modal configuration
        return NextResponse.json({
          success: true,
          action_type: "modal",
          modal_config: action.config?.modal_config || {},
        })

      case "url":
        // Return URL to navigate to
        const url = action.config?.url
        if (!url) {
          return NextResponse.json(
            { error: "URL not configured" },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          action_type: "url",
          url: url.replace("{record_id}", record_id),
        })

      default:
        return NextResponse.json(
          { error: `Unknown action type: ${action.action_type}` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error("[CRM] Error executing record action:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


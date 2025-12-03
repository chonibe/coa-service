import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Update Person Status API
 * Updates the status value for a person record
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const { id } = params
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { field_id, value } = body

    if (!field_id || value === undefined) {
      return NextResponse.json(
        { error: "field_id and value are required" },
        { status: 400 }
      )
    }

    // Get the current value to check for transition validation
    const { data: currentValue, error: currentValueError } = await supabase
      .from("crm_custom_field_values")
      .select("value")
      .eq("field_id", field_id)
      .eq("entity_type", "person")
      .eq("entity_id", id)
      .is("active_until", null)
      .single()

    const currentStatus = currentValue?.value

    // Validate status transition if workflow exists
    if (currentStatus && currentStatus !== value) {
      const { data: field, error: fieldError } = await supabase
        .from("crm_custom_fields")
        .select("status_workflow")
        .eq("id", field_id)
        .single()

      if (!fieldError && field?.status_workflow) {
        const workflow = field.status_workflow as any
        if (workflow.transitions && Array.isArray(workflow.transitions)) {
          const isValidTransition = workflow.transitions.some(
            (t: any) => t.from === currentStatus && t.to === value
          )

          // Allow if it's a valid transition or if no transitions are defined
          if (workflow.transitions.length > 0 && !isValidTransition) {
            return NextResponse.json(
              {
                error: "Invalid status transition",
                message: `Cannot transition from "${currentStatus}" to "${value}"`,
              },
              { status: 400 }
            )
          }
        }
      }
    }

    // Mark old value as inactive
    if (currentValue) {
      await supabase
        .from("crm_custom_field_values")
        .update({ active_until: new Date().toISOString() })
        .eq("field_id", field_id)
        .eq("entity_type", "person")
        .eq("entity_id", id)
        .is("active_until", null)
    }

    // Insert new value
    const { data: newValue, error: insertError } = await supabase
      .from("crm_custom_field_values")
      .insert({
        field_id,
        entity_type: "person",
        entity_id: id,
        value: typeof value === "string" ? value : JSON.stringify(value),
        active_from: new Date().toISOString(),
        created_by_actor_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Emit webhook event
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "record.updated",
          payload: {
            object: "person",
            record_id: id,
            attribute: {
              id: field_id,
              value: value,
            },
            actor: {
              type: "user",
              id: user.id,
            },
          },
        }),
      })
    } catch (webhookError) {
      console.error("[Status Update] Error emitting webhook:", webhookError)
    }

    return NextResponse.json({
      success: true,
      value: newValue,
    })
  } catch (error: any) {
    console.error("[Status Update] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}



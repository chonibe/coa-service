import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateWebhookFilter } from "@/lib/crm/webhook-filter-evaluator"

/**
 * CRM Webhooks API
 * Manage webhook subscriptions with filtering support
 */

// GET: List webhook subscriptions
export async function GET(request: NextRequest) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("crm_webhook_subscriptions")
      .select("*")
      .eq("created_by_user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      webhooks: data || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching webhooks:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST: Create webhook subscription
export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { url, secret, events, filter } = body

    if (!url || !secret || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "url, secret, and events (array) are required" },
        { status: 400 }
      )
    }

    // Validate filter if provided
    if (filter) {
      const validation = validateWebhookFilter(filter)
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid filter: ${validation.error}` },
          { status: 400 }
        )
      }
    }

    const { data, error } = await supabase
      .from("crm_webhook_subscriptions")
      .insert({
        url,
        secret,
        events,
        filter: filter || null,
        created_by_user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(
      {
        webhook: data,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[CRM] Error creating webhook:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


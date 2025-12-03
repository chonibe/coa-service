import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * AI Insights API - Generate AI insights for records
 */

export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const isAdmin = user.email && process.env.ADMIN_EMAILS?.split(",").includes(user.email)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { entity_type, entity_id, insight_type } = body

    if (!entity_type || !entity_id || !insight_type) {
      return NextResponse.json(
        { error: "entity_type, entity_id, and insight_type are required" },
        { status: 400 }
      )
    }

    // TODO: Implement actual AI insight generation
    // This would call OpenAI, Anthropic, or custom AI service
    // For now, return placeholder structure

    let insightData = {}

    switch (insight_type) {
      case "summary":
        insightData = {
          summary: "Customer summary would be generated here",
          key_points: [],
        }
        break
      case "segmentation":
        insightData = {
          segment: "vip",
          reasoning: "High-value customer based on order history",
        }
        break
      case "scoring":
        insightData = {
          score: 85,
          factors: ["High order frequency", "Large order value"],
        }
        break
      case "recommendation":
        insightData = {
          recommendations: [
            "Consider offering VIP benefits",
            "Reach out for feedback",
          ],
        }
        break
      default:
        insightData = {}
    }

    // Store insight
    const { data: insight, error: insightError } = await supabase
      .from("crm_ai_insights")
      .upsert({
        entity_type,
        entity_id,
        insight_type,
        insight_data: insightData,
        confidence_score: 0.85,
        source: "ai",
        model_version: "placeholder",
      }, {
        onConflict: "entity_type,entity_id,insight_type",
      })
      .select()
      .single()

    if (insightError) {
      throw insightError
    }

    return NextResponse.json({
      success: true,
      insight,
      message: "Insight generated (placeholder - implement AI service integration)",
    })
  } catch (error: any) {
    console.error("[CRM] Error generating insight:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  try {
    if (!supabase) {
      throw new Error("Database client not initialized")
    }

    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get("entity_type")
    const entityId = searchParams.get("entity_id")
    const insightType = searchParams.get("insight_type")

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entity_type and entity_id are required" },
        { status: 400 }
      )
    }

    let query = supabase
      .from("crm_ai_insights")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("is_active", true)

    if (insightType) {
      query = query.eq("insight_type", insightType)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      insights: data || [],
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching insights:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


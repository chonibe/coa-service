import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Facebook Connection API - Initiate Facebook OAuth for Pages
 */

export async function GET(request: NextRequest) {
  // Facebook OAuth flow initiation
  // This would redirect to Facebook OAuth
  // For now, return instructions
  
  return NextResponse.json({
    message: "Facebook OAuth connection",
    instructions: "This endpoint will initiate Facebook OAuth flow to connect Facebook Pages",
    note: "Implementation requires Facebook App setup and OAuth configuration",
  })
}

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
    const {
      account_name,
      page_id,
      page_name,
      access_token,
      token_expires_at,
    } = body

    if (!account_name || !page_id || !page_name || !access_token) {
      return NextResponse.json(
        { error: "account_name, page_id, page_name, and access_token are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("crm_facebook_accounts")
      .insert({
        user_id: user.id,
        account_name,
        page_id,
        page_name,
        access_token, // In production, encrypt this
        token_expires_at,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Don't return sensitive tokens
    const sanitized = {
      ...data,
      access_token: "***",
    }

    return NextResponse.json({
      account: sanitized,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating Facebook account:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


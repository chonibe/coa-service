import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * WhatsApp Connection API - Connect WhatsApp Business API
 */

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "WhatsApp Business API connection",
    instructions: "This endpoint manages WhatsApp Business API connections",
    note: "Implementation requires WhatsApp Business API credentials",
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
      phone_number,
      business_account_id,
      api_credentials,
      webhook_url,
    } = body

    if (!account_name || !phone_number || !api_credentials) {
      return NextResponse.json(
        { error: "account_name, phone_number, and api_credentials are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("crm_whatsapp_accounts")
      .insert({
        user_id: user.id,
        account_name,
        phone_number,
        business_account_id,
        api_credentials, // In production, encrypt this
        webhook_url,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Don't return sensitive credentials
    const sanitized = {
      ...data,
      api_credentials: "***",
    }

    return NextResponse.json({
      account: sanitized,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating WhatsApp account:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Email Accounts API - Manage multiple email accounts
 */

export async function GET(request: NextRequest) {
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

    const { data, error } = await supabase
      .from("crm_email_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Don't return sensitive tokens
    const sanitized = (data || []).map(account => ({
      ...account,
      access_token: account.access_token ? "***" : null,
      refresh_token: account.refresh_token ? "***" : null,
    }))

    return NextResponse.json({
      accounts: sanitized,
    })
  } catch (error: any) {
    console.error("[CRM] Error fetching email accounts:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
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
      email_address,
      provider,
      access_token,
      refresh_token,
      token_expires_at,
      provider_account_id,
      is_default,
    } = body

    if (!account_name || !email_address || !provider) {
      return NextResponse.json(
        { error: "account_name, email_address, and provider are required" },
        { status: 400 }
      )
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await supabase
        .from("crm_email_accounts")
        .update({ is_default: false })
        .eq("user_id", user.id)
    }

    const { data, error } = await supabase
      .from("crm_email_accounts")
      .insert({
        user_id: user.id,
        account_name,
        email_address,
        provider,
        access_token, // In production, encrypt this
        refresh_token, // In production, encrypt this
        token_expires_at,
        provider_account_id,
        is_default: is_default || false,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Don't return sensitive tokens
    const sanitized = {
      ...data,
      access_token: data.access_token ? "***" : null,
      refresh_token: data.refresh_token ? "***" : null,
    }

    return NextResponse.json({
      account: sanitized,
    }, { status: 201 })
  } catch (error: any) {
    console.error("[CRM] Error creating email account:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


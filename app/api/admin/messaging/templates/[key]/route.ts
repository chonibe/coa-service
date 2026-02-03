import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { getDefaultTemplate } from "@/lib/email/template-service"

/**
 * GET /api/admin/messaging/templates/[key]
 * Get a specific email template by key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(token)
  if (!adminSession?.email) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()
  const { key } = params

  try {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", key)
      .single()

    if (error) {
      console.error("[Messaging API] Error fetching template:", error)
      return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 })
    }

    // Also get the default template for comparison/reset
    const defaultTemplate = getDefaultTemplate(key)

    return NextResponse.json({
      success: true,
      template: data,
      defaultTemplate,
    })
  } catch (error: any) {
    console.error("[Messaging API] Error:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}

/**
 * PUT /api/admin/messaging/templates/[key]
 * Update a specific email template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(token)
  if (!adminSession?.email) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()
  const { key } = params

  try {
    const body = await request.json()
    const { subject, html_body, enabled } = body

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (subject !== undefined) updateData.subject = subject
    if (html_body !== undefined) updateData.html_body = html_body
    if (enabled !== undefined) updateData.enabled = enabled

    const { data, error } = await supabase
      .from("email_templates")
      .update(updateData)
      .eq("template_key", key)
      .select()
      .single()

    if (error) {
      console.error("[Messaging API] Error updating template:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      template: data,
    })
  } catch (error: any) {
    console.error("[Messaging API] Error:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}

/**
 * POST /api/admin/messaging/templates/[key]/reset
 * Reset a template to its default values
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  const adminSession = verifyAdminSessionToken(token)
  if (!adminSession?.email) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()
  const { key } = params

  try {
    const body = await request.json()
    const { action } = body

    if (action === "reset") {
      const defaultTemplate = getDefaultTemplate(key)

      if (!defaultTemplate) {
        return NextResponse.json({ success: false, message: "No default template found" }, { status: 404 })
      }

      const { data, error } = await supabase
        .from("email_templates")
        .update({
          subject: defaultTemplate.subject,
          html_body: defaultTemplate.html,
          updated_at: new Date().toISOString(),
        })
        .eq("template_key", key)
        .select()
        .single()

      if (error) {
        console.error("[Messaging API] Error resetting template:", error)
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        template: data,
        message: "Template reset to default",
      })
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[Messaging API] Error:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}

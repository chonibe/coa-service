import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { interpolateTemplate, SAMPLE_DATA } from "@/lib/email/template-service"

/**
 * GET /api/admin/messaging/templates/[key]/preview
 * Get a preview of the template with sample data
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
    // Get the template
    const { data: template, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", key)
      .single()

    if (error || !template) {
      return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 })
    }

    // Get sample data for this template
    const sampleData = SAMPLE_DATA[key] || {}

    // Interpolate the template with sample data
    const subject = interpolateTemplate(template.subject, sampleData)
    const html = interpolateTemplate(template.html_body, sampleData)

    return NextResponse.json({
      success: true,
      preview: {
        subject,
        html,
        sampleData,
      },
    })
  } catch (error: any) {
    console.error("[Messaging API] Error generating preview:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}

/**
 * POST /api/admin/messaging/templates/[key]/preview
 * Generate a preview with custom subject/body (for live preview while editing)
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

  const { key } = params

  try {
    const body = await request.json()
    const { subject, html_body, customVariables } = body

    // Get sample data for this template
    const sampleData = customVariables || SAMPLE_DATA[key] || {}

    // Interpolate with provided content
    const renderedSubject = interpolateTemplate(subject || "", sampleData)
    const renderedHtml = interpolateTemplate(html_body || "", sampleData)

    return NextResponse.json({
      success: true,
      preview: {
        subject: renderedSubject,
        html: renderedHtml,
        sampleData,
      },
    })
  } catch (error: any) {
    console.error("[Messaging API] Error generating preview:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}

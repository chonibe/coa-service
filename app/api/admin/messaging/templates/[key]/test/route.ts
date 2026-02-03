import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"
import { sendEmail } from "@/lib/email/client"
import { interpolateTemplate, SAMPLE_DATA } from "@/lib/email/template-service"

/**
 * POST /api/admin/messaging/templates/[key]/test
 * Send a test email using the specified template
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
    const { email, customVariables } = body

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, message: "Valid email address required" }, { status: 400 })
    }

    // Get the template
    const { data: template, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", key)
      .single()

    if (error || !template) {
      return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 })
    }

    // Use custom variables if provided, otherwise use sample data
    const variables = customVariables || SAMPLE_DATA[key] || {}

    // Interpolate the template
    const subject = `[TEST] ${interpolateTemplate(template.subject, variables)}`
    const html = interpolateTemplate(template.html_body, variables)

    // Send the test email
    const result = await sendEmail({
      to: email,
      subject,
      html,
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.error || "Failed to send test email",
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      messageId: result.messageId,
    })
  } catch (error: any) {
    console.error("[Messaging API] Error sending test email:", error)
    return NextResponse.json({ success: false, message: error.message || "An error occurred" }, { status: 500 })
  }
}

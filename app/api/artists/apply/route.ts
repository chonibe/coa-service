import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/client"
import { getArtistApplicationNotifyRecipients } from "@/lib/constants/artist-application-notify"
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ApplyPayload {
  name?: string
  email?: string
  instagram?: string
  portfolio?: string
  bio?: string
}

function sanitize(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function POST(request: NextRequest) {
  let body: ApplyPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const name = sanitize(body.name)
  const email = sanitize(body.email)?.toLowerCase() ?? null
  const instagram = sanitize(body.instagram)
  const portfolio = sanitize(body.portfolio)
  const bio = sanitize(body.bio)

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
  }
  if (!instagram && !portfolio) {
    return NextResponse.json(
      { error: "Please share either an Instagram handle or a portfolio link." },
      { status: 400 },
    )
  }

  try {
    const supabase = createClient()

    // Gracefully de-duplicate: if the same email applied in the past 24 hours, no-op
    const { data: existing } = await supabase
      .from("artist_applications")
      .select("id, created_at")
      .ilike("email", email)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        deduped: true,
        message: "We've got your application and will follow up from the same inbox.",
      })
    }

    const { error } = await supabase.from("artist_applications").insert({
      name,
      email,
      instagram,
      portfolio_url: portfolio,
      bio,
    })

    if (error) {
      console.error("[artists/apply] Insert error", error)
      return NextResponse.json(
        { error: "We couldn't save your application. Please try again." },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[artists/apply] Unexpected error", error)
    return NextResponse.json(
      { error: "We couldn't save your application. Please try again." },
      { status: 500 },
    )
  }

  // Notify the team — best-effort, don't fail the applicant if email fails.
  try {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
        <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 20px;">New artist application</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(email)}</td></tr>
          ${instagram ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Instagram:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(instagram)}</td></tr>` : ""}
          ${portfolio ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Portfolio:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="${escapeHtml(portfolio)}">${escapeHtml(portfolio)}</a></td></tr>` : ""}
        </table>
        ${bio ? `<h2 style="font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 8px;">Bio</h2><p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(bio)}</p>` : ""}
        <p style="margin-top: 24px; font-size: 12px; color: #666;">Submitted via /for-artists/apply</p>
      </div>
    `
    await sendEmail({
      to: getArtistApplicationNotifyRecipients(),
      subject: `Artist application: ${name}`,
      html,
      replyTo: email,
    })
  } catch (error) {
    console.error("[artists/apply] Notification email failed", error)
  }

  return NextResponse.json({ success: true })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
